// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NexusAgentEscrow
 * @notice Trustless escrow for Agent-to-Agent (A2A) intent protocol.
 *         Handles deterministic payment holds, release, refund, and dispute resolution
 *         with configurable revenue routing (skill author, agent owner, treasury).
 *
 *  ┌─────────┐    deposit()     ┌──────────┐    release()    ┌──────────┐
 *  │ CREATED │ ───────────────► │  ACTIVE  │ ──────────────► │ RELEASED │
 *  └─────────┘                  └──────────┘                 └──────────┘
 *                                   │                             
 *                                   │ dispute()                   
 *                                   ▼                             
 *                              ┌──────────┐   resolveDispute()   
 *                              │ DISPUTED │ ───────────────────► RELEASED / REFUNDED
 *                              └──────────┘                     
 *                                   │                           
 *                              refund() (if expired)            
 *                                   ▼                           
 *                              ┌──────────┐                     
 *                              │ REFUNDED │                     
 *                              └──────────┘                     
 */
contract NexusAgentEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Roles ───────────────────────────────────────────────
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant PROTOCOL_ROLE = keccak256("PROTOCOL_ROLE");

    // ─── Enums ───────────────────────────────────────────────
    enum EscrowStatus { CREATED, ACTIVE, RELEASED, REFUNDED, DISPUTED }

    // ─── Structs ─────────────────────────────────────────────
    struct Escrow {
        bytes32 intentId;
        address depositor;      // initiator agent wallet
        address beneficiary;    // responder agent wallet
        address token;          // ERC-20 token address (address(0) = native)
        uint256 amount;
        uint256 depositedAt;
        uint256 expiresAt;
        EscrowStatus status;
    }

    struct RevenueConfig {
        address skillAuthor;
        uint16 skillAuthorBps;     // basis points to skill author
        address agentOwner;
        uint16 agentOwnerBps;      // basis points to agent owner
        address treasury;
        uint16 treasuryBps;        // basis points to treasury
    }

    // ─── State ───────────────────────────────────────────────
    uint256 public nextEscrowId;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => RevenueConfig) public revenueConfigs;
    
    // Default treasury address and fee
    address public treasury;
    uint16 public defaultTreasuryBps = 1500; // 15%
    
    // Minimum escrow duration (prevent griefing)
    uint256 public minDuration = 5 minutes;
    uint256 public maxDuration = 7 days;

    // ─── Events ──────────────────────────────────────────────
    event EscrowCreated(
        uint256 indexed escrowId,
        bytes32 indexed intentId,
        address depositor,
        address beneficiary,
        address token,
        uint256 amount,
        uint256 expiresAt
    );

    event EscrowDeposited(uint256 indexed escrowId, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, uint256 beneficiaryAmount);
    event EscrowRefunded(uint256 indexed escrowId, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address disputedBy);
    event DisputeResolved(uint256 indexed escrowId, bool releasedToBeneficiary);
    event RevenueDistributed(
        uint256 indexed escrowId,
        address skillAuthor,
        uint256 skillAuthorAmount,
        address agentOwner,
        uint256 agentOwnerAmount,
        address treasury,
        uint256 treasuryAmount
    );

    // ─── Constructor ─────────────────────────────────────────
    constructor(address _treasury, address _arbiter) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROTOCOL_ROLE, msg.sender);
        _grantRole(ARBITER_ROLE, _arbiter);
    }

    // ─── Create & Deposit ────────────────────────────────────

    /**
     * @notice Create and fund an escrow for an A2A intent
     * @param intentId The off-chain intent identifier
     * @param beneficiary The agent wallet that will receive payment on success
     * @param token ERC-20 token address (address(0) for native token)
     * @param amount Escrow amount
     * @param duration Duration in seconds before the escrow can be refunded
     * @param revConfig Revenue distribution configuration
     */
    function createAndDeposit(
        bytes32 intentId,
        address beneficiary,
        address token,
        uint256 amount,
        uint256 duration,
        RevenueConfig calldata revConfig
    ) external payable nonReentrant returns (uint256 escrowId) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(beneficiary != msg.sender, "Cannot escrow to self");
        require(amount > 0, "Amount must be > 0");
        require(duration >= minDuration && duration <= maxDuration, "Invalid duration");
        require(
            revConfig.skillAuthorBps + revConfig.agentOwnerBps + revConfig.treasuryBps <= 10000,
            "Revenue splits exceed 100%"
        );

        escrowId = nextEscrowId++;
        
        escrows[escrowId] = Escrow({
            intentId: intentId,
            depositor: msg.sender,
            beneficiary: beneficiary,
            token: token,
            amount: amount,
            depositedAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            status: EscrowStatus.ACTIVE
        });

        revenueConfigs[escrowId] = revConfig;

        // Transfer funds
        if (token == address(0)) {
            require(msg.value == amount, "Incorrect native amount");
        } else {
            require(msg.value == 0, "Native value not accepted for ERC20");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit EscrowCreated(escrowId, intentId, msg.sender, beneficiary, token, amount, block.timestamp + duration);
        emit EscrowDeposited(escrowId, amount);
    }

    // ─── Release ─────────────────────────────────────────────

    /**
     * @notice Release escrow to beneficiary with revenue distribution
     * @dev Can be called by depositor (intent fulfilled) or arbiter (dispute resolved)
     */
    function release(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.ACTIVE, "Not active");
        require(
            msg.sender == e.depositor || hasRole(ARBITER_ROLE, msg.sender),
            "Not authorized"
        );

        e.status = EscrowStatus.RELEASED;
        _distributeRevenue(escrowId);
    }

    // ─── Refund ──────────────────────────────────────────────

    /**
     * @notice Refund escrow to depositor (only after expiry)
     * @dev Depositor can refund after expiry, arbiter can refund anytime
     */
    function refund(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(
            e.status == EscrowStatus.ACTIVE || e.status == EscrowStatus.DISPUTED,
            "Not active/disputed"
        );

        if (msg.sender == e.depositor) {
            require(block.timestamp >= e.expiresAt, "Not expired yet");
        } else {
            require(hasRole(ARBITER_ROLE, msg.sender), "Not authorized");
        }

        e.status = EscrowStatus.REFUNDED;
        _transferOut(e.token, e.depositor, e.amount);

        emit EscrowRefunded(escrowId, e.amount);
    }

    // ─── Dispute ─────────────────────────────────────────────

    /**
     * @notice Open a dispute on an active escrow
     */
    function dispute(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.ACTIVE, "Not active");
        require(
            msg.sender == e.depositor || msg.sender == e.beneficiary,
            "Not a party"
        );

        e.status = EscrowStatus.DISPUTED;
        emit EscrowDisputed(escrowId, msg.sender);
    }

    /**
     * @notice Resolve a dispute — arbiter decides release or refund
     * @param releaseToBeneficiary true = release with revenue split, false = refund to depositor
     */
    function resolveDispute(
        uint256 escrowId,
        bool releaseToBeneficiary
    ) external nonReentrant onlyRole(ARBITER_ROLE) {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.DISPUTED, "Not disputed");

        if (releaseToBeneficiary) {
            e.status = EscrowStatus.RELEASED;
            _distributeRevenue(escrowId);
        } else {
            e.status = EscrowStatus.REFUNDED;
            _transferOut(e.token, e.depositor, e.amount);
            emit EscrowRefunded(escrowId, e.amount);
        }

        emit DisputeResolved(escrowId, releaseToBeneficiary);
    }

    // ─── Revenue Distribution ────────────────────────────────

    function _distributeRevenue(uint256 escrowId) internal {
        Escrow storage e = escrows[escrowId];
        RevenueConfig storage rc = revenueConfigs[escrowId];

        uint256 remaining = e.amount;

        // Skill author cut
        uint256 skillAuthorAmount = 0;
        if (rc.skillAuthor != address(0) && rc.skillAuthorBps > 0) {
            skillAuthorAmount = (e.amount * rc.skillAuthorBps) / 10000;
            _transferOut(e.token, rc.skillAuthor, skillAuthorAmount);
            remaining -= skillAuthorAmount;
        }

        // Treasury cut
        uint256 treasuryAmount = 0;
        address treasuryAddr = rc.treasury != address(0) ? rc.treasury : treasury;
        uint16 treasuryBps = rc.treasuryBps > 0 ? rc.treasuryBps : defaultTreasuryBps;
        if (treasuryAddr != address(0)) {
            treasuryAmount = (e.amount * treasuryBps) / 10000;
            _transferOut(e.token, treasuryAddr, treasuryAmount);
            remaining -= treasuryAmount;
        }

        // Agent owner cut (from remaining)
        uint256 agentOwnerAmount = 0;
        if (rc.agentOwner != address(0) && rc.agentOwnerBps > 0) {
            agentOwnerAmount = (e.amount * rc.agentOwnerBps) / 10000;
            if (agentOwnerAmount > remaining) agentOwnerAmount = remaining;
            _transferOut(e.token, rc.agentOwner, agentOwnerAmount);
            remaining -= agentOwnerAmount;
        }

        // Remainder goes to beneficiary
        if (remaining > 0) {
            _transferOut(e.token, e.beneficiary, remaining);
        }

        emit EscrowReleased(escrowId, remaining);
        emit RevenueDistributed(
            escrowId,
            rc.skillAuthor,
            skillAuthorAmount,
            rc.agentOwner,
            agentOwnerAmount,
            treasuryAddr,
            treasuryAmount
        );
    }

    function _transferOut(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ─── Admin ───────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function setDefaultTreasuryBps(uint16 _bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_bps <= 3000, "Max 30%");
        defaultTreasuryBps = _bps;
    }

    function setDurationLimits(uint256 _min, uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_min < _max, "Invalid limits");
        minDuration = _min;
        maxDuration = _max;
    }

    // ─── View ────────────────────────────────────────────────

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function getRevenueConfig(uint256 escrowId) external view returns (RevenueConfig memory) {
        return revenueConfigs[escrowId];
    }

    function isExpired(uint256 escrowId) external view returns (bool) {
        return block.timestamp >= escrows[escrowId].expiresAt;
    }
}
