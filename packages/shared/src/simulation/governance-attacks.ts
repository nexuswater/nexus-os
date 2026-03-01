/**
 * Governance Attack Simulation Engine
 *
 * Analyzes 10 adversarial governance attack scenarios against the NEXUS protocol.
 * Evaluates probability, capital requirements, execution time, severity,
 * existing mitigations, and recommendations for each attack vector.
 *
 * Governance model reference:
 *   VP = (NXS + WTR_active * wtr_weight + ENG_active * eng_weight) * NFT_multiplier
 *   NFT tiers: Common(1.0), Uncommon(1.05), Rare(1.12), Epic(1.25), Legendary(1.4)
 *   Cross-chain: XRPL hub + EVM spokes, burn-on-origin bridge model
 *   Treasury: proposal-gated with timelock, DUNA legal structure
 */

import type { AttackScenario, AttackResistanceReport, AttackType } from './types';

// ─── Protocol Constants ──────────────────────────────────────────────────────

const PROTOCOL = {
  totalNXSSupply: 1_000_000,
  totalMPTSupply: 750_000,         // WTR + ENG combined
  wtrWeight: 0.3,
  engWeight: 0.2,
  nftMultipliers: {
    Common: 1.0,
    Uncommon: 1.05,
    Rare: 1.12,
    Epic: 1.25,
    Legendary: 1.4,
  },
  defaultQuorum: 0.15,             // 15% participation threshold
  approvalThreshold: 0.66,         // 66% supermajority
  timelockHours: 48,
  proposalThresholdMultiplier: 10,
  multisigSigners: 5,
  multisigThreshold: 3,
  nxsRewardRate: 0.02,
  retirementDurationMonths: 12,
  federationDAOCount: 4,
};

// ─── Scenario Definitions ────────────────────────────────────────────────────

function buildScenarios(): AttackScenario[] {
  return [
    buildWhaleAccumulation(),
    buildWhaleLockDominance(),
    buildQuadraticGaming(),
    buildFederationCollusion(),
    buildLowParticipation(),
    buildSybilAttack(),
    buildCrossChainDoubleVote(),
    buildParameterHijack(),
    buildTreasuryDrain(),
    buildAIAdvisorManipulation(),
  ];
}

// ─── 1. Whale Accumulation ───────────────────────────────────────────────────

function buildWhaleAccumulation(): AttackScenario {
  // Attacker attempts to accumulate 30% of MPT supply to dominate governance.
  // With linear VP, 30% MPT gives ~30% of impact-weighted VP (before NXS component).
  // However, VP also includes NXS (1:1) so actual governance share depends on NXS distribution.
  // Estimated cost: 30% of MPT at assumed price of $2/unit = $450K MPT + NXS accumulation.
  const mptTarget = PROTOCOL.totalMPTSupply * 0.3;
  const estimatedMPTPrice = 2.0;
  const estimatedNXSForDominance = PROTOCOL.totalNXSSupply * 0.2;
  const estimatedNXSPrice = 5.0;
  const capitalRequired = (mptTarget * estimatedMPTPrice) + (estimatedNXSForDominance * estimatedNXSPrice);

  // Linear VP makes accumulation directly proportional to holdings -- no sqrt dampening.
  // With 30% MPT and 20% NXS, effective VP share is approximately:
  // (0.2 * NXS_total + 0.3 * MPT_total * avg_weight) / total_VP
  const effectiveVPShare = 0.28; // ~28% of total voting power

  // Probability assessment: requires sustained OTC acquisition, market would notice
  const probability = 25; // 25% likelihood of achieving 30% without detection

  return {
    id: 'whale_accumulation',
    name: 'Whale Accumulation Attack',
    description:
      `Adversary accumulates 30% of MPT supply (${mptTarget.toLocaleString()} units) plus ` +
      `significant NXS holdings to achieve ~${(effectiveVPShare * 100).toFixed(0)}% voting power share. ` +
      `Linear VP model makes this proportionally effective without diminishing returns.`,
    successProbability: probability,
    requiredCapital: Math.round(capitalRequired),
    timeToExecute: 180, // 6 months of gradual accumulation
    severity: 7,
    mitigations: [
      'Quorum requirement (15%) ensures broad participation needed',
      'Supermajority threshold (66%) means 28% VP alone cannot pass proposals',
      'Timelock (48h) provides community response window',
      'NFT multiplier caps at 1.4x, limiting pure-capital advantage',
      'DUNA legal structure provides off-chain recourse against hostile governance',
    ],
    recommendations: [
      'Implement maximum VP cap per wallet (e.g., 5% of total VP)',
      'Add progressive VP dampening above concentration thresholds',
      'Introduce wallet-age weighting to penalize rapid accumulation',
      'Deploy on-chain concentration monitoring with automated alerts',
      'Consider quadratic VP for large holders while keeping linear for small ones',
    ],
    adequateDefense: false,
  };
}

// ─── 2. Whale Lock Dominance ─────────────────────────────────────────────────

function buildWhaleLockDominance(): AttackScenario {
  // Whale locks large position for maximum duration, gaining disproportionate
  // governance power through lock multiplier + NFT tier stacking.
  // If lock multiplier is added (e.g., 2x for 12-month lock), a whale with
  // Legendary NFT (1.4x) gets 2.8x amplification on locked tokens.
  const lockMultiplier = 2.0; // hypothetical max lock multiplier
  const nftMultiplier = PROTOCOL.nftMultipliers.Legendary;
  const combinedMultiplier = lockMultiplier * nftMultiplier;

  // 15% of supply with 2.8x multiplier = effective 42% VP
  const supplyShare = 0.15;
  const effectiveVPShare = supplyShare * combinedMultiplier;

  const capitalRequired = PROTOCOL.totalNXSSupply * supplyShare * 5.0 +
                           PROTOCOL.totalMPTSupply * supplyShare * 2.0;

  return {
    id: 'whale_lock_dominance',
    name: 'Whale Lock Dominance',
    description:
      `Whale locks ${(supplyShare * 100).toFixed(0)}% of supply for maximum duration with Legendary NFT, ` +
      `achieving ${(effectiveVPShare * 100).toFixed(0)}% effective VP through multiplier stacking ` +
      `(${combinedMultiplier.toFixed(1)}x combined amplification).`,
    successProbability: 30,
    requiredCapital: Math.round(capitalRequired),
    timeToExecute: 90,
    severity: 8,
    mitigations: [
      'NFT multiplier capped at 1.4x (Legendary tier)',
      'Lock duration currently does not grant VP multiplier in base formula',
      'Supermajority approval threshold prevents unilateral control',
      'Timelock allows community coordination against hostile proposals',
    ],
    recommendations: [
      'If adding lock multipliers, cap combined (lock * NFT) at 2.0x maximum',
      'Implement diminishing returns on lock multiplier above median lock duration',
      'Add VP concentration circuit breaker: auto-pause governance if single wallet exceeds 15% VP',
      'Require minimum voter diversity (e.g., 10+ unique wallets) for proposal passage',
      'Implement lock-weighted quorum that scales with concentration',
    ],
    adequateDefense: true, // Currently safe because lock multiplier is not in base formula
  };
}

// ─── 3. Quadratic Gaming ─────────────────────────────────────────────────────

function buildQuadraticGaming(): AttackScenario {
  // If the protocol adopts quadratic voting (sqrt(balance)), splitting funds
  // across N wallets increases total VP by sqrt(N).
  // Example: 10,000 NXS in 1 wallet = sqrt(10000) = 100 VP
  //          10,000 NXS across 100 wallets = 100 * sqrt(100) = 1000 VP (10x gain)
  const totalHolding = 10_000;
  const numWallets = 100;
  const singleWalletVP = Math.sqrt(totalHolding);
  const splitVP = numWallets * Math.sqrt(totalHolding / numWallets);
  const vpGainMultiplier = splitVP / singleWalletVP;

  return {
    id: 'quadratic_gaming',
    name: 'Quadratic Voting Exploitation',
    description:
      `If quadratic VP is adopted, splitting ${totalHolding.toLocaleString()} NXS across ` +
      `${numWallets} wallets yields ${vpGainMultiplier.toFixed(1)}x VP gain ` +
      `(${singleWalletVP.toFixed(0)} VP single vs ${splitVP.toFixed(0)} VP split). ` +
      `Current linear model is NOT vulnerable but this vector matters if sqrt VP is considered.`,
    successProbability: 15, // Lower because current model is linear
    requiredCapital: totalHolding * 5, // NXS cost only
    timeToExecute: 7, // Quick to execute once wallets are set up
    severity: 9, // Critical if quadratic is adopted without safeguards
    mitigations: [
      'Current protocol uses LINEAR VP -- quadratic gaming is NOT currently exploitable',
      'NFT requirement for voting creates per-wallet cost (Source Node NFTs are scarce)',
      'On-chain activity analysis can detect wallet clustering',
      'Minimum NXS threshold to vote creates per-wallet entry cost',
    ],
    recommendations: [
      'If adopting quadratic VP, require unique identity attestation per wallet',
      'Implement Source Node NFT requirement for each voting wallet',
      'Add behavioral analysis: cluster detection for wallets funded from same source',
      'Consider hybrid model: linear for base, sqrt dampening only above threshold',
      'Mandate minimum on-chain history (age, transaction diversity) for voting eligibility',
    ],
    adequateDefense: true, // Current linear model is immune
  };
}

// ─── 4. Federation Collusion ─────────────────────────────────────────────────

function buildFederationCollusion(): AttackScenario {
  // Multiple federation DAOs coordinate to control governance outcomes.
  // With N federation DAOs, collusion between ceil(N/2)+1 can dominate.
  const daoCount = PROTOCOL.federationDAOCount;
  const collusionThreshold = Math.ceil(daoCount / 2) + 1;
  const collusionVPShare = collusionThreshold / daoCount;

  // If federation DAOs each control ~15% of VP, 3 colluding = 45%
  const perDAOVPShare = 0.15;
  const colludingVP = collusionThreshold * perDAOVPShare;

  return {
    id: 'federation_collusion',
    name: 'Federation DAO Collusion',
    description:
      `${collusionThreshold} of ${daoCount} federation DAOs collude to control ` +
      `~${(colludingVP * 100).toFixed(0)}% of voting power, exceeding the supermajority ` +
      `threshold if they coordinate votes across proposals.`,
    successProbability: 20,
    requiredCapital: 0, // No capital needed -- social/political coordination
    timeToExecute: 30,
    severity: 8,
    mitigations: [
      'DUNA legal structure imposes fiduciary duties on DAO operators',
      'Transparent on-chain voting makes collusion patterns detectable',
      'Timelock allows whistleblower response before execution',
      'Cross-DAO proposal review process creates friction',
    ],
    recommendations: [
      'Implement inter-DAO vote correlation monitoring',
      'Add mandatory cooling period between related proposals from different DAOs',
      'Require each federation DAO to have independent multisig with no overlapping signers',
      'Create governance council with rotating seats from each federation DAO',
      'Establish explicit anti-collusion covenant in DUNA operating agreement',
      'Add vote delegation transparency: show when DAOs delegate to each other',
    ],
    adequateDefense: false,
  };
}

// ─── 5. Low Participation Capture ────────────────────────────────────────────

function buildLowParticipation(): AttackScenario {
  // With 15% quorum and low participation, a small group can pass proposals.
  // If only 16% of VP participates, 66% of 16% = 10.6% of total VP needed.
  const quorum = PROTOCOL.defaultQuorum;
  const approvalThreshold = PROTOCOL.approvalThreshold;
  const lowParticipation = 0.16; // just above quorum
  const vpNeeded = lowParticipation * approvalThreshold;

  return {
    id: 'low_participation',
    name: 'Low-Participation Governance Capture',
    description:
      `With ${(quorum * 100).toFixed(0)}% quorum, attacker waits for apathy-driven low turnout ` +
      `(${(lowParticipation * 100).toFixed(0)}% participation) and needs only ` +
      `${(vpNeeded * 100).toFixed(1)}% of total VP to pass proposals. ` +
      `Holiday weekends and off-peak periods are optimal attack windows.`,
    successProbability: 40,
    requiredCapital: Math.round(PROTOCOL.totalNXSSupply * vpNeeded * 5),
    timeToExecute: 14, // Wait for low-participation window + voting period
    severity: 7,
    mitigations: [
      'Quorum threshold (15%) provides baseline protection',
      'Timelock (48h) gives community time to respond',
      'Delegate system allows passive holders to assign voting power',
      'Push notifications for active proposals (if implemented)',
    ],
    recommendations: [
      'Implement dynamic quorum: increase quorum requirement for treasury/parameter proposals',
      'Add anti-rush mechanism: extend voting period if quorum is barely met in final hours',
      'Create guardian committee with veto power for emergency proposals during low participation',
      'Gamify governance participation with NXS rewards for consistent voters',
      'Implement vote delegation with auto-expiry to maintain active delegate pool',
      'Add proposal pre-announcement period (72h before voting opens)',
    ],
    adequateDefense: false,
  };
}

// ─── 6. Sybil Attack ─────────────────────────────────────────────────────────

function buildSybilAttack(): AttackScenario {
  // Create multiple wallets to bypass per-wallet limits or amplify VP.
  // Under linear VP, splitting has NO advantage for raw VP.
  // However, Sybil can exploit:
  //   - Per-wallet airdrops or incentives
  //   - Multiple proposal submissions
  //   - Quorum inflation (more "unique" voters)
  //   - NFT multiplier if each wallet holds a separate NFT
  const numSybilWallets = 50;
  const costPerNFT = 200; // cheapest Common tier
  const nftCost = numSybilWallets * costPerNFT;

  return {
    id: 'sybil_attack',
    name: 'Sybil Wallet Splitting',
    description:
      `Attacker creates ${numSybilWallets} wallets to exploit per-wallet incentives, ` +
      `inflate unique voter counts, and potentially stack NFT multipliers across wallets. ` +
      `Under linear VP, raw voting power is unaffected by splitting, but ancillary ` +
      `benefits (airdrops, quorum gaming, proposal flooding) remain exploitable.`,
    successProbability: 35,
    requiredCapital: nftCost + 5000, // NFTs + gas/setup costs
    timeToExecute: 14,
    severity: 5,
    mitigations: [
      'Linear VP eliminates mathematical advantage of wallet splitting',
      'Source Node NFT requirement creates per-wallet cost barrier',
      'Minimum NXS threshold to vote adds entry cost per wallet',
      'On-chain analysis can detect wallet clusters (shared funding source)',
    ],
    recommendations: [
      'Implement on-chain Sybil scoring: flag wallets funded from same source within 24h',
      'Add progressive NFT pricing: cost increases with number minted per source address',
      'Require minimum on-chain age (30 days) and diversity (3+ unique interactions) to vote',
      'Weight quorum by VP-amount, not unique-wallet count',
      'Consider DID integration for proposal submission (one identity = one proposal right)',
    ],
    adequateDefense: true, // Linear VP + NFT cost makes this low-impact
  };
}

// ─── 7. Cross-Chain Double Voting ────────────────────────────────────────────

function buildCrossChainDoubleVote(): AttackScenario {
  // Attacker bridges NXS from XRPL to EVM, votes on XRPL, then votes on EVM
  // before bridge finality confirms the burn on origin chain.
  // The burn-on-origin model should prevent this, but bridge latency matters.
  const bridgeFinalityMinutes = 10; // estimated cross-chain confirmation time
  const votingWindowHours = PROTOCOL.timelockHours;

  return {
    id: 'cross_chain_double_vote',
    name: 'Cross-Chain Double Voting',
    description:
      `Attacker exploits bridge latency (${bridgeFinalityMinutes}min finality) to vote ` +
      `with NXS on XRPL, then bridge and vote again on EVM before the origin burn is ` +
      `confirmed. Burns-on-origin model should prevent this, but race conditions during ` +
      `bridge settlement could allow double-counting in a narrow window.`,
    successProbability: 10,
    requiredCapital: 5000, // Gas costs + bridge fees
    timeToExecute: 1, // Same-day exploit
    severity: 9,
    mitigations: [
      'Burn-on-origin bridge model: NXS is burned/locked on source chain before minting on destination',
      'XRPL-only impact weighting (WTR/ENG VP applies only on XRPL)',
      'NFT multiplier is XRPL-only, limiting EVM VP amplification',
      'Bridge confirmations should be required before destination VP activates',
    ],
    recommendations: [
      'Implement snapshot-based voting: VP calculated at block height BEFORE proposal creation',
      'Add bridge-aware cooldown: bridged tokens have 24h VP activation delay',
      'Deploy cross-chain vote registry with merkle proof verification',
      'Add bridge oracle confirmation requirement before EVM NXS counts toward VP',
      'Implement pessimistic VP accounting: deduct bridging tokens from source VP immediately',
    ],
    adequateDefense: true, // Burn-on-origin fundamentally prevents this
  };
}

// ─── 8. Parameter Hijack ─────────────────────────────────────────────────────

function buildParameterHijack(): AttackScenario {
  // Attacker passes a proposal to change governance parameters (quorum, weights,
  // thresholds) to benefit future attacks.
  // Example: reduce quorum from 15% to 3%, then pass treasury drain on next vote.
  const currentQuorum = PROTOCOL.defaultQuorum;
  const targetQuorum = 0.03;

  return {
    id: 'parameter_hijack',
    name: 'Governance Parameter Hijack',
    description:
      `Attacker submits proposal to change governance parameters (e.g., reduce quorum ` +
      `from ${(currentQuorum * 100).toFixed(0)}% to ${(targetQuorum * 100).toFixed(0)}%, ` +
      `lower approval threshold, extend timelock). This enables follow-up attacks under ` +
      `weakened rules. Two-step attack: relax parameters, then exploit relaxed governance.`,
    successProbability: 15,
    requiredCapital: Math.round(PROTOCOL.totalNXSSupply * 0.12 * 5), // ~12% VP needed
    timeToExecute: 30, // Two proposal cycles
    severity: 10,
    mitigations: [
      'Parameter changes require same governance thresholds as any proposal',
      'Timelock provides review window for parameter change proposals',
      'DUNA legal structure can override clearly malicious parameter changes',
      'Community monitoring of governance parameter proposals',
    ],
    recommendations: [
      'Implement parameter change proposals as a distinct type with HIGHER quorum (25%+)',
      'Add parameter bounds: hard-coded minimums (quorum >= 10%, approval >= 51%)',
      'Require multi-proposal confirmation: parameter changes need 2 sequential approvals',
      'Add guardian veto specifically for parameter changes',
      'Implement parameter change cooldown: max 1 parameter proposal per 30 days',
      'Hard-code immutable safety bounds in smart contract (not governable)',
    ],
    adequateDefense: false,
  };
}

// ─── 9. Treasury Drain ───────────────────────────────────────────────────────

function buildTreasuryDrain(): AttackScenario {
  // Attacker submits emergency treasury proposal to drain funds.
  // Emergency proposals may have expedited voting (shorter period, lower quorum).
  const emergencyVotingHours = 24;
  const estimatedTreasuryUSD = 500_000;

  return {
    id: 'treasury_drain',
    name: 'Emergency Treasury Drain',
    description:
      `Attacker submits emergency treasury proposal to transfer ` +
      `$${estimatedTreasuryUSD.toLocaleString()} from treasury to attacker-controlled address. ` +
      `Emergency proposals with ${emergencyVotingHours}h voting window reduce community ` +
      `response time. Combined with low-participation timing, this is the highest-impact vector.`,
    successProbability: 10,
    requiredCapital: Math.round(PROTOCOL.totalNXSSupply * 0.15 * 5),
    timeToExecute: 3,
    severity: 10,
    mitigations: [
      'Proposal-gated treasury with timelock enforcement',
      'Multisig requirement (3-of-5) for treasury execution',
      'Emergency proposals still require quorum and supermajority',
      'DUNA legal structure provides off-chain legal recourse',
      'Treasury transaction limits may cap single-proposal transfers',
    ],
    recommendations: [
      'Implement per-proposal treasury cap (e.g., max 10% of treasury per proposal)',
      'Add progressive timelock: larger amounts = longer timelock (72h for >5%, 7 days for >20%)',
      'Require multisig signers to be distinct from proposal submitter',
      'Add treasury guardian role with time-limited veto power',
      'Implement mandatory security review period for proposals exceeding threshold',
      'Add automatic treasury diversification across multiple custodial mechanisms',
    ],
    adequateDefense: false,
  };
}

// ─── 10. AI Advisor Manipulation ─────────────────────────────────────────────

function buildAIAdvisorManipulation(): AttackScenario {
  // If AI advisors are integrated into governance (proposal analysis, vote
  // recommendations), manipulating their inputs could sway voting outcomes.
  // Attack vectors: poisoned training data, adversarial prompt injection,
  // gaming the metrics that AI uses for recommendations.

  return {
    id: 'ai_advisor_manipulation',
    name: 'AI Governance Advisor Manipulation',
    description:
      `Attacker manipulates AI advisor recommendations by gaming input metrics ` +
      `(inflated impact scores, fabricated ESG data), adversarial prompt injection ` +
      `in proposal descriptions, or data poisoning of training datasets. If community ` +
      `relies on AI recommendations for voting decisions, manipulated outputs could ` +
      `systematically bias governance outcomes.`,
    successProbability: 20,
    requiredCapital: 10_000, // Low capital -- primarily technical sophistication
    timeToExecute: 60,
    severity: 6,
    mitigations: [
      'AI advisors provide recommendations only -- voters make final decisions',
      'Impact data verified through multi-source attestation pipeline',
      'Fraud detection (FraudSignal system) flags anomalous data inputs',
      'AI model outputs are non-binding and clearly labeled as advisory',
    ],
    recommendations: [
      'Implement adversarial robustness testing for AI recommendation models',
      'Add input validation and sanitization for proposal text fed to AI',
      'Deploy multiple independent AI models and flag divergent recommendations',
      'Create human-in-the-loop review for AI recommendations on high-value proposals',
      'Add transparency layer: show AI reasoning chain alongside recommendations',
      'Implement AI recommendation audit trail with community review mechanism',
    ],
    adequateDefense: true,
  };
}

// ─── Score Calculation Utilities ─────────────────────────────────────────────

function calculateOverallResistance(scenarios: AttackScenario[]): number {
  // Weighted average: higher severity attacks count more toward vulnerability
  let weightedDefense = 0;
  let totalWeight = 0;

  for (const s of scenarios) {
    const weight = s.severity;
    // Defense score: 100 = perfect defense, 0 = no defense
    // Lower probability + adequate defense = higher defense score
    const defenseScore = s.adequateDefense
      ? Math.max(20, 100 - s.successProbability)
      : Math.max(10, 80 - s.successProbability);
    weightedDefense += defenseScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedDefense / totalWeight) : 50;
}

function extractCriticalWeaknesses(scenarios: AttackScenario[]): string[] {
  return scenarios
    .filter(s => !s.adequateDefense && s.severity >= 7)
    .map(s => `${s.name}: ${s.severity}/10 severity, ${s.successProbability}% probability, defenses insufficient`);
}

function extractTopRecommendations(scenarios: AttackScenario[]): string[] {
  // Collect recommendations from highest-risk scenarios
  const sorted = [...scenarios].sort((a, b) => {
    const riskA = a.successProbability * a.severity;
    const riskB = b.successProbability * b.severity;
    return riskB - riskA;
  });

  const topRecs: string[] = [];
  for (const s of sorted.slice(0, 5)) {
    if (s.recommendations.length > 0) {
      topRecs.push(`[${s.name}] ${s.recommendations[0]}`);
    }
  }
  return topRecs;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyze 10 governance attack scenarios against the NEXUS protocol.
 * Returns a full resistance report with per-scenario analysis,
 * overall resistance score, critical weaknesses, and priority recommendations.
 */
export function analyzeGovernanceAttacks(): AttackResistanceReport {
  const scenarios = buildScenarios();
  const overallScore = calculateOverallResistance(scenarios);
  const criticalWeaknesses = extractCriticalWeaknesses(scenarios);
  const recommendedSafeguards = extractTopRecommendations(scenarios);

  return {
    overallScore,
    scenarios,
    criticalWeaknesses,
    recommendedSafeguards,
  };
}
