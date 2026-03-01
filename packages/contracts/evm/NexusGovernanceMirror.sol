// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*  ___  _  ___ _  _ ___   ___  ___
   |   \| || __| \| | __| / _ \/ __|
   | |) | || _|| .` | _| | (_) \__ \
   |___/|_||___|_|\_|___| \___/|___/

   NexusGovernanceMirror  --  Spoke-chain voting mirror
   Deployed on: XRPL EVM (1440000) | Arbitrum (42161) | HyperEVM
   Broadcasts vote deltas to the Base hub via Axelar GMP.
*/

// ──────────────────────────────────────────────────────────────────────────────
//  Minimal Axelar Interfaces (inline — no external imports required)
// ──────────────────────────────────────────────────────────────────────────────

/// @notice Minimal IAxelarGateway for outbound `callContract` and inbound validation.
interface IAxelarGateway {
    function callContract(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload
    ) external;

    function validateContractCall(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash
    ) external returns (bool);
}

/// @notice Minimal IAxelarGasService — used to pre-pay relayer gas on the source chain.
interface IAxelarGasService {
    function payNativeGasForContractCall(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        address refundAddress
    ) external payable;
}

/// @notice Abstract base that Axelar GMP receivers inherit.
abstract contract AxelarExecutable {
    IAxelarGateway public immutable gateway;

    constructor(address gateway_) {
        gateway = IAxelarGateway(gateway_);
    }

    /// @dev Called by the Axelar relayer. Validates the command, then forwards to `_execute`.
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
        require(
            gateway.validateContractCall(commandId, sourceChain, sourceAddress, keccak256(payload)),
            "AxelarExecutable: NOT_APPROVED"
        );
        _execute(sourceChain, sourceAddress, payload);
    }

    /// @dev Override in child contract to handle inbound cross-chain messages.
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;
}

// ──────────────────────────────────────────────────────────────────────────────
//  Minimal IERC20 (balanceOf only)
// ──────────────────────────────────────────────────────────────────────────────

/// @notice Minimal ERC-20 interface — only `balanceOf` is needed on the spoke.
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

// ──────────────────────────────────────────────────────────────────────────────
//  NexusGovernanceMirror
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @title  NexusGovernanceMirror
 * @author Nexus DAO
 * @notice Spoke-chain governance mirror. Receives proposal announcements from the
 *         Base hub, collects local votes weighted by NXS balance + delegated power,
 *         and broadcasts vote deltas back to the hub via Axelar GMP.
 *
 *         Spokes never execute proposals — they only contribute vote weight.
 */
contract NexusGovernanceMirror is AxelarExecutable {
    // ── Types ────────────────────────────────────────────────────────────────

    /// @notice Vote choices available to local voters.
    enum Vote {
        For,
        Against,
        Abstain
    }

    /// @notice Minimal on-chain representation of a hub proposal.
    struct MirroredProposal {
        uint64  id;
        uint64  start;       // block.timestamp when voting opens
        uint64  end;         // block.timestamp when voting closes
        uint256 localYes;
        uint256 localNo;
        uint256 localAbstain;
        bool    active;
    }

    // ── Payload Selectors ────────────────────────────────────────────────────

    /// @dev Selector for inbound "proposal created" messages from the hub.
    bytes32 public constant PROPOSAL_CREATED = keccak256("PROPOSAL_CREATED");

    /// @dev Selector for outbound vote-delta messages sent to the hub.
    bytes32 public constant VOTE_DELTA = keccak256("VOTE_DELTA");

    /// @dev Selector for optional future inbound finalized-result messages.
    bytes32 public constant RESULT_BROADCAST = keccak256("RESULT_BROADCAST");

    // ── State ────────────────────────────────────────────────────────────────

    /// @notice NXS token on this spoke chain.
    IERC20 public immutable nxs;

    /// @notice Axelar gas-service contract (optional; set to address(0) to skip).
    IAxelarGasService public immutable gasService;

    /// @notice Contract owner — can configure hub & allowed sources.
    address public owner;

    /// @notice Axelar chain name of the hub (e.g. "base").
    string public hubChain;

    /// @notice String-encoded address of the NexusGovernanceHub on the hub chain.
    string public hubAddress;

    /// @notice Monotonically increasing nonce appended to every broadcast.
    uint256 public broadcastNonce;

    /// @notice Mirrored proposals keyed by proposal id.
    mapping(uint64 => MirroredProposal) public proposals;

    /// @notice Tracks whether `voter` has already voted on proposal `id`.
    mapping(uint64 => mapping(address => bool)) public voted;

    /// @notice Local delegation: delegator => operator.
    mapping(address => address) public localDelegation;

    /// @notice Sum of NXS balances delegated *to* a given operator.
    ///         Updated lazily — see `_refreshDelegatedPower`.
    mapping(address => uint256) internal _delegatedPower;

    /// @notice Set of delegators pointing to a given operator (for enumeration).
    mapping(address => address[]) internal _delegatorsOf;

    /// @notice Allowed remote sources: keccak256(chainName, addr) => allowed.
    mapping(bytes32 => bool) public allowedSource;

    /// @notice Anti-replay guard for inbound Axelar messages.
    mapping(bytes32 => bool) public processedMessage;

    // ── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a vote delta is broadcast to the hub.
    event VoteBroadcast(
        uint64  indexed proposalId,
        uint256 yesDelta,
        uint256 noDelta,
        uint256 abstainDelta,
        uint256 nonce
    );

    /// @notice Emitted when a proposal is mirrored from the hub.
    event ProposalMirrored(uint64 indexed proposalId, uint64 start, uint64 end);

    /// @notice Emitted on any valid inbound cross-chain message.
    event RemoteMessageReceived(string sourceChain, string sourceAddress, bytes32 kind);

    /// @notice Emitted when a voter delegates to an operator.
    event DelegationCreated(address indexed delegator, address indexed operator);

    /// @notice Emitted when a delegation is revoked.
    event DelegationRevoked(address indexed delegator, address indexed previousOperator);

    /// @notice Emitted when ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Emitted when a new remote source is registered.
    event AllowedSourceRegistered(string chainName, string addr);

    // ── Errors ───────────────────────────────────────────────────────────────

    error NotOwner();
    error ProposalNotActive();
    error VotingNotOpen();
    error AlreadyVoted();
    error ZeroVotingPower();
    error HubNotConfigured();
    error UnauthorizedSource();
    error AlreadyProcessed();
    error InvalidDelegation();
    error AlreadyDelegated();

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param gateway_    Axelar Gateway address on this chain.
     * @param gasService_ Axelar Gas Service address (set address(0) to skip gas pre-pay).
     * @param nxs_        NXS ERC-20 token address on this chain.
     * @param owner_      Initial contract owner.
     */
    constructor(
        address gateway_,
        address gasService_,
        address nxs_,
        address owner_
    ) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasService_);
        nxs        = IERC20(nxs_);
        owner      = owner_;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Configure the hub chain name and contract address.
     * @param chainName Axelar-registered chain name (e.g. "base").
     * @param addr      String-encoded hub contract address.
     */
    function setHub(string calldata chainName, string calldata addr) external onlyOwner {
        hubChain   = chainName;
        hubAddress = addr;
        // Automatically allow the hub as an inbound source.
        _setAllowedSource(chainName, addr);
    }

    /**
     * @notice Register an additional allowed inbound source.
     * @param chainName Axelar chain name.
     * @param addr      String-encoded contract address on that chain.
     */
    function registerAllowedSource(string calldata chainName, string calldata addr) external onlyOwner {
        _setAllowedSource(chainName, addr);
    }

    /**
     * @notice Transfer contract ownership.
     * @param newOwner Address of the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  LOCAL DELEGATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Delegate your local voting power to `operator`.
     *         A delegator cannot vote directly while delegated — the operator
     *         votes on their behalf using the combined weight.
     * @param operator The address that will vote with your weight.
     */
    function delegate(address operator) external {
        if (operator == address(0) || operator == msg.sender) revert InvalidDelegation();
        if (localDelegation[msg.sender] != address(0)) revert AlreadyDelegated();

        localDelegation[msg.sender] = operator;
        _delegatorsOf[operator].push(msg.sender);

        emit DelegationCreated(msg.sender, operator);
    }

    /**
     * @notice Revoke your current delegation.
     */
    function undelegate() external {
        address prev = localDelegation[msg.sender];
        if (prev == address(0)) revert InvalidDelegation();

        localDelegation[msg.sender] = address(0);
        _removeDelegator(prev, msg.sender);

        emit DelegationRevoked(msg.sender, prev);
    }

    /**
     * @notice Returns the total NXS balance delegated *to* `voter` by others.
     * @dev    Computed live — iterates the delegators array.
     */
    function localDelegatedPowerOf(address voter) public view returns (uint256 power) {
        address[] storage delegators = _delegatorsOf[voter];
        uint256 len = delegators.length;
        for (uint256 i; i < len; ) {
            power += nxs.balanceOf(delegators[i]);
            unchecked { ++i; }
        }
    }

    /**
     * @notice Total local voting power of `voter`: own NXS balance + delegated power.
     *         Returns 0 if the voter has delegated their power to someone else.
     */
    function localVotingPowerOf(address voter) public view returns (uint256) {
        // If `voter` has delegated away, their own power is zero on this contract.
        if (localDelegation[voter] != address(0)) return 0;
        return nxs.balanceOf(voter) + localDelegatedPowerOf(voter);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  LOCAL VOTING
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Cast a vote on a mirrored proposal.
     * @dev    Reads NXS balance + delegated power at call-time (no snapshots on spoke).
     *         Immediately broadcasts the delta to the hub via Axelar GMP.
     *         Send ETH with the call to pre-pay Axelar relayer gas.
     * @param id     Proposal id (must be active and within voting window).
     * @param choice Vote.For, Vote.Against, or Vote.Abstain.
     */
    function vote(uint64 id, Vote choice) external payable {
        MirroredProposal storage p = proposals[id];
        if (!p.active) revert ProposalNotActive();
        if (block.timestamp < p.start || block.timestamp > p.end) revert VotingNotOpen();
        if (voted[id][msg.sender]) revert AlreadyVoted();

        uint256 power = localVotingPowerOf(msg.sender);
        if (power == 0) revert ZeroVotingPower();

        voted[id][msg.sender] = true;

        uint256 yesDelta;
        uint256 noDelta;
        uint256 abstainDelta;

        if (choice == Vote.For) {
            p.localYes += power;
            yesDelta = power;
        } else if (choice == Vote.Against) {
            p.localNo += power;
            noDelta = power;
        } else {
            p.localAbstain += power;
            abstainDelta = power;
        }

        _broadcastVoteDelta(id, yesDelta, noDelta, abstainDelta);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  AXELAR OUTBOUND — BROADCAST TO HUB
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Encode and send a VOTE_DELTA message to the hub via Axelar GMP.
     *      If `msg.value > 0` and gasService is configured, pre-pays relayer gas.
     */
    function _broadcastVoteDelta(
        uint64  id,
        uint256 yesDelta,
        uint256 noDelta,
        uint256 abstainDelta
    ) internal {
        if (bytes(hubChain).length == 0) revert HubNotConfigured();

        uint256 nonce = broadcastNonce++;

        bytes memory payload = abi.encode(
            VOTE_DELTA,
            id,
            yesDelta,
            noDelta,
            abstainDelta,
            nonce
        );

        // Optional gas pre-payment for the Axelar relayer.
        if (msg.value > 0 && address(gasService) != address(0)) {
            gasService.payNativeGasForContractCall{value: msg.value}(
                address(this),
                hubChain,
                hubAddress,
                payload,
                msg.sender  // refund address
            );
        }

        gateway.callContract(hubChain, hubAddress, payload);

        emit VoteBroadcast(id, yesDelta, noDelta, abstainDelta, nonce);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  AXELAR INBOUND — RECEIVE FROM HUB
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Handle inbound Axelar GMP messages.
     *      - PROPOSAL_CREATED  : mirror a new proposal from the hub.
     *      - RESULT_BROADCAST  : (future) receive finalized results.
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // ── Source validation ─────────────────────────────────────────────
        bytes32 sourceKey = keccak256(abi.encodePacked(sourceChain, sourceAddress));
        if (!allowedSource[sourceKey]) revert UnauthorizedSource();

        // ── Anti-replay ──────────────────────────────────────────────────
        bytes32 msgHash = keccak256(payload);
        if (processedMessage[msgHash]) revert AlreadyProcessed();
        processedMessage[msgHash] = true;

        // ── Decode selector ──────────────────────────────────────────────
        bytes32 kind = abi.decode(payload, (bytes32));

        emit RemoteMessageReceived(sourceChain, sourceAddress, kind);

        if (kind == PROPOSAL_CREATED) {
            _handleProposalCreated(payload);
        } else if (kind == RESULT_BROADCAST) {
            _handleResultBroadcast(payload);
        }
        // Unknown selectors are silently ignored (forward-compatible).
    }

    /**
     * @dev Decode and store a mirrored proposal.
     *      Payload: (PROPOSAL_CREATED, uint64 id, uint64 start, uint64 end)
     */
    function _handleProposalCreated(bytes calldata payload) internal {
        (, uint64 id, uint64 start, uint64 end) =
            abi.decode(payload, (bytes32, uint64, uint64, uint64));

        MirroredProposal storage p = proposals[id];
        // Idempotent — do not overwrite if already mirrored.
        if (p.id == 0) {
            p.id     = id;
            p.start  = start;
            p.end    = end;
            p.active = true;

            emit ProposalMirrored(id, start, end);
        }
    }

    /**
     * @dev Handle finalized results from the hub (future use).
     *      Payload: (RESULT_BROADCAST, uint64 id, uint8 outcome)
     *      For now, simply deactivates the local mirror.
     */
    function _handleResultBroadcast(bytes calldata payload) internal {
        (, uint64 id, ) = abi.decode(payload, (bytes32, uint64, uint8));

        MirroredProposal storage p = proposals[id];
        if (p.id != 0) {
            p.active = false;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  AUTO-MIRROR HELPER (first-vote fallback)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Manually create a mirrored proposal if the hub broadcast was missed.
     *         Only owner can do this to prevent griefing.
     * @param id    Proposal id on the hub.
     * @param start Voting-start timestamp.
     * @param end   Voting-end timestamp.
     */
    function mirrorProposal(uint64 id, uint64 start, uint64 end) external onlyOwner {
        MirroredProposal storage p = proposals[id];
        require(p.id == 0, "Already mirrored");
        p.id     = id;
        p.start  = start;
        p.end    = end;
        p.active = true;

        emit ProposalMirrored(id, start, end);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  INTERNAL HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    /// @dev Register a (chain, address) pair as an allowed inbound source.
    function _setAllowedSource(string calldata chainName, string calldata addr) internal {
        bytes32 key = keccak256(abi.encodePacked(chainName, addr));
        allowedSource[key] = true;
        emit AllowedSourceRegistered(chainName, addr);
    }

    /// @dev Remove `delegator` from the `_delegatorsOf[operator]` array (swap-and-pop).
    function _removeDelegator(address operator, address delegator) internal {
        address[] storage arr = _delegatorsOf[operator];
        uint256 len = arr.length;
        for (uint256 i; i < len; ) {
            if (arr[i] == delegator) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
            unchecked { ++i; }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  VIEW HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Returns the full mirrored proposal struct.
     * @param id Proposal id.
     */
    function getProposal(uint64 id)
        external
        view
        returns (
            uint64  proposalId,
            uint64  start,
            uint64  end,
            uint256 localYes,
            uint256 localNo,
            uint256 localAbstain,
            bool    active
        )
    {
        MirroredProposal storage p = proposals[id];
        return (p.id, p.start, p.end, p.localYes, p.localNo, p.localAbstain, p.active);
    }

    /**
     * @notice Check whether `voter` has voted on proposal `id`.
     */
    function hasVoted(uint64 id, address voter) external view returns (bool) {
        return voted[id][voter];
    }

    /**
     * @notice Number of addresses currently delegating to `operator`.
     */
    function delegatorCountOf(address operator) external view returns (uint256) {
        return _delegatorsOf[operator].length;
    }

    /// @notice Allows the contract to receive native gas refunds from Axelar.
    receive() external payable {}
}
