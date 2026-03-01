// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================================
//  NexusGovernanceHub.sol
//  Canonical Governance Hub for Nexus Water DAO — deployed on Base (8453).
//
//  Spoke mirrors on XRPL EVM, Arbitrum, and HyperEVM broadcast vote deltas
//  to this hub via Axelar GMP.  This contract is the single source of truth
//  for proposal lifecycle, vote tallies, delegation, and cross-chain
//  aggregation.
// ============================================================================

// ---------------------------------------------------------------------------
//  Minimal Axelar Interfaces & Abstract Base
// ---------------------------------------------------------------------------

/// @title IAxelarGateway
/// @notice Minimal interface for the Axelar Gateway used by the hub.
interface IAxelarGateway {
    function callContract(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload
    ) external;

    function callContractWithToken(
        string calldata destinationChain,
        string calldata contractAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount
    ) external;

    function validateContractCall(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash
    ) external returns (bool);

    function isContractCallApproved(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash
    ) external view returns (bool);
}

/// @title IAxelarGasService
/// @notice Minimal interface for the Axelar Gas Service used to pre-pay
///         relayer fees on cross-chain messages.
interface IAxelarGasService {
    function payNativeGasForContractCall(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        address refundAddress
    ) external payable;

    function payNativeGasForContractCallWithToken(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        string calldata symbol,
        uint256 amount,
        address refundAddress
    ) external payable;
}

/// @title AxelarExecutable
/// @notice Abstract base that validates inbound Axelar GMP calls via the
///         Gateway before forwarding them to the concrete `_execute` hook.
abstract contract AxelarExecutable {
    /// @notice Axelar Gateway reference.
    IAxelarGateway public immutable gateway;

    /// @param gateway_ Address of the Axelar Gateway on this chain.
    constructor(address gateway_) {
        require(gateway_ != address(0), "ZERO_GATEWAY");
        gateway = IAxelarGateway(gateway_);
    }

    /// @notice Entry-point called by relayers.  Validates the call with the
    ///         Gateway, then delegates to `_execute`.
    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
        require(
            gateway.validateContractCall(commandId, sourceChain, sourceAddress, keccak256(payload)),
            "NOT_APPROVED_BY_GATEWAY"
        );
        _execute(sourceChain, sourceAddress, payload);
    }

    /// @dev Override in concrete contracts to handle inbound cross-chain messages.
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;
}

// ---------------------------------------------------------------------------
//  Minimal ERC-20 Interface (NXS token)
// ---------------------------------------------------------------------------

/// @title IERC20
/// @notice Minimal ERC-20 interface required for NXS balance reads.
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// ---------------------------------------------------------------------------
//  NexusGovernanceHub
// ---------------------------------------------------------------------------

/// @title NexusGovernanceHub
/// @author Nexus Water DAO Core Contributors
/// @notice Canonical cross-chain governance hub deployed on Base (Chain ID 8453).
///         Aggregates local votes with remote vote-deltas arriving from spoke
///         mirrors via Axelar GMP, manages proposal lifecycle, delegation, and
///         execution.
/// @dev    Spoke mirrors encode vote deltas as `(bytes32 kind, uint64 proposalId,
///         uint256 yesDelta, uint256 noDelta, uint256 abstainDelta, uint256 nonce)`
///         and send them through Axelar `callContract`.  The hub validates the
///         source, guards against replay, and accumulates unified tallies.
contract NexusGovernanceHub is AxelarExecutable {
    // -----------------------------------------------------------------------
    //  Constants
    // -----------------------------------------------------------------------

    /// @notice Maximum delegation fee in basis points (20%).
    uint16 public constant MAX_FEE_BPS = 2000;

    /// @notice Canonical kind hash for inbound vote-delta messages.
    bytes32 public constant VOTE_DELTA_KIND = keccak256("VOTE_DELTA");

    /// @notice Canonical kind hash for outbound proposal-creation broadcasts.
    bytes32 public constant PROPOSAL_CREATED_KIND = keccak256("PROPOSAL_CREATED");

    // -----------------------------------------------------------------------
    //  Enums
    // -----------------------------------------------------------------------

    /// @notice Lifecycle status of a proposal.
    enum Status {
        Active,
        Passed,
        Executed,
        Failed,
        Cancelled
    }

    /// @notice Vote choice.
    enum Vote {
        For,
        Against,
        Abstain
    }

    // -----------------------------------------------------------------------
    //  Structs
    // -----------------------------------------------------------------------

    /// @notice Full proposal record.
    /// @param id               Auto-incremented proposal identifier.
    /// @param proposer         Address that created the proposal.
    /// @param title            Short descriptor stored as bytes32.
    /// @param start            Block timestamp when voting begins.
    /// @param end              Block timestamp when voting ends.
    /// @param status           Current lifecycle status.
    /// @param localYes         Yes votes cast on Base (hub chain).
    /// @param localNo          No votes cast on Base.
    /// @param localAbstain     Abstain votes cast on Base.
    /// @param unifiedYes       Aggregated yes votes across all chains.
    /// @param unifiedNo        Aggregated no votes across all chains.
    /// @param unifiedAbstain   Aggregated abstain votes across all chains.
    /// @param quorumRequired   Minimum total votes for quorum.
    /// @param executionPayload Calldata executed upon passing (self-call).
    struct Proposal {
        uint64 id;
        address proposer;
        bytes32 title;
        uint256 start;
        uint256 end;
        Status status;
        uint256 localYes;
        uint256 localNo;
        uint256 localAbstain;
        uint256 unifiedYes;
        uint256 unifiedNo;
        uint256 unifiedAbstain;
        uint256 quorumRequired;
        bytes executionPayload;
    }

    /// @notice Delegation record associating a delegator with an operator.
    /// @param delegator Address that delegates voting power.
    /// @param operator  Address that receives the delegated power.
    /// @param scope     Application-specific scope identifier.
    /// @param feeBps    Fee in basis points the operator may charge (max 20%).
    /// @param expiry    Unix timestamp after which delegation is void.
    /// @param active    Whether the delegation is currently active.
    struct DelegationRecord {
        address delegator;
        address operator;
        uint8 scope;
        uint16 feeBps;
        uint32 expiry;
        bool active;
    }

    // -----------------------------------------------------------------------
    //  State — Admin
    // -----------------------------------------------------------------------

    /// @notice Owner / admin of the hub (later: timelock controller).
    address public owner;

    /// @notice Minimum NXS balance required to create a proposal.
    uint256 public proposalThreshold;

    /// @notice Fallback voting duration in seconds when `duration == 0`.
    uint32 public defaultVotingDuration;

    // -----------------------------------------------------------------------
    //  State — Token
    // -----------------------------------------------------------------------

    /// @notice NXS governance token reference.
    IERC20 public immutable nxsToken;

    // -----------------------------------------------------------------------
    //  State — Axelar Gas Service
    // -----------------------------------------------------------------------

    /// @notice Axelar Gas Service for pre-paying relayer fees.
    IAxelarGasService public immutable gasService;

    // -----------------------------------------------------------------------
    //  State — Chain Registry
    // -----------------------------------------------------------------------

    /// @notice Allowed remote mirror: keccak256(abi.encodePacked(chainName, "|", mirrorAddress)) => bool.
    mapping(bytes32 => bool) public allowedRemote;

    /// @notice Supported chain: keccak256(abi.encodePacked(chainName)) => bool.
    mapping(bytes32 => bool) public supportedChain;

    /// @dev Internal array of registered chain names for broadcast iteration.
    string[] internal _registeredChains;

    /// @dev Internal mapping of chainName => mirror address (string) for outbound calls.
    mapping(bytes32 => string) internal _mirrorAddress;

    // -----------------------------------------------------------------------
    //  State — Proposals
    // -----------------------------------------------------------------------

    /// @notice Auto-incrementing proposal counter.
    uint64 public proposalSeq;

    /// @notice Proposal storage keyed by proposal id.
    mapping(uint64 => Proposal) public proposals;

    /// @notice Tracks whether an address has voted on a given proposal.
    mapping(uint64 => mapping(address => bool)) public voted;

    // -----------------------------------------------------------------------
    //  State — Delegation
    // -----------------------------------------------------------------------

    /// @notice Delegation record for each delegator.
    mapping(address => DelegationRecord) public delegations;

    /// @dev Set of addresses delegating to a given operator (for power enumeration).
    mapping(address => address[]) internal _delegatorsOf;

    // -----------------------------------------------------------------------
    //  State — Anti-Replay
    // -----------------------------------------------------------------------

    /// @notice Tracks processed cross-chain messages: keccak256(sourceChain|proposalId|nonce) => bool.
    mapping(bytes32 => bool) public processedMessage;

    // -----------------------------------------------------------------------
    //  State — Migration
    // -----------------------------------------------------------------------

    /// @notice Address of the next-generation hub (zero if no migration).
    address public nextHub;

    /// @notice Chain name of the next hub deployment.
    string public nextHubChain;

    /// @notice When true, new proposals are blocked.
    bool public migrationActive;

    // -----------------------------------------------------------------------
    //  Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a remote spoke mirror is registered.
    event MirrorRegistered(string indexed chainName, string mirrorAddress);

    /// @notice Emitted when a remote spoke mirror is removed.
    event MirrorRemoved(string indexed chainName, string mirrorAddress);

    /// @notice Emitted when a new proposal is created.
    event ProposalCreated(
        uint64 indexed id,
        address indexed proposer,
        bytes32 title,
        uint256 start,
        uint256 end,
        uint256 quorumRequired
    );

    /// @notice Emitted when a local vote is cast on Base.
    event VoteCast(uint64 indexed proposalId, address indexed voter, Vote choice, uint256 weight);

    /// @notice Emitted when remote vote deltas are received via Axelar.
    event RemoteVoteReceived(
        uint64 indexed proposalId,
        string sourceChain,
        uint256 yesDelta,
        uint256 noDelta,
        uint256 abstainDelta
    );

    /// @notice Emitted when a proposal is finalized (Passed or Failed).
    event ProposalFinalized(uint64 indexed id, Status status);

    /// @notice Emitted when a passed proposal is executed.
    event ProposalExecuted(uint64 indexed id);

    /// @notice Emitted when a delegation is created.
    event DelegationCreated(
        address indexed delegator,
        address indexed operator,
        uint8 scope,
        uint16 feeBps,
        uint32 expiry
    );

    /// @notice Emitted when a delegation is revoked.
    event DelegationRevoked(address indexed delegator, address indexed operator);

    /// @notice Emitted when ownership is transferred.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Emitted when the proposal threshold is updated.
    event ProposalThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    /// @notice Emitted when the default voting duration is updated.
    event DefaultVotingDurationUpdated(uint32 oldDuration, uint32 newDuration);

    /// @notice Emitted when migration target is configured.
    event MigrationConfigured(address indexed nextHub, string chainName);

    /// @notice Emitted when a proposal creation is broadcast to a spoke.
    event ProposalBroadcast(uint64 indexed proposalId, string destinationChain);

    // -----------------------------------------------------------------------
    //  Errors
    // -----------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error InvalidDuration();
    error InsufficientBalance();
    error ProposalNotActive();
    error AlreadyVoted();
    error VotingNotEnded();
    error VotingEnded();
    error ProposalNotPassed();
    error AlreadyProcessed();
    error InvalidRemote();
    error InvalidKind();
    error ProposalDoesNotExist();
    error FeeTooHigh();
    error DelegationExpired();
    error NoDelegationActive();
    error Migrating();
    error ExecutionFailed();

    // -----------------------------------------------------------------------
    //  Modifiers
    // -----------------------------------------------------------------------

    /// @notice Restricts access to the current owner.
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // -----------------------------------------------------------------------
    //  Constructor
    // -----------------------------------------------------------------------

    /// @notice Deploys the Nexus Governance Hub.
    /// @param gateway_          Axelar Gateway address on Base.
    /// @param gasService_       Axelar Gas Service address on Base.
    /// @param nxsToken_         NXS governance token address.
    /// @param threshold_        Initial NXS threshold to create proposals.
    /// @param votingDuration_   Default voting duration in seconds.
    constructor(
        address gateway_,
        address gasService_,
        address nxsToken_,
        uint256 threshold_,
        uint32 votingDuration_
    ) AxelarExecutable(gateway_) {
        if (gasService_ == address(0)) revert ZeroAddress();
        if (nxsToken_ == address(0)) revert ZeroAddress();
        if (votingDuration_ == 0) revert InvalidDuration();

        gasService = IAxelarGasService(gasService_);
        nxsToken = IERC20(nxsToken_);
        owner = msg.sender;
        proposalThreshold = threshold_;
        defaultVotingDuration = votingDuration_;

        emit OwnershipTransferred(address(0), msg.sender);
    }

    // -----------------------------------------------------------------------
    //  Chain Registry
    // -----------------------------------------------------------------------

    /// @notice Registers a remote spoke mirror for a given chain.
    /// @dev    Adds the chain to the broadcast list if not already present.
    /// @param chainName   Axelar-canonical chain name (e.g., "xrpl-evm-sidechain").
    /// @param mirrorAddr  Stringified address of the mirror contract on the spoke.
    function registerRemoteMirror(string calldata chainName, string calldata mirrorAddr) external onlyOwner {
        bytes32 remoteKey = keccak256(abi.encodePacked(chainName, "|", mirrorAddr));
        bytes32 chainKey = keccak256(abi.encodePacked(chainName));

        allowedRemote[remoteKey] = true;

        // Track chain for broadcast if new.
        if (!supportedChain[chainKey]) {
            supportedChain[chainKey] = true;
            _registeredChains.push(chainName);
        }

        _mirrorAddress[chainKey] = mirrorAddr;

        emit MirrorRegistered(chainName, mirrorAddr);
    }

    /// @notice Removes a remote spoke mirror.
    /// @param chainName   Axelar-canonical chain name.
    /// @param mirrorAddr  Stringified address of the mirror contract.
    function removeRemoteMirror(string calldata chainName, string calldata mirrorAddr) external onlyOwner {
        bytes32 remoteKey = keccak256(abi.encodePacked(chainName, "|", mirrorAddr));
        allowedRemote[remoteKey] = false;

        emit MirrorRemoved(chainName, mirrorAddr);
    }

    /// @notice Returns the number of registered chains.
    function registeredChainCount() external view returns (uint256) {
        return _registeredChains.length;
    }

    /// @notice Returns the chain name at a given index.
    function registeredChainAt(uint256 index) external view returns (string memory) {
        return _registeredChains[index];
    }

    // -----------------------------------------------------------------------
    //  Proposal Lifecycle
    // -----------------------------------------------------------------------

    /// @notice Creates a new governance proposal.
    /// @dev    Reverts if migration is active.  Automatically broadcasts the
    ///         proposal to all registered spoke mirrors.
    /// @param title            Short descriptor (bytes32).
    /// @param duration         Voting window in seconds (0 uses default).
    /// @param quorum           Minimum total votes required for validity.
    /// @param executionPayload Encoded self-call executed upon passing.
    /// @return id              The newly assigned proposal identifier.
    function propose(
        bytes32 title,
        uint32 duration,
        uint256 quorum,
        bytes calldata executionPayload
    ) external returns (uint64 id) {
        if (migrationActive) revert Migrating();
        if (nxsToken.balanceOf(msg.sender) < proposalThreshold) revert InsufficientBalance();

        uint32 effectiveDuration = duration > 0 ? duration : defaultVotingDuration;
        if (effectiveDuration == 0) revert InvalidDuration();

        id = ++proposalSeq;

        Proposal storage p = proposals[id];
        p.id = id;
        p.proposer = msg.sender;
        p.title = title;
        p.start = block.timestamp;
        p.end = block.timestamp + effectiveDuration;
        p.status = Status.Active;
        p.quorumRequired = quorum;
        p.executionPayload = executionPayload;

        emit ProposalCreated(id, msg.sender, title, p.start, p.end, quorum);

        _broadcastProposal(id);
    }

    // -----------------------------------------------------------------------
    //  Local Voting (on Base)
    // -----------------------------------------------------------------------

    /// @notice Casts a vote on the hub chain (Base).
    /// @dev    Vote weight equals `votingPowerOf(msg.sender)`.  Weight is added
    ///         to both local accumulators and unified accumulators.
    /// @param id     Proposal identifier.
    /// @param choice Vote choice (For, Against, Abstain).
    function vote(uint64 id, Vote choice) external {
        Proposal storage p = proposals[id];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (p.status != Status.Active) revert ProposalNotActive();
        if (block.timestamp >= p.end) revert VotingEnded();
        if (block.timestamp < p.start) revert ProposalNotActive();
        if (voted[id][msg.sender]) revert AlreadyVoted();

        voted[id][msg.sender] = true;

        uint256 weight = votingPowerOf(msg.sender);
        if (weight == 0) revert InsufficientBalance();

        if (choice == Vote.For) {
            p.localYes += weight;
            p.unifiedYes += weight;
        } else if (choice == Vote.Against) {
            p.localNo += weight;
            p.unifiedNo += weight;
        } else {
            p.localAbstain += weight;
            p.unifiedAbstain += weight;
        }

        emit VoteCast(id, msg.sender, choice, weight);
    }

    // -----------------------------------------------------------------------
    //  Delegation
    // -----------------------------------------------------------------------

    /// @notice Creates or updates a delegation from `msg.sender` to `operator`.
    /// @param operator Address that will vote on behalf of the delegator.
    /// @param scope    Application-specific scope identifier.
    /// @param feeBps   Fee in basis points (capped at MAX_FEE_BPS = 2000).
    /// @param expiry   Unix timestamp when the delegation expires.
    function delegate(address operator, uint8 scope, uint16 feeBps, uint32 expiry) external {
        if (operator == address(0)) revert ZeroAddress();
        if (operator == msg.sender) revert Unauthorized();
        if (feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (expiry != 0 && expiry <= block.timestamp) revert DelegationExpired();

        // Clean up previous delegation if active.
        DelegationRecord storage existing = delegations[msg.sender];
        if (existing.active && existing.operator != address(0)) {
            _removeDelegatorFrom(existing.operator, msg.sender);
        }

        delegations[msg.sender] = DelegationRecord({
            delegator: msg.sender,
            operator: operator,
            scope: scope,
            feeBps: feeBps,
            expiry: expiry,
            active: true
        });

        _delegatorsOf[operator].push(msg.sender);

        emit DelegationCreated(msg.sender, operator, scope, feeBps, expiry);
    }

    /// @notice Revokes the caller's active delegation.
    function undelegate() external {
        DelegationRecord storage d = delegations[msg.sender];
        if (!d.active) revert NoDelegationActive();

        address previousOperator = d.operator;
        d.active = false;

        _removeDelegatorFrom(previousOperator, msg.sender);

        emit DelegationRevoked(msg.sender, previousOperator);
    }

    /// @notice Returns the total NXS balance delegated to `voter` from active,
    ///         non-expired delegators.
    /// @param voter Address to query delegated power for.
    /// @return power Total delegated NXS voting power.
    function delegatedPowerOf(address voter) public view returns (uint256 power) {
        address[] storage delegators = _delegatorsOf[voter];
        uint256 len = delegators.length;
        for (uint256 i; i < len; ++i) {
            DelegationRecord storage d = delegations[delegators[i]];
            if (d.active && (d.expiry == 0 || d.expiry > block.timestamp)) {
                power += nxsToken.balanceOf(delegators[i]);
            }
        }
    }

    /// @notice Returns total voting power for `voter`: own NXS balance plus
    ///         all active delegations pointing to them.
    /// @param voter Address to query total voting power for.
    /// @return Total voting power in NXS wei.
    function votingPowerOf(address voter) public view returns (uint256) {
        return nxsToken.balanceOf(voter) + delegatedPowerOf(voter);
    }

    // -----------------------------------------------------------------------
    //  Axelar Inbound (_execute)
    // -----------------------------------------------------------------------

    /// @dev Handles inbound Axelar GMP messages from spoke mirrors.
    ///      Validates the source, decodes the vote-delta payload, guards
    ///      against replay, and accumulates unified tallies.
    /// @param sourceChain   Axelar-canonical name of the originating chain.
    /// @param sourceAddress Stringified address of the sending mirror.
    /// @param payload       ABI-encoded vote-delta payload.
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // --- Source validation ---
        bytes32 remoteKey = keccak256(abi.encodePacked(sourceChain, "|", sourceAddress));
        if (!allowedRemote[remoteKey]) revert InvalidRemote();

        // --- Decode ---
        (
            bytes32 kind,
            uint64 proposalId,
            uint256 yesDelta,
            uint256 noDelta,
            uint256 abstainDelta,
            uint256 nonce
        ) = abi.decode(payload, (bytes32, uint64, uint256, uint256, uint256, uint256));

        // --- Kind check ---
        if (kind != VOTE_DELTA_KIND) revert InvalidKind();

        // --- Anti-replay ---
        bytes32 msgKey = keccak256(abi.encodePacked(sourceChain, "|", proposalId, "|", nonce));
        if (processedMessage[msgKey]) revert AlreadyProcessed();
        processedMessage[msgKey] = true;

        // --- Proposal existence ---
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalDoesNotExist();

        // --- Accumulate unified tallies ---
        p.unifiedYes += yesDelta;
        p.unifiedNo += noDelta;
        p.unifiedAbstain += abstainDelta;

        emit RemoteVoteReceived(proposalId, sourceChain, yesDelta, noDelta, abstainDelta);
    }

    // -----------------------------------------------------------------------
    //  Axelar Outbound — Broadcast Proposal Creation
    // -----------------------------------------------------------------------

    /// @dev Broadcasts a newly created proposal to all registered spoke mirrors.
    ///      Sends `(PROPOSAL_CREATED_KIND, id, start, end, quorumRequired)` via
    ///      Axelar `callContract`.
    /// @param id Proposal identifier to broadcast.
    function _broadcastProposal(uint64 id) internal {
        Proposal storage p = proposals[id];

        bytes memory payload = abi.encode(
            PROPOSAL_CREATED_KIND,
            id,
            p.start,
            p.end,
            p.quorumRequired
        );

        uint256 chainCount = _registeredChains.length;
        for (uint256 i; i < chainCount; ++i) {
            string memory chain = _registeredChains[i];
            bytes32 chainKey = keccak256(abi.encodePacked(chain));
            string memory mirror = _mirrorAddress[chainKey];

            // Only broadcast if the mirror address is non-empty.
            if (bytes(mirror).length == 0) continue;

            // Pre-pay gas if ETH is attached.
            if (address(this).balance > 0) {
                // Intentionally best-effort: gas estimation is approximate.
                // Operators can top up gas independently via the Gas Service.
                try gasService.payNativeGasForContractCall{value: msg.value / chainCount}(
                    address(this),
                    chain,
                    mirror,
                    payload,
                    msg.sender
                ) {} catch {}
            }

            gateway.callContract(chain, mirror, payload);

            emit ProposalBroadcast(id, chain);
        }
    }

    // -----------------------------------------------------------------------
    //  Finalization
    // -----------------------------------------------------------------------

    /// @notice Finalizes a proposal after its voting window has closed.
    ///         Anyone may call this function.  Sets the status to Passed if
    ///         yes > no AND total votes meet quorum; otherwise sets Failed.
    /// @param id Proposal identifier to finalize.
    function finalize(uint64 id) external {
        Proposal storage p = proposals[id];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (p.status != Status.Active) revert ProposalNotActive();
        if (block.timestamp < p.end) revert VotingNotEnded();

        uint256 totalVotes = p.unifiedYes + p.unifiedNo + p.unifiedAbstain;

        if (p.unifiedYes > p.unifiedNo && totalVotes >= p.quorumRequired) {
            p.status = Status.Passed;
        } else {
            p.status = Status.Failed;
        }

        emit ProposalFinalized(id, p.status);
    }

    // -----------------------------------------------------------------------
    //  Execution
    // -----------------------------------------------------------------------

    /// @notice Executes a passed proposal by performing a self-call with the
    ///         stored execution payload.
    /// @dev    Restricted to `onlyOwner` for now; will be replaced by a
    ///         timelock controller in a future upgrade.
    /// @param id Proposal identifier to execute.
    function execute(uint64 id) external onlyOwner {
        Proposal storage p = proposals[id];
        if (p.id == 0) revert ProposalDoesNotExist();
        if (p.status != Status.Passed) revert ProposalNotPassed();

        p.status = Status.Executed;

        if (p.executionPayload.length > 0) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, ) = address(this).call(p.executionPayload);
            if (!success) revert ExecutionFailed();
        }

        emit ProposalExecuted(id);
    }

    // -----------------------------------------------------------------------
    //  Migration Support
    // -----------------------------------------------------------------------

    /// @notice Configures the next-generation hub address and activates migration
    ///         mode, blocking new proposals.
    /// @param nextHub_   Address of the replacement hub contract.
    /// @param chainName  Axelar-canonical chain name of the new hub.
    function setNextHub(address nextHub_, string calldata chainName) external onlyOwner {
        if (nextHub_ == address(0)) revert ZeroAddress();
        nextHub = nextHub_;
        nextHubChain = chainName;
        migrationActive = true;

        emit MigrationConfigured(nextHub_, chainName);
    }

    // -----------------------------------------------------------------------
    //  Admin
    // -----------------------------------------------------------------------

    /// @notice Transfers ownership to a new address.
    /// @param newOwner Address of the new owner.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    /// @notice Updates the minimum NXS balance required to create a proposal.
    /// @param newThreshold New proposal threshold in NXS wei.
    function setProposalThreshold(uint256 newThreshold) external onlyOwner {
        uint256 old = proposalThreshold;
        proposalThreshold = newThreshold;
        emit ProposalThresholdUpdated(old, newThreshold);
    }

    /// @notice Updates the default voting duration for new proposals.
    /// @param newDuration New duration in seconds.
    function setDefaultVotingDuration(uint32 newDuration) external onlyOwner {
        if (newDuration == 0) revert InvalidDuration();
        uint32 old = defaultVotingDuration;
        defaultVotingDuration = newDuration;
        emit DefaultVotingDurationUpdated(old, newDuration);
    }

    // -----------------------------------------------------------------------
    //  View Helpers
    // -----------------------------------------------------------------------

    /// @notice Returns the full proposal struct for off-chain consumption.
    /// @param id Proposal identifier.
    /// @return The Proposal struct.
    function getProposal(uint64 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    /// @notice Returns the unified vote totals for a proposal.
    /// @param id Proposal identifier.
    /// @return yes      Unified yes votes.
    /// @return no       Unified no votes.
    /// @return abstain  Unified abstain votes.
    function getUnifiedTally(uint64 id)
        external
        view
        returns (uint256 yes, uint256 no, uint256 abstain)
    {
        Proposal storage p = proposals[id];
        return (p.unifiedYes, p.unifiedNo, p.unifiedAbstain);
    }

    /// @notice Returns the local (Base-only) vote totals for a proposal.
    /// @param id Proposal identifier.
    /// @return yes      Local yes votes.
    /// @return no       Local no votes.
    /// @return abstain  Local abstain votes.
    function getLocalTally(uint64 id)
        external
        view
        returns (uint256 yes, uint256 no, uint256 abstain)
    {
        Proposal storage p = proposals[id];
        return (p.localYes, p.localNo, p.localAbstain);
    }

    // -----------------------------------------------------------------------
    //  Internal Helpers
    // -----------------------------------------------------------------------

    /// @dev Removes `delegator` from the `_delegatorsOf[operator]` array.
    ///      Uses swap-and-pop for gas efficiency.
    /// @param operator  The operator whose delegator list is being modified.
    /// @param delegator The delegator to remove.
    function _removeDelegatorFrom(address operator, address delegator) internal {
        address[] storage arr = _delegatorsOf[operator];
        uint256 len = arr.length;
        for (uint256 i; i < len; ++i) {
            if (arr[i] == delegator) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
    }

    // -----------------------------------------------------------------------
    //  Receive ETH (for Axelar gas pre-payment)
    // -----------------------------------------------------------------------

    /// @notice Allows the contract to receive ETH for Axelar gas pre-payments.
    receive() external payable {}
}
