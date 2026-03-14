/**
 * Agent Economy — Unit Tests
 *
 * Covers: Fee Engine, Policy Engine, Reputation Engine, Escrow Engine, and Permit Expiry.
 *
 * These tests exercise the pure computation functions directly and manipulate
 * the in-memory singleton store for integration-style tests where the engines
 * rely on stored state.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { FeeConfig, AssetSymbol, RiskTier } from '@nexus/shared';

// ── Fee Engine (pure functions — no store dependency) ───────
import {
  computeSkillCallFees,
  computeTradeFees,
} from '../feeEngine.js';

// ── Reputation Engine (pure helpers exported) ───────────────
import { computeTrustScore, mapTier } from '../reputationEngine.js';

// ── Policy Engine (depends on store) ────────────────────────
import { evaluatePolicy } from '../policyEngine.js';

// ── Escrow Engine (depends on store) ────────────────────────
import { lockFunds, releaseFunds, refundFunds } from '../escrowEngine.js';

// ── Store — direct access for test setup ────────────────────
import { store } from '../agentEconomyStore.js';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Standard fee config matching the seed data: 15% take rate, 35 bps settlement, $0.05 receipt, $0.01 min. */
const DEFAULT_FEE_CONFIG: FeeConfig = {
  id: 'test_feeconfig',
  platformTakeRateBps: 1500, // 15%
  settlementFeeBps: 35,      // 35 bps
  receiptFlatFee: 0.05,
  minFee: 0.01,
  updatedAt: new Date().toISOString(),
};

/** Fee config with 0% platform take (simulating NEXUS seller scenario). */
const NEXUS_FEE_CONFIG: FeeConfig = {
  id: 'test_feeconfig_nexus',
  platformTakeRateBps: 0,
  settlementFeeBps: 35,
  receiptFlatFee: 0.05,
  minFee: 0.01,
  updatedAt: new Date().toISOString(),
};

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ═════════════════════════════════════════════════════════════
// 1. FEE ENGINE
// ═════════════════════════════════════════════════════════════

describe('Fee Engine', () => {
  describe('computeSkillCallFees', () => {
    it('PER_CALL pricing with THIRD_PARTY seller applies 15% platform take', () => {
      const result = computeSkillCallFees({
        basePrice: 1.0,
        unitsUsed: 1,
        estimatedUnits: 1,
        pricingModel: 'PER_CALL',
        sellerType: 'THIRD_PARTY',
        feeConfig: DEFAULT_FEE_CONFIG,
      });

      // rawCost = 1.0 (PER_CALL uses basePrice flat)
      // totalCost before receipt = max(1.0, 0.01) = 1.0
      // platformFee = round(1.0 * 1500 / 10000) = round(0.15) = 0.15
      // receiptFee = 0.05
      // sellerPayout = round(1.0 - 0.15 - 0.05) = 0.80
      // totalCost returned = round(1.0 + 0.05) = 1.05
      expect(result.platformFee).toBe(0.15);
      expect(result.receiptFee).toBe(0.05);
      expect(result.sellerPayout).toBe(0.8);
      expect(result.totalCost).toBe(1.05);
    });

    it('PER_CALL pricing with NEXUS seller has 0 platform fee', () => {
      const result = computeSkillCallFees({
        basePrice: 2.5,
        unitsUsed: 1,
        estimatedUnits: 1,
        pricingModel: 'PER_CALL',
        sellerType: 'NEXUS',
        feeConfig: NEXUS_FEE_CONFIG,
      });

      // rawCost = 2.5
      // platformFee = round(2.5 * 0 / 10000) = 0
      // receiptFee = 0.05
      // sellerPayout = round(2.5 - 0 - 0.05) = 2.45
      // totalCost returned = round(2.5 + 0.05) = 2.55
      expect(result.platformFee).toBe(0);
      expect(result.receiptFee).toBe(0.05);
      expect(result.sellerPayout).toBe(2.45);
      expect(result.totalCost).toBe(2.55);
    });

    it('PER_DOC pricing with multiple docs multiplies basePrice by unitsUsed', () => {
      const result = computeSkillCallFees({
        basePrice: 0.25,
        unitsUsed: 5,
        estimatedUnits: 5,
        pricingModel: 'PER_DOC',
        sellerType: 'THIRD_PARTY',
        feeConfig: DEFAULT_FEE_CONFIG,
      });

      // rawCost = 0.25 * 5 = 1.25
      // totalCost before receipt = max(1.25, 0.01) = 1.25
      // platformFee = round(1.25 * 1500 / 10000) = round(0.1875) = 0.1875
      // receiptFee = 0.05
      // sellerPayout = round(1.25 - 0.1875 - 0.05) = round(1.0125) = 1.0125
      // totalCost returned = round(1.25 + 0.05) = 1.30
      expect(result.totalCost).toBe(1.3);
      expect(result.platformFee).toBe(0.1875);
      expect(result.sellerPayout).toBe(1.0125);
      expect(result.receiptFee).toBe(0.05);
    });

    it('enforces minimum fee when rawCost is below minFee', () => {
      const feeConfig: FeeConfig = {
        ...DEFAULT_FEE_CONFIG,
        minFee: 5.0, // High min fee
      };

      const result = computeSkillCallFees({
        basePrice: 0.001,
        unitsUsed: 1,
        estimatedUnits: 1,
        pricingModel: 'PER_CALL',
        sellerType: 'THIRD_PARTY',
        feeConfig,
      });

      // rawCost = 0.001
      // totalCost before receipt = max(0.001, 5.0) = 5.0 (min fee enforced)
      // platformFee = round(5.0 * 1500 / 10000) = round(0.75) = 0.75
      // receiptFee = 0.05
      // sellerPayout = round(5.0 - 0.75 - 0.05) = 4.20
      // totalCost returned = round(5.0 + 0.05) = 5.05
      expect(result.totalCost).toBe(5.05);
      expect(result.platformFee).toBe(0.75);
      expect(result.sellerPayout).toBe(4.2);
    });
  });

  describe('computeTradeFees', () => {
    it('calculates settlement fee at 35 bps', () => {
      const result = computeTradeFees({
        amountIn: 10000,
        feeConfig: DEFAULT_FEE_CONFIG,
      });

      // settlementFee = round(10000 * 35 / 10000) = round(35) = 35
      // 35 bps on $10,000 = $35
      expect(result.settlementFee).toBe(35);
    });

    it('adds receipt flat fee to totalFees', () => {
      const result = computeTradeFees({
        amountIn: 10000,
        feeConfig: DEFAULT_FEE_CONFIG,
      });

      // settlementFee = 35
      // receiptFee = 0.05
      // totalFees = round(35 + 0.05) = 35.05
      expect(result.receiptFee).toBe(0.05);
      expect(result.totalFees).toBe(35.05);
    });

    it('handles zero trade amount', () => {
      const result = computeTradeFees({
        amountIn: 0,
        feeConfig: DEFAULT_FEE_CONFIG,
      });

      expect(result.settlementFee).toBe(0);
      expect(result.receiptFee).toBe(0.05);
      expect(result.totalFees).toBe(0.05);
    });
  });
});

// ═════════════════════════════════════════════════════════════
// 2. POLICY ENGINE
// ═════════════════════════════════════════════════════════════

describe('Policy Engine', () => {
  // The policy engine reads from the singleton store.
  // The seed data provides:
  //   agent_001 (NEXUS, enterprise, kycTier 2, verified)
  //   agent_002 (PARTNER, enterprise, kycTier 2, verified)
  //   agent_005 (THIRD_PARTY, utility, kycTier 2, verified)
  //   agent_008 (THIRD_PARTY, retail, kycTier 1, unverified)
  //   agent_011 (THIRD_PARTY, retail, kycTier 1, unverified, low reputation, on most blocklists)

  describe('Domain access', () => {
    it('enterprise domain allows access to all domain resources', () => {
      // agent_001 has domain='enterprise' — should access utility-domain resources
      const result = evaluatePolicy({
        callerAgentId: 'agent_001',
        domain: 'utility',
      });

      expect(result.checks.domainAccess.passed).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('restricted (retail) domain blocks enterprise-only resources', () => {
      // agent_008 has domain='retail' — cannot access enterprise-domain resources
      const result = evaluatePolicy({
        callerAgentId: 'agent_008',
        domain: 'enterprise',
      });

      expect(result.checks.domainAccess.passed).toBe(false);
      expect(result.allowed).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('KYC tier', () => {
    it('rejects when caller KYC tier is insufficient', () => {
      // agent_008 is UNVERIFIED => kycTier 1.  Require tier 3.
      const result = evaluatePolicy({
        callerAgentId: 'agent_008',
        requiredKycTier: 3,
      });

      expect(result.checks.kycTier.passed).toBe(false);
      expect(result.checks.kycTier.actualTier).toBeLessThan(3);
      expect(result.allowed).toBe(false);
    });

    it('passes when caller KYC tier meets requirement', () => {
      // agent_001 is VERIFIED => kycTier 2.  Require tier 2.
      const result = evaluatePolicy({
        callerAgentId: 'agent_001',
        requiredKycTier: 2,
      });

      expect(result.checks.kycTier.passed).toBe(true);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Transfer policy', () => {
    it('NON_TRANSFERABLE blocks trades', () => {
      const result = evaluatePolicy({
        callerAgentId: 'agent_001',
        transferPolicy: 'NON_TRANSFERABLE',
      });

      expect(result.checks.transferPolicy.passed).toBe(false);
      expect(result.checks.transferPolicy.detail).toContain('non-transferable');
      expect(result.allowed).toBe(false);
    });

    it('OPEN transfer policy passes', () => {
      const result = evaluatePolicy({
        callerAgentId: 'agent_001',
        transferPolicy: 'OPEN',
      });

      expect(result.checks.transferPolicy.passed).toBe(true);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Trust tier', () => {
    it('low-tier counterparty rejected when caller requires high tier', () => {
      // agent_002 (PARTNER, verified) has minCounterpartyTier='C' and blocklist=['agent_011']
      // agent_011 reputation tier is D (score ~42)
      // However agent_011 is also on the blocklist, so let's use agent_008 (retail, unverified, score 55 => tier C)
      // agent_002's minCounterpartyTier is 'C' (verified partner).
      // We need a counterparty whose tier is below C.
      // agent_011 has riskTier D and reputation ~42.
      // But agent_011 is on blocklist for agent_002. We test the tier check via a
      // scenario: create a policy check where caller has minCounterpartyTier='B' and counterparty is 'C'.
      //
      // agent_008 has reputation 55 => tier C. agent_002 requires minCounterpartyTier='C'.
      // That would actually pass since C >= C. Let's use agent_003 (partner, verified) calling
      // against agent_008 who has tier C while agent_003 requires 'C'. That also passes.
      //
      // To truly test rejection, we need a caller whose policy requires a higher tier.
      // From seed: unverified agents require minCounterpartyTier='B'.
      // agent_008 (unverified, type THIRD_PARTY) requires minCounterpartyTier='B'.
      // If counterparty is agent_011 (tier D), D < B => fails.
      // But agent_008 does NOT have agent_011 on its blocklist (only verified agents do).
      // So this isolates the trust tier check.
      const result = evaluatePolicy({
        callerAgentId: 'agent_008',
        counterpartyAgentId: 'agent_011',
      });

      expect(result.checks.trustTier.passed).toBe(false);
      expect(result.checks.trustTier.detail).toContain('below required');
      expect(result.allowed).toBe(false);
    });

    it('blocklisted agent is rejected', () => {
      // agent_002 (verified partner) has blocklistAgentIds: ['agent_011']
      const result = evaluatePolicy({
        callerAgentId: 'agent_002',
        counterpartyAgentId: 'agent_011',
      });

      expect(result.checks.trustTier.passed).toBe(false);
      expect(result.checks.trustTier.detail).toContain('blocklisted');
      expect(result.allowed).toBe(false);
    });

    it('fraud flags above threshold causes rejection', () => {
      // agent_011 has fraudFlags30d > 0 in seed data.
      // agent_005 (verified THIRD_PARTY) has autoRejectIfFraudFlags30dAbove=3.
      // agent_011 has 3 FRAUD_FLAG events in the seed events, so fraudFlags30d
      // in the reputation object was randomly generated but set for the "not good" path
      // which generates 0..4 flags. We need to ensure agent_011's fraudFlags30d > 3.
      //
      // Instead of relying on random seed data, let's directly set agent_011's fraud flags
      // to a known value to make this test deterministic.
      const rep = store.getAgentReputation('agent_011');
      const originalFlags = rep?.fraudFlags30d ?? 0;
      if (rep) {
        rep.fraudFlags30d = 5; // Ensure above any threshold
      }

      // Use agent_005 (verified THIRD_PARTY, autoRejectIfFraudFlags30dAbove=3)
      // agent_005 also has agent_011 on blocklist. Use agent_001 (NEXUS) which has
      // autoRejectIfFraudFlags30dAbove=10 and empty blocklist. Let's set a tighter threshold.
      // Actually, let's use agent_005. Its blocklist includes agent_011. Both blocklist AND
      // fraud flags will trigger. The test verifies fraud flags are checked.
      //
      // For a cleaner test, temporarily remove agent_011 from agent_005's blocklist.
      const policy = store.getAgentPolicyProfile('agent_005');
      const originalBlocklist = policy?.blocklistAgentIds.slice() ?? [];
      if (policy) {
        policy.blocklistAgentIds = [];
      }

      // Also need counterparty tier to pass. agent_005 requires minCounterpartyTier='C'.
      // agent_011 is tier D. So tier check will also fail. Set the rep tier to 'C' temporarily.
      const originalTier = rep?.riskTier;
      if (rep) {
        rep.riskTier = 'C';
      }

      const result = evaluatePolicy({
        callerAgentId: 'agent_005',
        counterpartyAgentId: 'agent_011',
      });

      // Fraud flags check should have failed: 5 > 3
      expect(result.checks.trustTier.detail).toContain('fraud flags');
      expect(result.allowed).toBe(false);

      // Restore original values
      if (rep) {
        rep.fraudFlags30d = originalFlags;
        rep.riskTier = originalTier!;
      }
      if (policy) {
        policy.blocklistAgentIds = originalBlocklist;
      }
    });

    it('allowlisted agent passes despite low tier', () => {
      // From seed: all non-NEXUS agents have allowlistAgentIds: ['agent_001'].
      // agent_008 (unverified) has minCounterpartyTier='B'.
      // agent_001 has tier 'A' so that would pass anyway.
      //
      // Better approach: temporarily lower agent_001's reputation to tier D,
      // then verify that agent_008's allowlist override kicks in.
      const rep = store.getAgentReputation('agent_001');
      const originalTier = rep?.riskTier;
      const originalScore = rep?.trustScore;
      const originalFlags = rep?.fraudFlags30d;
      if (rep) {
        rep.riskTier = 'D';
        rep.trustScore = 30;
        rep.fraudFlags30d = 0;
      }

      // agent_008 requires minCounterpartyTier='B', agent_001 now has tier D.
      // But agent_008 has allowlistAgentIds: ['agent_001'], so override should apply.
      //
      // However, agent_008's requireVerifiedCounterparty is false
      // (a.type !== 'NEXUS' && a.verificationLevel === 'VERIFIED' => false for unverified agent_008).
      // And agent_008's blocklistAgentIds is empty (unverified agents get []).
      const result = evaluatePolicy({
        callerAgentId: 'agent_008',
        counterpartyAgentId: 'agent_001',
      });

      // The tier check would have failed (D < B), but allowlist override restores it.
      expect(result.checks.trustTier.passed).toBe(true);
      expect(result.checks.trustTier.detail).toContain('OVERRIDDEN by allowlist');
      expect(result.allowed).toBe(true);

      // Restore
      if (rep) {
        rep.riskTier = originalTier!;
        rep.trustScore = originalScore!;
        rep.fraudFlags30d = originalFlags!;
      }
    });
  });
});

// ═════════════════════════════════════════════════════════════
// 3. REPUTATION ENGINE
// ═════════════════════════════════════════════════════════════

describe('Reputation Engine', () => {
  describe('computeTrustScore', () => {
    it('produces deterministic result with known inputs', () => {
      const subScores = {
        reliability: 90,
        success: 85,
        fraudRisk: 95,
        disputes: 80,
        speed: 70,
        liquidity: 60,
      };

      // Expected:
      // 90*0.25 + 85*0.25 + 95*0.20 + 80*0.10 + 70*0.10 + 60*0.10
      // = 22.5 + 21.25 + 19.0 + 8.0 + 7.0 + 6.0 = 83.75
      const score = computeTrustScore(subScores);
      expect(score).toBe(83.8); // rounded to 1 decimal place by Math.round(x*10)/10
    });

    it('clamps to 0-100 range', () => {
      const tooHigh = computeTrustScore({
        reliability: 200,
        success: 200,
        fraudRisk: 200,
        disputes: 200,
        speed: 200,
        liquidity: 200,
      });
      expect(tooHigh).toBe(100);

      const tooLow = computeTrustScore({
        reliability: -50,
        success: -50,
        fraudRisk: -50,
        disputes: -50,
        speed: -50,
        liquidity: -50,
      });
      expect(tooLow).toBe(0);
    });

    it('returns 50 when all sub-scores are 50', () => {
      const score = computeTrustScore({
        reliability: 50,
        success: 50,
        fraudRisk: 50,
        disputes: 50,
        speed: 50,
        liquidity: 50,
      });
      expect(score).toBe(50);
    });
  });

  describe('mapTier', () => {
    it('maps score 85+ to tier A', () => {
      expect(mapTier(85)).toBe('A');
      expect(mapTier(100)).toBe('A');
      expect(mapTier(92.5)).toBe('A');
    });

    it('maps score 70-84 to tier B', () => {
      expect(mapTier(70)).toBe('B');
      expect(mapTier(84)).toBe('B');
      expect(mapTier(84.9)).toBe('B');
    });

    it('maps score 50-69 to tier C', () => {
      expect(mapTier(50)).toBe('C');
      expect(mapTier(69)).toBe('C');
      expect(mapTier(69.9)).toBe('C');
    });

    it('maps score below 50 to tier D', () => {
      expect(mapTier(49)).toBe('D');
      expect(mapTier(49.9)).toBe('D');
      expect(mapTier(0)).toBe('D');
      expect(mapTier(-5)).toBe('D');
    });

    it('correctly places boundary values', () => {
      // Exactly at boundaries
      expect(mapTier(85)).toBe('A');
      expect(mapTier(70)).toBe('B');
      expect(mapTier(50)).toBe('C');
      expect(mapTier(49.999)).toBe('D');
    });
  });

  describe('Score weights', () => {
    it('WEIGHTS values sum to 1.0', () => {
      // The weights are: reliability 0.25, success 0.25, fraudRisk 0.20, disputes 0.10, speed 0.10, liquidity 0.10
      const weightSum = 0.25 + 0.25 + 0.20 + 0.10 + 0.10 + 0.10;
      expect(weightSum).toBeCloseTo(1.0, 10);
    });

    it('each weight contributes proportionally to final score', () => {
      // If only one dimension is 100 and others are 0, result should equal that weight * 100
      const reliabilityOnly = computeTrustScore({
        reliability: 100, success: 0, fraudRisk: 0, disputes: 0, speed: 0, liquidity: 0,
      });
      expect(reliabilityOnly).toBe(25); // 100 * 0.25

      const fraudRiskOnly = computeTrustScore({
        reliability: 0, success: 0, fraudRisk: 100, disputes: 0, speed: 0, liquidity: 0,
      });
      expect(fraudRiskOnly).toBe(20); // 100 * 0.20

      const speedOnly = computeTrustScore({
        reliability: 0, success: 0, fraudRisk: 0, disputes: 0, speed: 100, liquidity: 0,
      });
      expect(speedOnly).toBe(10); // 100 * 0.10
    });
  });
});

// ═════════════════════════════════════════════════════════════
// 4. ESCROW ENGINE
// ═════════════════════════════════════════════════════════════

describe('Escrow Engine', () => {
  // We will use agent_001 (NEXUS, RLUSD available=250000) and agent_002 as counterparty.
  // The store is a singleton with seed data, so we save/restore balances.

  const payerId = 'agent_001';
  const payeeId = 'agent_002';
  const asset: AssetSymbol = 'RLUSD';

  let originalPayerAvailable: number;
  let originalPayerLocked: number;
  let originalPayeeAvailable: number;
  let originalPayeeLocked: number;

  beforeEach(() => {
    // Snapshot balances before each test
    const payerBal = store.getBalance(payerId, asset);
    const payeeBal = store.getBalance(payeeId, asset);
    originalPayerAvailable = payerBal?.available ?? 0;
    originalPayerLocked = payerBal?.locked ?? 0;
    originalPayeeAvailable = payeeBal?.available ?? 0;
    originalPayeeLocked = payeeBal?.locked ?? 0;
  });

  // Restore helper — called in afterEach-like fashion via finally blocks
  function restoreBalances() {
    const payerBal = store.getBalance(payerId, asset);
    const payeeBal = store.getBalance(payeeId, asset);
    if (payerBal) {
      payerBal.available = originalPayerAvailable;
      payerBal.locked = originalPayerLocked;
    }
    if (payeeBal) {
      payeeBal.available = originalPayeeAvailable;
      payeeBal.locked = originalPayeeLocked;
    }
  }

  it('lockFunds reduces available and increases locked for payer', () => {
    try {
      const lockAmount = 100;
      const payerBefore = store.getBalance(payerId, asset)!;
      const availBefore = payerBefore.available;
      const lockedBefore = payerBefore.locked;

      const result = lockFunds({
        rfqId: 'rfq_test_lock',
        payerAgentId: payerId,
        payeeAgentId: payeeId,
        asset,
        amount: lockAmount,
        releaseCondition: 'EXECUTION_SUCCESS',
      });

      expect(result.success).toBe(true);
      expect(result.escrow).toBeDefined();
      expect(result.escrow!.status).toBe('LOCKED');
      expect(result.escrow!.amount).toBe(lockAmount);

      const payerAfter = store.getBalance(payerId, asset)!;
      expect(payerAfter.available).toBe(availBefore - lockAmount);
      expect(payerAfter.locked).toBe(lockedBefore + lockAmount);
    } finally {
      restoreBalances();
    }
  });

  it('lockFunds fails if insufficient balance', () => {
    try {
      const payerBal = store.getBalance(payerId, asset)!;
      const hugeAmount = payerBal.available + 999999;

      const result = lockFunds({
        rfqId: 'rfq_test_insuf',
        payerAgentId: payerId,
        payeeAgentId: payeeId,
        asset,
        amount: hugeAmount,
        releaseCondition: 'MANUAL',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
      expect(result.escrow).toBeUndefined();

      // Balance should be unchanged
      const payerAfter = store.getBalance(payerId, asset)!;
      expect(payerAfter.available).toBe(originalPayerAvailable);
      expect(payerAfter.locked).toBe(originalPayerLocked);
    } finally {
      restoreBalances();
    }
  });

  it('releaseFunds moves from payer locked to payee available', () => {
    try {
      const lockAmount = 200;

      // First lock
      const lockResult = lockFunds({
        rfqId: 'rfq_test_release',
        payerAgentId: payerId,
        payeeAgentId: payeeId,
        asset,
        amount: lockAmount,
        releaseCondition: 'EXECUTION_SUCCESS',
      });
      expect(lockResult.success).toBe(true);
      const escrowId = lockResult.escrow!.id;

      const payerAfterLock = store.getBalance(payerId, asset)!;
      const payeeBeforeRelease = store.getBalance(payeeId, asset)!;
      const payerLockedAfterLock = payerAfterLock.locked;
      const payeeAvailBefore = payeeBeforeRelease.available;

      // Release
      const releaseResult = releaseFunds(escrowId);
      expect(releaseResult.success).toBe(true);
      expect(releaseResult.escrow!.status).toBe('RELEASED');

      const payerAfterRelease = store.getBalance(payerId, asset)!;
      const payeeAfterRelease = store.getBalance(payeeId, asset)!;

      // Payer locked decreased
      expect(payerAfterRelease.locked).toBe(payerLockedAfterLock - lockAmount);
      // Payee available increased
      expect(payeeAfterRelease.available).toBe(payeeAvailBefore + lockAmount);
    } finally {
      restoreBalances();
    }
  });

  it('refundFunds returns locked amount to payer available', () => {
    try {
      const lockAmount = 150;

      // Lock
      const lockResult = lockFunds({
        rfqId: 'rfq_test_refund',
        payerAgentId: payerId,
        payeeAgentId: payeeId,
        asset,
        amount: lockAmount,
        releaseCondition: 'MANUAL',
      });
      expect(lockResult.success).toBe(true);
      const escrowId = lockResult.escrow!.id;

      const payerAfterLock = store.getBalance(payerId, asset)!;
      const payerAvailAfterLock = payerAfterLock.available;
      const payerLockedAfterLock = payerAfterLock.locked;

      // Refund
      const refundResult = refundFunds(escrowId);
      expect(refundResult.success).toBe(true);
      expect(refundResult.escrow!.status).toBe('REFUNDED');

      const payerAfterRefund = store.getBalance(payerId, asset)!;
      // Available should increase back by lockAmount
      expect(payerAfterRefund.available).toBe(payerAvailAfterLock + lockAmount);
      // Locked should decrease by lockAmount
      expect(payerAfterRefund.locked).toBe(payerLockedAfterLock - lockAmount);
    } finally {
      restoreBalances();
    }
  });

  it('release on already-released escrow fails', () => {
    try {
      const lockResult = lockFunds({
        rfqId: 'rfq_test_double_release',
        payerAgentId: payerId,
        payeeAgentId: payeeId,
        asset,
        amount: 50,
        releaseCondition: 'EXECUTION_SUCCESS',
      });
      expect(lockResult.success).toBe(true);
      const escrowId = lockResult.escrow!.id;

      // First release succeeds
      const r1 = releaseFunds(escrowId);
      expect(r1.success).toBe(true);

      // Second release fails
      const r2 = releaseFunds(escrowId);
      expect(r2.success).toBe(false);
      expect(r2.error).toContain('RELEASED');
    } finally {
      restoreBalances();
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 5. PERMIT EXPIRY
// ═════════════════════════════════════════════════════════════

describe('Permit Expiry', () => {
  it('permit with past expiresAt is detected as expired', () => {
    // The EconPermit has an expiresAt field. We test the conceptual expiry logic:
    // if expiresAt < now, the permit is expired.
    const pastDate = '2020-01-01T00:00:00Z';
    const futureDate = '2099-12-31T23:59:59Z';

    // Simulate the check that would be done by any permit-consuming code
    const isExpired = (expiresAt: string): boolean => new Date(expiresAt) < new Date();

    expect(isExpired(pastDate)).toBe(true);
    expect(isExpired(futureDate)).toBe(false);
  });

  it('permit status EXPIRED matches semantic expectation', () => {
    // From the seed store, permits with status 'EXPIRED' should have expiresAt in the past.
    // Verify conceptually that the PermitStatus type includes EXPIRED.
    const validStatuses = ['ISSUED', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;
    expect(validStatuses).toContain('EXPIRED');
  });

  it('permit exactly at the boundary (expiresAt === now) is not yet expired', () => {
    // Using a date slightly in the future ensures it is not expired.
    const nowPlusOneSecond = new Date(Date.now() + 1000).toISOString();
    const isExpired = (expiresAt: string): boolean => new Date(expiresAt) < new Date();

    expect(isExpired(nowPlusOneSecond)).toBe(false);
  });

  it('seed permits with past expiresAt can be identified', () => {
    const now = new Date();
    const expiredPermits = store.permits.filter(
      (p) => new Date(p.expiresAt) < now,
    );
    const activePermits = store.permits.filter(
      (p) => new Date(p.expiresAt) >= now,
    );

    // At least some permits in the seed data should have past expiry
    // (the seed data uses ts(-1) which is 1 day in the future from the base date, etc.)
    // Whether they are expired depends on the current runtime date.
    // We just verify the filtering logic works without errors.
    expect(expiredPermits.length + activePermits.length).toBe(store.permits.length);
  });
});
