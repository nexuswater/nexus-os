/**
 * =============================================================================
 * nexus_delegation.c
 * Xahau Hook — Nexus Water DAO Governance Delegation
 * =============================================================================
 *
 * OVERVIEW
 * --------
 * This Xahau Hook enforces on-ledger delegation of governance power for the
 * Nexus Water DAO operating on the XRP Ledger (via Xahau Hooks amendment).
 *
 * Delegation allows a token holder (the "delegator") to assign their voting
 * power to a trusted operator without transferring custody of their NXS tokens.
 * The operator can then vote on governance proposals on behalf of one or many
 * delegators, accumulating delegated power.
 *
 * SCOPES
 * ------
 * Delegation is scoped to specific governance domains:
 *   1  = NXS           Core governance votes (treasury, protocol parameters)
 *   2  = IMPACT        Impact-certificate and environmental credit votes
 *   3  = NFT_MULTIPLIER NFT-based vote multiplier delegation
 *   255 = ALL           Blanket delegation across every scope
 *
 * A delegator may delegate different scopes to different operators, but may
 * not delegate the same scope twice while an existing delegation is active.
 *
 * STATE KEY FORMAT
 * ----------------
 *   Key:   "DELEGATE_" + <20-byte delegator account ID> + "_" + <1-byte scope>
 *   Value: DelegationState struct (48 bytes)
 *
 * The key is stored as a 32-byte Hook State key. The prefix, account, and
 * scope are packed into the key deterministically so that any node can
 * reconstruct the key from the delegator address and scope alone.
 *
 * OPERATOR FEE
 * ------------
 * Operators may charge a fee (in basis points, max 2000 = 20%) on any
 * staking/governance rewards earned by the delegated position. When rewards
 * are distributed, the hook conceptually splits: operator receives fee_bps /
 * 10000 of the reward, delegator receives the remainder.
 *
 * HOW TO INSTALL ON XRPL VIA XAHAU
 * ----------------------------------
 * 1. Compile this file with the Xahau Hooks C compiler:
 *      $ wasmcc nexus_delegation.c -o nexus_delegation.wasm
 *
 * 2. Upload the compiled WASM via a SetHook transaction:
 *      {
 *        "TransactionType": "SetHook",
 *        "Account": "<DAO_GOVERNANCE_ACCOUNT>",
 *        "Hooks": [{
 *          "Hook": {
 *            "CreateCode": "<hex-encoded WASM>",
 *            "HookOn": "0000000000000000",  // fires on all txn types
 *            "HookNamespace": "<NEXUS_DELEGATION_NAMESPACE>",
 *            "HookApiVersion": 0,
 *            "Flags": 1
 *          }
 *        }]
 *      }
 *
 * 3. The hook fires on incoming Payment transactions whose Memo field
 *    contains the action tag NEXUS_DELEGATE_CREATE or NEXUS_DELEGATE_REVOKE.
 *
 * INTEGRATION WITH NEXUS GOVERNANCE
 * ----------------------------------
 * The Nexus governance contract (off-hook or on-hook) queries delegation
 * state to compute effective voting power:
 *
 *   effective_power(voter) =
 *       (voter has delegated own power?) ? 0 : own_nxs_balance(voter)
 *       + SUM( nxs_balance(d) for each active delegator d -> voter )
 *
 * This prevents double-counting: a delegator's tokens count toward the
 * operator's power, and the delegator's own direct voting power becomes 0
 * for that scope.
 *
 * =============================================================================
 */

#include "hookapi.h"

/* ---------------------------------------------------------------------------
 * Constants
 * --------------------------------------------------------------------------- */

/** Valid delegation scopes */
#define SCOPE_NXS            1
#define SCOPE_IMPACT         2
#define SCOPE_NFT_MULTIPLIER 3
#define SCOPE_ALL            255

/** Maximum operator fee: 2000 basis points = 20% */
#define MAX_FEE_BPS          2000

/** Size of an XRPL account ID in bytes */
#define ACCOUNT_ID_SIZE      20

/** Memo type strings used to route actions */
#define MEMO_CREATE          "NEXUS_DELEGATE_CREATE"
#define MEMO_CREATE_LEN      21
#define MEMO_REVOKE          "NEXUS_DELEGATE_REVOKE"
#define MEMO_REVOKE_LEN      21

/** State key prefix — "DELEGATE_" is 9 bytes */
#define STATE_KEY_PREFIX      "DELEGATE_"
#define STATE_KEY_PREFIX_LEN  9

/**
 * State key layout (32 bytes total):
 *   Bytes  0..8   : "DELEGATE_"   (9 bytes)
 *   Bytes  9..28  : delegator account ID (20 bytes)
 *   Byte   29     : '_' separator (1 byte)
 *   Byte   30     : scope (1 byte)
 *   Byte   31     : 0x00 padding (1 byte)
 *                                  --------
 *                    Total:        32 bytes
 */
#define STATE_KEY_SIZE        32

/** DelegationState struct size: 1+1+2+4+4+20+20 = 52 bytes */
#define DELEGATION_STATE_SIZE 52


/* ---------------------------------------------------------------------------
 * DelegationState — packed binary layout
 * ---------------------------------------------------------------------------
 * We avoid C struct padding issues by manually packing/unpacking fields into
 * a flat byte buffer. The layout is:
 *
 *   Offset  Size  Field
 *   ------  ----  -----
 *   0       1     scope           (uint8)
 *   1       1     active          (uint8: 1=active, 0=revoked)
 *   2       2     fee_bps         (uint16, big-endian)
 *   4       4     created_at      (uint32, big-endian, ledger close time)
 *   8       4     expires_at      (uint32, big-endian, 0=no expiry)
 *   12      20    operator        (account ID)
 *   32      20    delegator       (account ID)
 *   ------  ----
 *   Total:  52 bytes
 * --------------------------------------------------------------------------- */

#define OFF_SCOPE       0
#define OFF_ACTIVE      1
#define OFF_FEE_BPS     2
#define OFF_CREATED_AT  4
#define OFF_EXPIRES_AT  8
#define OFF_OPERATOR    12
#define OFF_DELEGATOR   32


/* ---------------------------------------------------------------------------
 * Helper: Build a 32-byte state key from delegator account + scope
 * ---------------------------------------------------------------------------
 * Deterministic key construction allows any participant to look up a
 * delegation given only the delegator address and the scope byte.
 * --------------------------------------------------------------------------- */
static inline void build_state_key(
    uint8_t *key_out,              /* 32-byte output buffer                 */
    const uint8_t *delegator_id,   /* 20-byte delegator account ID          */
    uint8_t scope                  /* scope byte                            */
) {
    int i;

    /* Zero the entire key first to ensure deterministic padding */
    for (i = 0; i < STATE_KEY_SIZE; i++)
        key_out[i] = 0;

    /* Bytes 0..8: prefix "DELEGATE_" */
    uint8_t prefix[] = STATE_KEY_PREFIX;
    for (i = 0; i < STATE_KEY_PREFIX_LEN; i++)
        key_out[i] = prefix[i];

    /* Bytes 9..28: delegator account ID */
    for (i = 0; i < ACCOUNT_ID_SIZE; i++)
        key_out[STATE_KEY_PREFIX_LEN + i] = delegator_id[i];

    /* Byte 29: separator '_' */
    key_out[29] = '_';

    /* Byte 30: scope */
    key_out[30] = scope;

    /* Byte 31: already zeroed (padding) */
}


/* ---------------------------------------------------------------------------
 * Helper: Pack a uint16 into big-endian bytes
 * --------------------------------------------------------------------------- */
static inline void pack_uint16_be(uint8_t *buf, uint16_t val) {
    buf[0] = (uint8_t)((val >> 8) & 0xFF);
    buf[1] = (uint8_t)(val & 0xFF);
}


/* ---------------------------------------------------------------------------
 * Helper: Unpack a uint16 from big-endian bytes
 * --------------------------------------------------------------------------- */
static inline uint16_t unpack_uint16_be(const uint8_t *buf) {
    return ((uint16_t)buf[0] << 8) | (uint16_t)buf[1];
}


/* ---------------------------------------------------------------------------
 * Helper: Pack a uint32 into big-endian bytes
 * --------------------------------------------------------------------------- */
static inline void pack_uint32_be(uint8_t *buf, uint32_t val) {
    buf[0] = (uint8_t)((val >> 24) & 0xFF);
    buf[1] = (uint8_t)((val >> 16) & 0xFF);
    buf[2] = (uint8_t)((val >> 8) & 0xFF);
    buf[3] = (uint8_t)(val & 0xFF);
}


/* ---------------------------------------------------------------------------
 * Helper: Unpack a uint32 from big-endian bytes
 * --------------------------------------------------------------------------- */
static inline uint32_t unpack_uint32_be(const uint8_t *buf) {
    return ((uint32_t)buf[0] << 24) |
           ((uint32_t)buf[1] << 16) |
           ((uint32_t)buf[2] << 8)  |
           (uint32_t)buf[3];
}


/* ---------------------------------------------------------------------------
 * Helper: Compare two byte arrays (returns 0 if equal)
 * --------------------------------------------------------------------------- */
static inline int bytes_equal(const uint8_t *a, const uint8_t *b, int len) {
    for (int i = 0; i < len; i++) {
        if (a[i] != b[i])
            return 0;
    }
    return 1;
}


/* ---------------------------------------------------------------------------
 * Helper: Validate that a scope byte is one of the known values
 * --------------------------------------------------------------------------- */
static inline int is_valid_scope(uint8_t scope) {
    return (scope == SCOPE_NXS ||
            scope == SCOPE_IMPACT ||
            scope == SCOPE_NFT_MULTIPLIER ||
            scope == SCOPE_ALL);
}


/* ---------------------------------------------------------------------------
 * Helper: Check if a delegation has expired based on the current ledger time
 * ---------------------------------------------------------------------------
 * A delegation with expires_at == 0 never expires.
 * Otherwise, it is expired when ledger_time >= expires_at.
 * --------------------------------------------------------------------------- */
static inline int is_expired(const uint8_t *state_buf, uint32_t ledger_time) {
    uint32_t expires_at = unpack_uint32_be(state_buf + OFF_EXPIRES_AT);
    if (expires_at == 0)
        return 0;   /* no expiry set */
    return (ledger_time >= expires_at) ? 1 : 0;
}


/* ---------------------------------------------------------------------------
 * create_delegation()
 * ---------------------------------------------------------------------------
 * Called when the hook detects a NEXUS_DELEGATE_CREATE memo.
 *
 * Expected memo data layout (binary, 45 bytes):
 *   Bytes 0..19  : operator account ID  (20 bytes)
 *   Byte  20     : scope                (1 byte)
 *   Bytes 21..22 : fee_bps              (2 bytes, big-endian)
 *   Bytes 23..26 : expires_at           (4 bytes, big-endian, 0=no expiry)
 *
 * The delegator is the originating transaction account (otxn sender).
 *
 * Validation:
 *   - Scope must be valid (1, 2, 3, or 255)
 *   - fee_bps must be <= 2000 (20%)
 *   - Delegator must not delegate to themselves
 *   - No existing active, non-expired delegation for the same scope
 *
 * On success, writes DelegationState to hook state and emits an event.
 * --------------------------------------------------------------------------- */
int64_t create_delegation(
    const uint8_t *memo_data,      /* raw memo data bytes                   */
    int64_t        memo_data_len,  /* length of memo data                   */
    const uint8_t *delegator_id,   /* 20-byte account ID of tx originator   */
    uint32_t       ledger_time     /* current ledger close time             */
) {
    /* --- 1. Validate memo data length ------------------------------------ */
    if (memo_data_len < 27) {
        rollback(SBUF("Delegation create: memo data too short (need 27 bytes)"), 10);
        return -1; /* unreachable after rollback */
    }

    /* --- 2. Extract fields from memo data -------------------------------- */
    uint8_t operator_id[ACCOUNT_ID_SIZE];
    for (int i = 0; i < ACCOUNT_ID_SIZE; i++)
        operator_id[i] = memo_data[i];

    uint8_t scope = memo_data[20];

    uint16_t fee_bps = unpack_uint16_be(memo_data + 21);

    uint32_t expires_at = unpack_uint32_be(memo_data + 23);

    /* --- 3. Validate scope ----------------------------------------------- */
    if (!is_valid_scope(scope)) {
        rollback(SBUF("Delegation create: invalid scope (must be 1, 2, 3, or 255)"), 20);
        return -1;
    }

    /* --- 4. Validate fee_bps --------------------------------------------- */
    if (fee_bps > MAX_FEE_BPS) {
        rollback(SBUF("Delegation create: fee_bps exceeds max 2000 (20%)"), 30);
        return -1;
    }

    /* --- 5. Prevent self-delegation -------------------------------------- */
    if (bytes_equal(delegator_id, operator_id, ACCOUNT_ID_SIZE)) {
        rollback(SBUF("Delegation create: cannot delegate to self"), 40);
        return -1;
    }

    /* --- 6. Build state key ---------------------------------------------- */
    uint8_t state_key[STATE_KEY_SIZE];
    build_state_key(state_key, delegator_id, scope);

    /* --- 7. Check for existing active delegation at this scope ----------- */
    uint8_t existing_state[DELEGATION_STATE_SIZE];
    int64_t state_result = state(SBUF(existing_state), SBUF(state_key));

    if (state_result == DELEGATION_STATE_SIZE) {
        /*
         * A state entry exists. Check if it is still active AND not expired.
         * If active and not expired, reject — delegator must revoke first.
         * If inactive or expired, we allow overwriting.
         */
        uint8_t existing_active = existing_state[OFF_ACTIVE];
        if (existing_active == 1 && !is_expired(existing_state, ledger_time)) {
            rollback(
                SBUF("Delegation create: active delegation already exists for this scope; revoke first"),
                50
            );
            return -1;
        }
    }

    /* --- 8. Pack new DelegationState ------------------------------------- */
    uint8_t new_state[DELEGATION_STATE_SIZE];

    /* Zero-initialize */
    for (int i = 0; i < DELEGATION_STATE_SIZE; i++)
        new_state[i] = 0;

    /* scope */
    new_state[OFF_SCOPE] = scope;

    /* active = 1 */
    new_state[OFF_ACTIVE] = 1;

    /* fee_bps (big-endian) */
    pack_uint16_be(new_state + OFF_FEE_BPS, fee_bps);

    /* created_at = current ledger time */
    pack_uint32_be(new_state + OFF_CREATED_AT, ledger_time);

    /* expires_at */
    pack_uint32_be(new_state + OFF_EXPIRES_AT, expires_at);

    /* operator account ID */
    for (int i = 0; i < ACCOUNT_ID_SIZE; i++)
        new_state[OFF_OPERATOR + i] = operator_id[i];

    /* delegator account ID */
    for (int i = 0; i < ACCOUNT_ID_SIZE; i++)
        new_state[OFF_DELEGATOR + i] = delegator_id[i];

    /* --- 9. Write state -------------------------------------------------- */
    int64_t set_result = state_set(SBUF(new_state), SBUF(state_key));
    if (set_result < 0) {
        rollback(SBUF("Delegation create: failed to write hook state"), 60);
        return -1;
    }

    /* --- 10. Emit success event ------------------------------------------ *
     *
     * In a production hook, we would construct and emit() a small "event"
     * transaction (e.g., a 0-value Payment to the hook account with a memo
     * indicating the delegation was created). This serves as an on-ledger
     * log that indexers and the Nexus governance UI can consume.
     *
     * Pseudocode:
     *   uint8_t emit_buf[256];
     *   int64_t emit_len = etxn_reserve(1);
     *   // ... build the emitted txn with memo "DELEGATION_CREATED" ...
     *   // ... include delegator, operator, scope, fee in memo data ...
     *   emit(SBUF(emit_buf), ...);
     *
     * For this reference implementation we skip the full emit construction
     * and proceed directly to accept().
     * ---------------------------------------------------------------------- */

    /* --- 11. Accept the originating transaction -------------------------- */
    accept(SBUF("Delegation created"), 0);

    /* accept() does not return; the line below is unreachable */
    return 0;
}


/* ---------------------------------------------------------------------------
 * revoke_delegation()
 * ---------------------------------------------------------------------------
 * Called when the hook detects a NEXUS_DELEGATE_REVOKE memo.
 *
 * Expected memo data layout (binary, 1 byte minimum):
 *   Byte 0 : scope  (1 byte)
 *
 * The delegator is the originating transaction account.
 *
 * Validation:
 *   - State entry must exist
 *   - State entry must have active == 1
 *
 * On success, sets active = 0 in the state and emits a revocation event.
 * --------------------------------------------------------------------------- */
int64_t revoke_delegation(
    const uint8_t *memo_data,
    int64_t        memo_data_len,
    const uint8_t *delegator_id,
    uint32_t       ledger_time
) {
    /* --- 1. Validate memo data length ------------------------------------ */
    if (memo_data_len < 1) {
        rollback(SBUF("Delegation revoke: memo data too short (need 1 byte for scope)"), 70);
        return -1;
    }

    /* --- 2. Extract scope ------------------------------------------------ */
    uint8_t scope = memo_data[0];

    if (!is_valid_scope(scope)) {
        rollback(SBUF("Delegation revoke: invalid scope"), 71);
        return -1;
    }

    /* --- 3. Build state key ---------------------------------------------- */
    uint8_t state_key[STATE_KEY_SIZE];
    build_state_key(state_key, delegator_id, scope);

    /* --- 4. Read existing state ------------------------------------------ */
    uint8_t existing_state[DELEGATION_STATE_SIZE];
    int64_t state_result = state(SBUF(existing_state), SBUF(state_key));

    if (state_result != DELEGATION_STATE_SIZE) {
        rollback(SBUF("Delegation revoke: no delegation found for this scope"), 80);
        return -1;
    }

    /* --- 5. Verify the delegation is currently active -------------------- */
    if (existing_state[OFF_ACTIVE] != 1) {
        rollback(SBUF("Delegation revoke: delegation is already inactive"), 90);
        return -1;
    }

    /* --- 6. Set active = 0 (revoke) -------------------------------------- */
    existing_state[OFF_ACTIVE] = 0;

    /* --- 7. Write updated state back ------------------------------------- */
    int64_t set_result = state_set(SBUF(existing_state), SBUF(state_key));
    if (set_result < 0) {
        rollback(SBUF("Delegation revoke: failed to update hook state"), 100);
        return -1;
    }

    /* --- 8. Emit revocation event ---------------------------------------- *
     *
     * Similar to create_delegation, a production hook would emit() a small
     * transaction with memo "DELEGATION_REVOKED" for indexers to consume.
     * ---------------------------------------------------------------------- */

    /* --- 9. Accept ------------------------------------------------------- */
    accept(SBUF("Delegation revoked"), 0);

    return 0;
}


/* ---------------------------------------------------------------------------
 * get_delegated_power()  [conceptual / reference]
 * ---------------------------------------------------------------------------
 * This is a CONCEPTUAL helper illustrating how a governance contract or
 * off-chain indexer would compute the total delegated power for a given
 * operator account in a specific scope.
 *
 * In practice, Xahau hooks cannot iterate all state entries efficiently in
 * a single hook execution (state iteration is limited). This logic would
 * typically run:
 *   (a) in an off-chain indexer that watches SetHookState transactions, or
 *   (b) in a companion hook that maintains an aggregated "power" state key
 *       updated incrementally on each create/revoke.
 *
 * Pseudocode:
 *
 *   int64_t get_delegated_power(
 *       const uint8_t *operator_id,   // 20-byte account ID of operator
 *       uint8_t        scope,         // scope to query
 *       uint32_t       ledger_time    // current ledger time for expiry check
 *   ) {
 *       int64_t total_power = 0;
 *
 *       // Iterate over all DELEGATE_*_<scope> state entries:
 *       for each state_key in namespace where prefix == "DELEGATE_" {
 *
 *           uint8_t state_buf[DELEGATION_STATE_SIZE];
 *           state(SBUF(state_buf), SBUF(state_key));
 *
 *           // Check scope matches
 *           if (state_buf[OFF_SCOPE] != scope && scope != SCOPE_ALL)
 *               continue;
 *
 *           // Check delegation is active and not expired
 *           if (state_buf[OFF_ACTIVE] != 1)
 *               continue;
 *           if (is_expired(state_buf, ledger_time))
 *               continue;
 *
 *           // Check operator matches
 *           if (!bytes_equal(state_buf + OFF_OPERATOR, operator_id, ACCOUNT_ID_SIZE))
 *               continue;
 *
 *           // Look up delegator's NXS token balance
 *           // (This would require a trustline/balance lookup, which is
 *           //  chain-specific and not directly available inside a hook.
 *           //  An indexer would query the ledger for this.)
 *           uint8_t delegator_id[ACCOUNT_ID_SIZE];
 *           for (int i = 0; i < ACCOUNT_ID_SIZE; i++)
 *               delegator_id[i] = state_buf[OFF_DELEGATOR + i];
 *
 *           int64_t delegator_balance = lookup_nxs_balance(delegator_id);
 *           total_power += delegator_balance;
 *       }
 *
 *       return total_power;
 *   }
 *
 * --------------------------------------------------------------------------- */


/* ---------------------------------------------------------------------------
 * voting_power_with_delegation()  [conceptual / reference]
 * ---------------------------------------------------------------------------
 * Computes the effective voting power for a voter account, including power
 * delegated to them and excluding their own power if they have delegated it
 * to someone else.
 *
 * This prevents double voting: you cannot both delegate your tokens AND
 * vote with them yourself.
 *
 * Pseudocode:
 *
 *   int64_t voting_power_with_delegation(
 *       const uint8_t *voter_id,   // 20-byte account to evaluate
 *       uint8_t        scope,      // governance scope
 *       uint32_t       ledger_time
 *   ) {
 *       // Step 1: Own NXS balance
 *       int64_t own_power = lookup_nxs_balance(voter_id);
 *
 *       // Step 2: Check if voter has delegated their own power away
 *       //         If so, their direct voting power is zeroed out.
 *       uint8_t self_key[STATE_KEY_SIZE];
 *       build_state_key(self_key, voter_id, scope);
 *       uint8_t self_state[DELEGATION_STATE_SIZE];
 *       int64_t sr = state(SBUF(self_state), SBUF(self_key));
 *
 *       if (sr == DELEGATION_STATE_SIZE &&
 *           self_state[OFF_ACTIVE] == 1 &&
 *           !is_expired(self_state, ledger_time)) {
 *           // Voter delegated this scope to someone else => own power = 0
 *           own_power = 0;
 *       }
 *
 *       // Also check SCOPE_ALL delegation
 *       uint8_t all_key[STATE_KEY_SIZE];
 *       build_state_key(all_key, voter_id, SCOPE_ALL);
 *       uint8_t all_state[DELEGATION_STATE_SIZE];
 *       int64_t ar = state(SBUF(all_state), SBUF(all_key));
 *
 *       if (ar == DELEGATION_STATE_SIZE &&
 *           all_state[OFF_ACTIVE] == 1 &&
 *           !is_expired(all_state, ledger_time)) {
 *           // Blanket delegation active => own power = 0
 *           own_power = 0;
 *       }
 *
 *       // Step 3: Sum delegated power from all delegators pointing to voter
 *       int64_t delegated_power = get_delegated_power(voter_id, scope, ledger_time);
 *
 *       return own_power + delegated_power;
 *   }
 *
 * --------------------------------------------------------------------------- */


/* ---------------------------------------------------------------------------
 * fee_split_on_reward()  [conceptual / reference]
 * ---------------------------------------------------------------------------
 * When governance rewards (staking yields, grant distributions, etc.) are
 * distributed to a delegated position, the reward is split between the
 * operator and the delegator according to the fee_bps in the delegation.
 *
 * Pseudocode:
 *
 *   void fee_split_on_reward(
 *       int64_t        reward_amount,   // total reward in drops or tokens
 *       const uint8_t *delegation_state // 52-byte DelegationState buffer
 *   ) {
 *       uint16_t fee_bps = unpack_uint16_be(delegation_state + OFF_FEE_BPS);
 *
 *       // Operator fee: reward * fee_bps / 10000
 *       int64_t operator_fee = (reward_amount * (int64_t)fee_bps) / 10000;
 *
 *       // Delegator receives the remainder
 *       int64_t delegator_share = reward_amount - operator_fee;
 *
 *       // Extract account IDs
 *       const uint8_t *operator_id  = delegation_state + OFF_OPERATOR;
 *       const uint8_t *delegator_id = delegation_state + OFF_DELEGATOR;
 *
 *       // Emit payment to operator
 *       // (Construct and emit() a Payment transaction for operator_fee drops
 *       //  to operator_id)
 *
 *       // Emit payment to delegator
 *       // (Construct and emit() a Payment transaction for delegator_share
 *       //  drops to delegator_id)
 *
 *       // NOTE: emit() is limited to a maximum of 256 emitted transactions
 *       // per hook execution. For large-scale reward distributions, a
 *       // batching mechanism or off-chain settlement is recommended.
 *   }
 *
 * --------------------------------------------------------------------------- */


/* ---------------------------------------------------------------------------
 * hook() — Main Entry Point
 * ---------------------------------------------------------------------------
 * This is the mandatory entry point for all Xahau hooks. The XRPL ledger
 * invokes hook() for every transaction that matches the HookOn filter.
 *
 * Execution flow:
 *   1. Identify the hook account (the account this hook is installed on)
 *   2. Read the originating transaction's account (the sender)
 *   3. Safety check: only process transactions FROM external accounts
 *      (skip if the hook account itself is the sender, to avoid loops)
 *   4. Read the transaction's Memo array to determine the requested action
 *   5. Route to create_delegation() or revoke_delegation() as appropriate
 *   6. If no matching memo is found, accept the transaction passively
 *      (the hook does not interfere with non-delegation transactions)
 *
 * Parameters:
 *   reserved — reserved by the Hooks API; currently unused
 *
 * Returns:
 *   This function calls accept() or rollback() which terminate execution.
 *   The int64_t return is technically unreachable in normal flow.
 * --------------------------------------------------------------------------- */
int64_t hook(int64_t reserved) {

    /* =====================================================================
     * STEP 1: Identify the hook's own account
     * =====================================================================
     * hook_account() writes the 20-byte account ID of the account on which
     * this hook is installed. We need this to avoid processing transactions
     * that the hook account sends to itself (which would cause loops).
     * ===================================================================== */
    uint8_t hook_acc[ACCOUNT_ID_SIZE];
    hook_account(SBUF(hook_acc));

    /* =====================================================================
     * STEP 2: Read the originating transaction's sender (Account field)
     * =====================================================================
     * otxn_field() reads a field from the originating transaction.
     * sfAccount (field code used in XRPL serialization) gives us the
     * 20-byte account ID of whoever sent this transaction.
     * ===================================================================== */
    uint8_t otxn_acc[ACCOUNT_ID_SIZE];
    int64_t otxn_acc_len = otxn_field(SBUF(otxn_acc), sfAccount);

    if (otxn_acc_len != ACCOUNT_ID_SIZE) {
        /*
         * If we cannot read the sender account, something is very wrong.
         * Accept passively rather than block the transaction.
         */
        accept(SBUF("Delegation hook: could not read otxn account; passing through"), 1);
        return 0;
    }

    /* =====================================================================
     * STEP 3: Skip if the hook account is the sender
     * =====================================================================
     * When the hook account itself sends a transaction (e.g., an emitted
     * transaction), the hook fires again. We must skip processing to avoid
     * infinite loops.
     * ===================================================================== */
    if (bytes_equal(hook_acc, otxn_acc, ACCOUNT_ID_SIZE)) {
        accept(SBUF("Delegation hook: skipping self-originated transaction"), 2);
        return 0;
    }

    /* =====================================================================
     * STEP 4: Get current ledger time for expiry comparisons
     * =====================================================================
     * ledger_last_time() returns the close time of the last validated
     * ledger. We use this for expiry checks.
     * ===================================================================== */
    uint32_t ledger_time = (uint32_t)ledger_last_time();

    /* =====================================================================
     * STEP 5: Read the transaction's Memo array
     * =====================================================================
     * Xahau transactions can carry an array of Memo objects. Each Memo has:
     *   - MemoType: identifies the purpose (we match on our action strings)
     *   - MemoData: the payload (operator, scope, fee, etc.)
     *
     * We use slot_set() and slot_subfield() to navigate the transaction's
     * serialized fields.
     *
     * For this reference implementation, we use otxn_field() to read the
     * first memo's MemoType and MemoData.
     * ===================================================================== */

    /*
     * Read MemoType from the first Memo in the Memos array.
     *
     * In the Xahau Hooks API, we typically:
     *   1. Slot the originating transaction into slot 1
     *   2. Subfield into the Memos array
     *   3. Subfield into the first Memo object
     *   4. Subfield into MemoType and MemoData
     *
     * Below is a simplified approach using otxn_slot and slot navigation.
     */

    /* Slot the originating transaction */
    int64_t txn_slot = otxn_slot(1);
    if (txn_slot < 0) {
        accept(SBUF("Delegation hook: could not slot transaction; passing through"), 3);
        return 0;
    }

    /* Navigate to the Memos array (sfMemos) */
    int64_t memos_slot = slot_subfield(1, sfMemos, 2);
    if (memos_slot < 0) {
        /*
         * No Memos field in this transaction — this is not a delegation
         * transaction. Accept it passively so the hook does not interfere
         * with normal transfers, offers, etc.
         */
        accept(SBUF("Delegation hook: no memos; passing through"), 4);
        return 0;
    }

    /* Navigate to the first Memo entry in the array */
    int64_t memo_slot = slot_subarray(2, 0, 3);
    if (memo_slot < 0) {
        accept(SBUF("Delegation hook: could not read first memo; passing through"), 5);
        return 0;
    }

    /* Read MemoType from the first memo (sfMemoType) */
    int64_t memo_type_slot = slot_subfield(3, sfMemoType, 4);
    if (memo_type_slot < 0) {
        accept(SBUF("Delegation hook: no MemoType; passing through"), 6);
        return 0;
    }

    uint8_t memo_type_buf[64];
    int64_t memo_type_len = slot_size(4);
    if (memo_type_len <= 0 || memo_type_len > 64) {
        accept(SBUF("Delegation hook: MemoType invalid length; passing through"), 7);
        return 0;
    }
    slot(SBUF(memo_type_buf), 4);

    /* Read MemoData from the first memo (sfMemoData) */
    int64_t memo_data_slot = slot_subfield(3, sfMemoData, 5);
    if (memo_data_slot < 0) {
        accept(SBUF("Delegation hook: no MemoData; passing through"), 8);
        return 0;
    }

    uint8_t memo_data_buf[128];
    int64_t memo_data_len = slot_size(5);
    if (memo_data_len <= 0 || memo_data_len > 128) {
        accept(SBUF("Delegation hook: MemoData invalid length; passing through"), 9);
        return 0;
    }
    slot(SBUF(memo_data_buf), 5);

    /* =====================================================================
     * STEP 6: Route based on MemoType
     * =====================================================================
     * Compare the MemoType against our known action strings:
     *   - "NEXUS_DELEGATE_CREATE" -> create_delegation()
     *   - "NEXUS_DELEGATE_REVOKE" -> revoke_delegation()
     *
     * If the MemoType does not match either, this transaction is not for
     * the delegation hook. Accept it passively.
     * ===================================================================== */

    int is_create = 0;
    int is_revoke = 0;

    /* Check for CREATE action */
    if (memo_type_len == MEMO_CREATE_LEN) {
        uint8_t create_tag[] = MEMO_CREATE;
        is_create = 1;
        for (int i = 0; i < MEMO_CREATE_LEN; i++) {
            if (memo_type_buf[i] != create_tag[i]) {
                is_create = 0;
                break;
            }
        }
    }

    /* Check for REVOKE action */
    if (!is_create && memo_type_len == MEMO_REVOKE_LEN) {
        uint8_t revoke_tag[] = MEMO_REVOKE;
        is_revoke = 1;
        for (int i = 0; i < MEMO_REVOKE_LEN; i++) {
            if (memo_type_buf[i] != revoke_tag[i]) {
                is_revoke = 0;
                break;
            }
        }
    }

    /* =====================================================================
     * STEP 7: Dispatch to the appropriate handler
     * ===================================================================== */

    if (is_create) {
        /*
         * The transaction originator (otxn_acc) is the delegator.
         * This ensures that only the token holder can create a delegation
         * of their own governance power. No third party can create a
         * delegation on someone else's behalf.
         */
        return create_delegation(memo_data_buf, memo_data_len, otxn_acc, ledger_time);
    }

    if (is_revoke) {
        /*
         * Similarly, only the original delegator can revoke.
         * The delegator account is verified because otxn_acc is the
         * cryptographic signer of the transaction.
         */
        return revoke_delegation(memo_data_buf, memo_data_len, otxn_acc, ledger_time);
    }

    /* =====================================================================
     * STEP 8: No matching memo — pass through
     * =====================================================================
     * This transaction is not a delegation operation. Accept it so the hook
     * does not block normal XRPL activity on this account.
     * ===================================================================== */
    accept(SBUF("Delegation hook: unrecognized memo type; passing through"), 99);

    return 0;
}
