/**
 * Treasury Risk Analysis Engine
 *
 * Models 6 treasury threat vectors with probability, impact, risk scoring,
 * existing defenses, defense gaps, and recommendations.
 *
 * Protocol context:
 *   - Proposal-gated treasury with timelock
 *   - Multisig (3-of-5) for execution
 *   - DUNA legal structure
 *   - Cross-chain: XRPL hub + EVM spokes
 *   - On-chain voting with VP = (NXS + WTR*w + ENG*w) * NFT_mult
 */

import type { TreasuryThreat, TreasuryAttackReport } from './types';

// ─── Protocol Constants ──────────────────────────────────────────────────────

const TREASURY = {
  estimatedBalanceUSD: 300_000,
  multisigSigners: 5,
  multisigThreshold: 3,
  timelockHours: 48,
  proposalQuorum: 0.15,
  approvalThreshold: 0.66,
  maxSingleTransferPct: 1.0,     // currently no per-proposal cap
  yieldStrategies: ['stablecoin_lending', 'xrpl_amm'],
  custodyModel: 'multisig_xrpl',
  snapshotMechanism: 'block_height',
};

// ─── Threat Builders ─────────────────────────────────────────────────────────

function buildMultisigCompromise(): TreasuryThreat {
  // Attacker compromises 3 of 5 multisig keys through social engineering,
  // phishing, key theft, or insider collusion.
  const probability = 0.08; // Low but non-zero for a 3-of-5
  const impact = 10; // Maximum impact -- total treasury loss possible

  // Difficulty: attacker must compromise 3 independent signers
  // Each signer should use different key management (hardware wallet, cold storage, etc.)

  return {
    id: 'multisig_compromise',
    name: 'Multisig Key Compromise',
    description:
      `Attacker compromises ${TREASURY.multisigThreshold} of ${TREASURY.multisigSigners} ` +
      `multisig keys through phishing, social engineering, insider collusion, or key theft. ` +
      `Successful compromise enables direct treasury drain bypassing governance. ` +
      `Estimated exposure: $${TREASURY.estimatedBalanceUSD.toLocaleString()}.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      `${TREASURY.multisigThreshold}-of-${TREASURY.multisigSigners} threshold requires multiple compromises`,
      'Timelock provides observation window before execution',
      'DUNA legal structure enables off-chain recovery/litigation',
      'Proposal-gated: transactions must originate from approved proposals',
    ],
    gaps: [
      'No mandatory hardware wallet requirement for signers',
      'No geographic distribution requirement for signer keys',
      'No automatic key rotation schedule',
      'Signer identity may not be fully independent (overlapping social circles)',
      'No dead-man switch if signers become unresponsive',
    ],
  };
}

function buildProposalManipulation(): TreasuryThreat {
  // Attacker crafts misleading proposal that appears benign but contains
  // hidden treasury drain logic or misdirected fund transfers.
  const probability = 0.15;
  const impact = 8;

  return {
    id: 'proposal_manipulation',
    name: 'Proposal Manipulation',
    description:
      `Attacker submits proposal with misleading title/description that obscures actual ` +
      `treasury transfer logic. Could use technical jargon, complex multi-step execution, ` +
      `or time-delayed actions to hide malicious fund transfers. Community votes based on ` +
      `proposal narrative without auditing execution payload.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      'Timelock (48h) allows post-approval review before execution',
      'On-chain transaction transparency enables audit',
      'Community review during voting period',
      'Multisig signers can refuse to execute suspicious proposals',
    ],
    gaps: [
      'No mandatory proposal audit requirement for treasury proposals',
      'No standardized proposal execution format (human-readable transaction spec)',
      'Limited technical sophistication of average voter to evaluate execution logic',
      'No proposal simulation/preview showing exact treasury impact',
      'Batch proposals could hide small drains among legitimate transfers',
    ],
  };
}

function buildSnapshotManipulation(): TreasuryThreat {
  // Attacker manipulates the VP snapshot timing to inflate their voting power
  // at the moment of proposal creation.
  const probability = 0.12;
  const impact = 7;

  return {
    id: 'snapshot_manipulation',
    name: 'Snapshot Timing Manipulation',
    description:
      `Attacker accumulates tokens just before snapshot block, votes with inflated VP, ` +
      `then sells immediately after. Flash-loan style attack: borrow large NXS position, ` +
      `hold through snapshot, vote, repay. Cross-chain bridging could exploit snapshot ` +
      `timing differences between XRPL and EVM.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      'Block-height snapshot taken at proposal creation',
      'Burn-on-origin bridge model prevents cross-chain double counting',
      'NFT multiplier requires holding NFT at snapshot (not just tokens)',
      'Minimum NXS threshold to vote creates entry cost',
    ],
    gaps: [
      'No minimum holding period before snapshot eligibility',
      'Flash loan protection not explicitly implemented',
      'Snapshot block is predictable once proposal is queued',
      'No time-weighted average balance (TWAB) for VP calculation',
      'Cross-chain snapshot synchronization latency could be exploited',
    ],
  };
}

function buildLockSpoofing(): TreasuryThreat {
  // Attacker creates fake lock positions to inflate VP without actually
  // reducing liquidity (e.g., locking in a contract they control that allows
  // early withdrawal, or exploiting lock contract bugs).
  const probability = 0.10;
  const impact = 6;

  return {
    id: 'lock_spoofing',
    name: 'Lock Position Spoofing',
    description:
      `Attacker creates fraudulent lock positions that appear locked but can be withdrawn ` +
      `at will. Methods include: deploying wrapper contracts that appear as locks, ` +
      `exploiting lock contract upgrade paths, or manipulating lock duration reporting. ` +
      `Spoofed locks gain VP multiplier benefits without genuine illiquidity commitment.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      'Lock contracts are immutable on XRPL (trustline-based)',
      'On-chain lock verification is publicly auditable',
      'Lock duration is enforced by ledger-level mechanics',
    ],
    gaps: [
      'No lock contract formal verification or audit history',
      'Wrapper contracts around lock positions are not monitored',
      'EVM-side locks may have different security properties than XRPL locks',
      'No mechanism to detect synthetic lock positions',
    ],
  };
}

function buildYieldMisallocation(): TreasuryThreat {
  // Treasury yield strategies are manipulated or poorly managed,
  // resulting in loss of treasury funds through DeFi exploits,
  // impermanent loss, or rug pulls on yield venues.
  const probability = 0.20;
  const impact = 6;

  return {
    id: 'yield_misallocation',
    name: 'Yield Strategy Misallocation',
    description:
      `Treasury yield strategies suffer losses through DeFi protocol exploits, ` +
      `impermanent loss exceeding projections, smart contract vulnerabilities in ` +
      `yield venues, or governance attacks on protocols where treasury has deposited ` +
      `funds. Current strategies: ${TREASURY.yieldStrategies.join(', ')}.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      'Yield strategy changes require governance approval',
      'Treasury diversification across multiple yield venues',
      'DUNA fiduciary duty applies to treasury management decisions',
    ],
    gaps: [
      'No formal risk framework for evaluating yield venue safety',
      'No maximum allocation limit per yield venue',
      'No automatic withdrawal triggers based on yield venue health metrics',
      'No insurance coverage for DeFi exploit losses',
      'Impermanent loss monitoring and thresholds not defined',
      'No whitelist/blacklist system for approved yield protocols',
    ],
  };
}

function buildFederationOverride(): TreasuryThreat {
  // Federation-level governance override: a federation DAO with special
  // privileges uses override authority to redirect treasury funds.
  const probability = 0.05;
  const impact = 9;

  return {
    id: 'federation_override',
    name: 'Federation Governance Override',
    description:
      `A federation DAO with elevated privileges (e.g., emergency powers, ` +
      `guardian role) uses override authority to redirect treasury funds ` +
      `outside normal governance process. Could be triggered by compromised ` +
      `federation DAO leadership or manufactured emergency justification.`,
    probability,
    impact,
    riskScore: Math.round(probability * impact * 10),
    defenses: [
      'DUNA legal structure constrains federation authority',
      'Override actions still require multisig execution',
      'On-chain transparency for all treasury movements',
      'Timelock applies to override actions',
    ],
    gaps: [
      'Emergency override scope is not precisely defined on-chain',
      'No automatic sunset clause on emergency powers',
      'Federation DAO internal governance may have weaker security than main DAO',
      'No cross-federation approval requirement for override actions',
      'Override audit trail may not include sufficient justification documentation',
    ],
  };
}

// ─── Scoring & Analysis ──────────────────────────────────────────────────────

function identifyCriticalFailurePoints(threats: TreasuryThreat[]): string[] {
  const critical: string[] = [];

  for (const t of threats) {
    if (t.riskScore >= 10) {
      critical.push(`${t.name}: risk score ${t.riskScore}/100`);
    }
    // Also flag threats with many gaps
    if (t.gaps.length >= 4) {
      critical.push(`${t.name}: ${t.gaps.length} defense gaps identified`);
    }
  }

  // Add systemic risks
  critical.push('Single custody model (XRPL multisig) creates single point of failure');
  critical.push('No per-proposal treasury transfer cap enables total drain via single proposal');

  return [...new Set(critical)]; // deduplicate
}

function generateRequiredUpgrades(threats: TreasuryThreat[]): string[] {
  const upgrades: string[] = [
    'Implement per-proposal treasury cap (max 10% of balance per proposal)',
    'Add progressive timelock: larger transfers require longer timelock',
    'Deploy hardware wallet mandate for all multisig signers',
    'Implement time-weighted average balance (TWAB) for VP snapshots',
    'Create formal yield venue risk assessment framework',
    'Add treasury insurance fund (5% of balance) for exploit recovery',
    'Implement automated treasury health dashboard with real-time alerts',
    'Add mandatory proposal simulation showing treasury impact preview',
  ];

  return upgrades;
}

function calculateOverallRisk(threats: TreasuryThreat[]): number {
  // Overall risk is weighted by impact -- higher impact threats matter more
  let weightedRisk = 0;
  let totalWeight = 0;

  for (const t of threats) {
    weightedRisk += t.riskScore * t.impact;
    totalWeight += t.impact;
  }

  return totalWeight > 0 ? Math.round(weightedRisk / totalWeight) : 50;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyze 6 treasury threat vectors against the NEXUS treasury model.
 * Returns per-threat risk assessment, critical failure points, and required upgrades.
 */
export function analyzeTreasuryRisk(): TreasuryAttackReport {
  const threats: TreasuryThreat[] = [
    buildMultisigCompromise(),
    buildProposalManipulation(),
    buildSnapshotManipulation(),
    buildLockSpoofing(),
    buildYieldMisallocation(),
    buildFederationOverride(),
  ];

  return {
    threats,
    criticalFailurePoints: identifyCriticalFailurePoints(threats),
    requiredUpgrades: generateRequiredUpgrades(threats),
    overallRiskScore: calculateOverallRisk(threats),
  };
}
