/**
 * Policy Engine — evaluates domain access, KYC tier, transfer policy, and trust tier checks.
 */
import type { RiskTier, TransferPolicy } from '@nexus/shared';
import { store } from './agentEconomyStore.js';

export interface PolicyDecision {
  allowed: boolean;
  reasons: string[];
  checks: {
    domainAccess: { passed: boolean; detail: string };
    kycTier: { passed: boolean; requiredTier: number; actualTier: number; detail: string };
    transferPolicy: { passed: boolean; policy: string; detail: string };
    trustTier: { passed: boolean; requiredTier: string; actualTier: string; detail: string };
  };
}

/**
 * Evaluate whether a caller agent is allowed to perform an action given policy constraints.
 */
export function evaluatePolicy(params: {
  callerAgentId: string;
  counterpartyAgentId?: string;
  requiredKycTier?: number;
  domain?: string;
  transferPolicy?: TransferPolicy;
  skillPolicyTags?: Record<string, unknown>;
}): PolicyDecision {
  const { callerAgentId, counterpartyAgentId, requiredKycTier = 0, domain, transferPolicy, skillPolicyTags } = params;

  const reasons: string[] = [];

  // ── Domain Access Check ──────────────────────────────────
  const callerWallet = store.walletAccounts.find((w) => w.ownerId === callerAgentId);
  const callerDomain = callerWallet?.domain ?? 'retail';
  let domainPassed = true;
  let domainDetail = `Caller domain: ${callerDomain}`;

  if (domain && callerDomain !== domain && callerDomain !== 'enterprise') {
    domainPassed = false;
    domainDetail = `Caller domain '${callerDomain}' does not have access to '${domain}' resources`;
    reasons.push(domainDetail);
  }

  // ── KYC Tier Check ──────────────────────────────────────
  const callerKycTier = callerWallet?.kycTier ?? 0;
  const effectiveRequired = requiredKycTier || (skillPolicyTags?.requireKyc as number) || 0;
  let kycPassed = callerKycTier >= effectiveRequired;
  let kycDetail = `KYC tier ${callerKycTier} >= required ${effectiveRequired}`;
  if (!kycPassed) {
    kycDetail = `KYC tier ${callerKycTier} < required ${effectiveRequired}`;
    reasons.push(kycDetail);
  }

  // ── Transfer Policy Check ───────────────────────────────
  let transferPassed = true;
  let transferDetail = transferPolicy ? `Transfer policy: ${transferPolicy}` : 'No transfer policy restriction';

  if (transferPolicy === 'NON_TRANSFERABLE') {
    transferPassed = false;
    transferDetail = 'Asset is non-transferable; only retirement/redemption allowed';
    reasons.push(transferDetail);
  } else if (transferPolicy === 'PERMISSIONED') {
    // For permissioned assets, caller must be at least KYC tier 1
    if (callerKycTier < 1) {
      transferPassed = false;
      transferDetail = 'Permissioned asset requires KYC tier >= 1';
      reasons.push(transferDetail);
    }
  }

  // ── Trust Tier Check ─────────────────────────────────────
  let trustPassed = true;
  let requiredTier: RiskTier = 'D';
  let actualTier: RiskTier = 'D';
  let trustDetail = 'No trust tier restriction';

  if (counterpartyAgentId) {
    const callerPolicy = store.getAgentPolicyProfile(callerAgentId);
    const counterpartyRep = store.getAgentReputation(counterpartyAgentId);
    const callerRep = store.getAgentReputation(callerAgentId);

    actualTier = counterpartyRep?.riskTier ?? 'D';
    requiredTier = callerPolicy?.minCounterpartyTier ?? 'D';

    const tierOrder: Record<RiskTier, number> = { A: 4, B: 3, C: 2, D: 1 };
    if (tierOrder[actualTier] < tierOrder[requiredTier]) {
      trustPassed = false;
      trustDetail = `Counterparty tier ${actualTier} below required ${requiredTier}`;
      reasons.push(trustDetail);
    } else {
      trustDetail = `Counterparty tier ${actualTier} meets minimum ${requiredTier}`;
    }

    // Check verification requirement
    if (callerPolicy?.requireVerifiedCounterparty) {
      const counterpartyAgent = store.getAgent(counterpartyAgentId);
      if (counterpartyAgent && counterpartyAgent.verificationLevel === 'UNVERIFIED') {
        trustPassed = false;
        trustDetail += '; Counterparty is UNVERIFIED but verification required';
        reasons.push('Counterparty verification required but agent is UNVERIFIED');
      }
    }

    // Check blocklist
    if (callerPolicy?.blocklistAgentIds.includes(counterpartyAgentId)) {
      trustPassed = false;
      trustDetail += '; Counterparty is blocklisted';
      reasons.push('Counterparty is on caller blocklist');
    }

    // Check fraud flags
    if (callerPolicy && counterpartyRep) {
      if (counterpartyRep.fraudFlags30d > callerPolicy.autoRejectIfFraudFlags30dAbove) {
        trustPassed = false;
        trustDetail += `; Counterparty has ${counterpartyRep.fraudFlags30d} fraud flags (max ${callerPolicy.autoRejectIfFraudFlags30dAbove})`;
        reasons.push(`Counterparty fraud flags exceed threshold`);
      }
    }

    // Allowlist override: if counterparty is on allowlist, override trust failures
    if (callerPolicy?.allowlistAgentIds.includes(counterpartyAgentId)) {
      if (!trustPassed) {
        trustPassed = true;
        trustDetail += ' [OVERRIDDEN by allowlist]';
        reasons.length = 0; // Clear trust-related reasons
      }
    }
  }

  const allowed = domainPassed && kycPassed && transferPassed && trustPassed;

  return {
    allowed,
    reasons,
    checks: {
      domainAccess: { passed: domainPassed, detail: domainDetail },
      kycTier: { passed: kycPassed, requiredTier: effectiveRequired, actualTier: callerKycTier, detail: kycDetail },
      transferPolicy: { passed: transferPassed, policy: transferPolicy ?? 'OPEN', detail: transferDetail },
      trustTier: { passed: trustPassed, requiredTier, actualTier, detail: trustDetail },
    },
  };
}
