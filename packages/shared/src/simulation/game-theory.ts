/**
 * Game Theory Equilibrium Engine
 *
 * Evaluates 8 game-theoretic dimensions of the NEXUS protocol:
 *   1. Nash equilibrium stability
 *   2. Rational actor incentive alignment
 *   3. Long-term lock sustainability
 *   4. Participation reward alignment
 *   5. Whale deterrence
 *   6. Federation power equilibrium
 *   7. Centralization drift risk
 *   8. Participation decay risk
 *
 * Protocol context:
 *   VP = (NXS + WTR*w + ENG*w) * NFT_mult
 *   Linear voting, NFT tiers (1.0-1.4x), 12-month retirement, cross-chain
 */

import type { GameTheoryResult } from './types';

// ─── Protocol Constants ──────────────────────────────────────────────────────

const PROTOCOL = {
  // Token economics
  nxsRewardRate: 0.02,
  retirementMonths: 12,
  wtrWeight: 0.3,
  engWeight: 0.2,

  // Governance
  quorum: 0.15,
  approvalThreshold: 0.66,
  timelockHours: 48,
  nftMultiplierRange: { min: 1.0, max: 1.4 },
  minNxsToVote: 100,

  // Network
  estimatedHolders: 2000,
  top10HolderPct: 0.35,
  avgLockDuration: 6,
  lockParticipation: 0.30,
  federationDAOs: 4,
  govParticipationRate: 0.25,

  // Economics
  monthlyRevenue: 50_000,
  treasuryBalance: 300_000,
  coordinationIncentivePct: 0.15,
};

// ─── Dimension Evaluators ────────────────────────────────────────────────────

interface DimensionResult {
  score: number;
  stable: boolean;
  findings: string[];
  risks: string[];
  recommendations: string[];
}

function evaluateNashEquilibrium(): DimensionResult {
  // Nash equilibrium: no player can improve their outcome by unilaterally changing strategy.
  //
  // In NEXUS, the dominant strategy should be: participate honestly, lock tokens,
  // vote on proposals, contribute to impact verification.
  //
  // Evaluate whether deviating from this strategy is profitable:
  //   - Free-riding (not participating but holding NXS for price appreciation)
  //   - Dumping (selling all tokens after receiving coordination incentives)
  //   - Gaming (manipulating impact data for more WTR/ENG minting)

  const freeRidePayoff = 0.3;  // holding NXS without participating: moderate payoff (price only)
  const participatePayoff = 0.7; // participating: higher payoff (incentives + VP + price)
  const gamePayoff = 0.5;       // gaming impact data: moderate if undetected
  const dumpPayoff = 0.2;       // dumping after incentives: short-term gain, loses VP

  // Nash stable if participate > all alternatives
  const isStable = participatePayoff > freeRidePayoff &&
                   participatePayoff > gamePayoff &&
                   participatePayoff > dumpPayoff;

  const score = isStable ? 75 : 45;

  return {
    score,
    stable: isStable,
    findings: [
      `Honest participation payoff (${participatePayoff}) exceeds free-riding (${freeRidePayoff})`,
      `Gaming payoff (${gamePayoff}) is lower than participation when fraud detection is factored in`,
      `Dump strategy (${dumpPayoff}) is dominated due to VP loss and coordination incentive forfeiture`,
      'Protocol creates a cooperative game where participation is the dominant strategy',
    ],
    risks: [
      'If NXS price appreciation dominates coordination incentives, free-riding payoff increases',
      'Gaming payoff increases if fraud detection rate drops below 60%',
      'Short-term dump strategy becomes viable during market euphoria (incentive > VP value)',
    ],
    recommendations: [
      'Ensure coordination incentives scale with participation level (progressive rewards)',
      'Maintain fraud detection above 80% detection rate to suppress gaming payoff',
      'Add vesting/lock requirement for coordination incentive distributions',
    ],
  };
}

function evaluateRationalActorAlignment(): DimensionResult {
  // Do rational (self-interested) actors naturally align with protocol goals?
  //
  // Protocol goals: maximize impact verification, broad governance participation,
  // sustainable treasury management.
  //
  // Rational actor goals: maximize personal return (incentives + token value).
  //
  // Alignment exists when personal return is maximized by actions that also
  // maximize protocol goals.

  const impactVerificationReward = PROTOCOL.nxsRewardRate; // 0.02 NXS per unit retired
  const governanceReward = PROTOCOL.coordinationIncentivePct; // 15% of revenue to participants
  const lockReward = 1.0; // no lock multiplier currently -- this is a gap

  // Alignment score: how well do individual incentives match protocol objectives?
  const impactAlignment = 85; // NXS rewards directly tied to impact verification
  const govAlignment = 60;    // incentives exist but may not outweigh voting cost
  const lockAlignment = 40;   // no explicit lock reward -- rational to keep liquid

  const avgAlignment = Math.round((impactAlignment + govAlignment + lockAlignment) / 3);

  return {
    score: avgAlignment,
    stable: avgAlignment > 60,
    findings: [
      `Impact verification alignment: ${impactAlignment}/100 -- NXS rewards directly incentivize impact work`,
      `Governance alignment: ${govAlignment}/100 -- coordination incentives reward participation, but voting cost is non-trivial`,
      `Lock alignment: ${lockAlignment}/100 -- no explicit lock multiplier creates rational incentive to remain liquid`,
    ],
    risks: [
      'Lock alignment gap: rational actors have no incentive to lock tokens, reducing governance security',
      'Governance cost (time to evaluate proposals, gas for voting) may exceed incentive value for small holders',
      'If NXS market price declines, impact verification reward value drops, reducing alignment',
    ],
    recommendations: [
      'Introduce lock multiplier (1.0-2.0x) on coordination incentives to align lock behavior',
      'Reduce governance friction: gas-free voting, delegation, and AI-assisted proposal summaries',
      'Ensure NXS reward rate adjusts to maintain minimum USD-equivalent value for impact verification',
    ],
  };
}

function evaluateLongTermLockSustainability(): DimensionResult {
  // Will participants continue locking tokens over multiple years?
  //
  // Factors:
  //   - Lock opportunity cost (foregone liquidity)
  //   - Lock benefits (VP multiplier, coordination incentives, NFT multiplier)
  //   - Unlock pressure (market volatility, personal liquidity needs)
  //   - Re-lock incentives (bonus for extending lock duration)

  const currentLockPct = PROTOCOL.lockParticipation * 100;
  const opportunityCost = 0.25; // estimated annual opportunity cost of locking (25%)
  const lockBenefit = 0.15;     // estimated annual benefit from locking

  // If opportunity cost > lock benefit, locks will decay over time
  const sustainabilityGap = lockBenefit - opportunityCost;
  const isNegativeGap = sustainabilityGap < 0;

  const score = isNegativeGap
    ? Math.max(20, 60 + Math.round(sustainabilityGap * 200))
    : Math.min(90, 60 + Math.round(sustainabilityGap * 200));

  return {
    score,
    stable: !isNegativeGap,
    findings: [
      `Current lock participation: ${currentLockPct.toFixed(0)}% of supply`,
      `Estimated lock opportunity cost: ${(opportunityCost * 100).toFixed(0)}% annually`,
      `Estimated lock benefit: ${(lockBenefit * 100).toFixed(0)}% annually`,
      `Sustainability gap: ${(sustainabilityGap * 100).toFixed(0)}% (${isNegativeGap ? 'NEGATIVE -- locks will decay' : 'positive'})`,
    ],
    risks: [
      'Without explicit lock rewards, rational actors will unlock as lock population grows (less VP competition)',
      'Market downturns increase unlock urgency as holders seek liquidity',
      'Whale unlocks create cascade effect: others unlock to avoid being diluted by whale VP when whale re-enters',
    ],
    recommendations: [
      'Implement lock multiplier on coordination incentives: 1.5x for 6-month, 2.0x for 12-month locks',
      'Add re-lock bonus: 10% NXS bonus for extending lock at expiry',
      'Create lock staking tiers: higher lock duration = access to higher-tier governance proposals',
      'Implement gradual unlock (30-day linear) to prevent cliff events',
    ],
  };
}

function evaluateParticipationRewardAlignment(): DimensionResult {
  // Are governance participation rewards sufficient to overcome voting costs?
  //
  // Voting costs: time to evaluate proposals, gas fees, opportunity cost
  // Voting rewards: coordination incentives, VP influence, protocol direction

  const avgProposalsPerMonth = 4;
  const timePerProposal = 0.5; // hours
  const hourlyOpportunityCost = 25; // USD
  const monthlyVotingCost = avgProposalsPerMonth * timePerProposal * hourlyOpportunityCost;

  const avgIncentivePerVoter = (PROTOCOL.monthlyRevenue * PROTOCOL.coordinationIncentivePct) /
    (PROTOCOL.estimatedHolders * PROTOCOL.govParticipationRate);

  const rewardCostRatio = avgIncentivePerVoter / monthlyVotingCost;

  const score = rewardCostRatio >= 1.5 ? 85 :
                rewardCostRatio >= 1.0 ? 70 :
                rewardCostRatio >= 0.5 ? 50 :
                30;

  return {
    score,
    stable: rewardCostRatio >= 1.0,
    findings: [
      `Estimated monthly voting cost per participant: $${monthlyVotingCost.toFixed(0)}`,
      `Average monthly coordination incentive per voter: $${avgIncentivePerVoter.toFixed(0)}`,
      `Reward/cost ratio: ${rewardCostRatio.toFixed(2)}x`,
      rewardCostRatio >= 1.0
        ? 'Participation rewards exceed voting costs -- positive reinforcement loop'
        : 'Voting costs exceed rewards -- participation will decay without adjustment',
    ],
    risks: [
      'As holder count grows, per-voter incentive decreases (dilution)',
      'Proposal complexity may increase time investment over time',
      'Voter fatigue from high proposal frequency reduces effective participation',
    ],
    recommendations: [
      'Implement vote-weight-proportional incentives: larger VP holders receive proportionally more',
      'Add proposal categorization with tiered participation requirements (not all votes mandatory)',
      'Reduce voting friction: gasless voting via XRPL hooks, delegation for routine proposals',
      'Scale coordination incentive pool with revenue growth to prevent per-voter dilution',
    ],
  };
}

function evaluateWhaleDeterrence(): DimensionResult {
  // How effectively does the protocol limit whale influence?
  //
  // Under linear VP, whales have proportional power -- no dampening.
  // Whale deterrence relies on:
  //   - Supermajority threshold (66%) prevents minority rule
  //   - Quorum (15%) prevents whale-only decisions
  //   - NFT multiplier cap (1.4x) limits pure-capital amplification
  //   - DUNA governance framework imposes process constraints

  const topHolderVP = PROTOCOL.top10HolderPct; // top 10 hold 35% of VP
  const supermajority = PROTOCOL.approvalThreshold; // 66%

  // Can top 10 holders pass proposals alone?
  const top10CanPass = topHolderVP >= supermajority;

  // Even at 35%, they need coalition from other holders
  const coalitionNeeded = supermajority - topHolderVP;

  const score = top10CanPass ? 25 :
                topHolderVP > 0.5 ? 40 :
                topHolderVP > 0.3 ? 60 :
                80;

  return {
    score,
    stable: !top10CanPass,
    findings: [
      `Top 10 holders control ~${(topHolderVP * 100).toFixed(0)}% of total VP`,
      `Supermajority threshold: ${(supermajority * 100).toFixed(0)}%`,
      `Coalition needed beyond top 10: ${(coalitionNeeded * 100).toFixed(0)}% additional VP`,
      top10CanPass
        ? 'CRITICAL: Top 10 holders can unilaterally pass proposals'
        : 'Top 10 holders cannot pass proposals alone -- coalition required',
    ],
    risks: [
      'Linear VP provides no dampening on whale influence',
      'Whale coordination (even 2-3 large holders) could achieve supermajority',
      'Whale can accumulate more VP over time as small holders disengage',
      'NFT multiplier amplifies whale VP if they hold Legendary tier NFTs',
    ],
    recommendations: [
      'Implement VP cap per wallet: maximum 5% of total VP for any single address',
      'Add quadratic dampening above a threshold (e.g., linear up to 10K NXS, sqrt above)',
      'Require minimum unique-voter count alongside quorum percentage',
      'Implement whale activity monitoring with automated governance alerts',
      'Consider conviction voting: longer voting duration gives small holders more relative influence',
    ],
  };
}

function evaluateFederationEquilibrium(): DimensionResult {
  // Is power balanced across federation DAOs?
  //
  // With N federation DAOs, equilibrium requires:
  //   - No single DAO can dominate governance
  //   - Power distribution is roughly proportional to membership/impact
  //   - Inter-DAO disputes have clear resolution mechanisms

  const daoCount = PROTOCOL.federationDAOs;
  const idealSharePerDAO = 1 / daoCount;
  const estimatedMaxDAOShare = 0.35; // largest DAO controls ~35%
  const estimatedMinDAOShare = 0.10; // smallest DAO controls ~10%

  // Imbalance ratio: how far from equal distribution
  const imbalanceRatio = estimatedMaxDAOShare / idealSharePerDAO;

  const score = imbalanceRatio <= 1.2 ? 85 :
                imbalanceRatio <= 1.5 ? 70 :
                imbalanceRatio <= 2.0 ? 55 :
                35;

  return {
    score,
    stable: imbalanceRatio <= 1.5,
    findings: [
      `${daoCount} federation DAOs with ideal share of ${(idealSharePerDAO * 100).toFixed(0)}% each`,
      `Estimated largest DAO: ${(estimatedMaxDAOShare * 100).toFixed(0)}% share`,
      `Estimated smallest DAO: ${(estimatedMinDAOShare * 100).toFixed(0)}% share`,
      `Imbalance ratio: ${imbalanceRatio.toFixed(2)}x (${imbalanceRatio <= 1.5 ? 'acceptable' : 'concerning'})`,
    ],
    risks: [
      'Largest federation DAO may grow disproportionately, concentrating power',
      'Smallest DAOs may become inactive or absorbed, reducing federation diversity',
      'Inter-DAO competition for members could destabilize governance coordination',
      'Federation council decisions may be dominated by largest 2 DAOs',
    ],
    recommendations: [
      'Implement federation rebalancing: cap any single DAO at 30% of total VP',
      'Add federation diversity incentive: bonus coordination incentives for smaller DAOs',
      'Create inter-DAO proposal mediation process with neutral arbitration',
      'Require cross-DAO approval for proposals affecting federation structure',
      'Implement federation health dashboard tracking relative power distribution',
    ],
  };
}

function evaluateCentralizationDrift(): DimensionResult {
  // Over time, does the protocol naturally drift toward centralization?
  //
  // Centralization drivers:
  //   - Compound VP growth (reinvesting incentives into more NXS)
  //   - Whale accumulation (buying market supply)
  //   - Participation decay (small holders disengage)
  //   - NFT concentration (rare NFTs held by few)
  //
  // Decentralization forces:
  //   - New member onboarding
  //   - Impact instrument distribution to new participants
  //   - NFT minting to new holders

  // Model: VP Gini coefficient drift over time
  const currentGini = 0.55; // moderate inequality
  const annualDrift = 0.03; // estimated annual Gini increase without intervention
  const projectedGini5yr = Math.min(0.95, currentGini + annualDrift * 5);

  const score = projectedGini5yr <= 0.5 ? 85 :
                projectedGini5yr <= 0.6 ? 70 :
                projectedGini5yr <= 0.7 ? 55 :
                projectedGini5yr <= 0.8 ? 40 :
                25;

  return {
    score,
    stable: annualDrift <= 0.02,
    findings: [
      `Estimated current VP Gini coefficient: ${currentGini.toFixed(2)}`,
      `Estimated annual centralization drift: +${(annualDrift * 100).toFixed(1)}% Gini per year`,
      `Projected 5-year Gini: ${projectedGini5yr.toFixed(2)}`,
      annualDrift > 0.02
        ? 'WARNING: Protocol drifts toward centralization without active countermeasures'
        : 'Centralization drift is within acceptable bounds',
    ],
    risks: [
      'Compound VP growth favors existing large holders',
      'Participation decay among small holders accelerates concentration',
      'NFT tier concentration (few Legendary NFTs) amplifies centralization',
      'Network effects: larger VP holders attract more delegations',
    ],
    recommendations: [
      'Implement annual VP Gini coefficient reporting with automated alerts above 0.65',
      'Add progressive coordination incentive taxation: larger VP holders receive diminishing marginal incentives',
      'Create onboarding incentive program: subsidized NFTs and NXS grants for new participants',
      'Implement VP decay for inactive accounts (no votes in 6 months = 10% VP reduction)',
      'Establish maximum delegation cap: no single delegate can hold >10% of delegated VP',
    ],
  };
}

function evaluateParticipationDecay(): DimensionResult {
  // Does governance participation naturally decline over time?
  //
  // Decay drivers:
  //   - Voter fatigue (too many proposals)
  //   - Low perceived impact (votes don't matter to small holders)
  //   - Opportunity cost rises as members' time becomes more valuable
  //   - Protocol stability reduces urgency to participate

  const currentParticipation = PROTOCOL.govParticipationRate;
  const annualDecayRate = 0.08; // 8% annual participation decline without intervention
  const projected3yr = currentParticipation * Math.pow(1 - annualDecayRate, 3);
  const quorumRisk = projected3yr < PROTOCOL.quorum;

  const score = !quorumRisk && projected3yr > 0.20 ? 75 :
                !quorumRisk && projected3yr > 0.15 ? 60 :
                quorumRisk ? 35 :
                45;

  return {
    score,
    stable: !quorumRisk,
    findings: [
      `Current governance participation: ${(currentParticipation * 100).toFixed(0)}%`,
      `Estimated annual decay rate: ${(annualDecayRate * 100).toFixed(0)}%`,
      `Projected 3-year participation: ${(projected3yr * 100).toFixed(1)}%`,
      `Quorum threshold: ${(PROTOCOL.quorum * 100).toFixed(0)}%`,
      quorumRisk
        ? 'CRITICAL: Participation projected to fall below quorum within 3 years'
        : 'Participation remains above quorum threshold in 3-year projection',
    ],
    risks: [
      'Voter fatigue accelerates decay beyond projected rate',
      'Competitive protocols may attract participant attention away from NEXUS governance',
      'Low participation enables governance capture attacks (see governance-attacks.ts)',
      'Quorum failure could paralyze governance (no proposals pass)',
    ],
    recommendations: [
      'Implement gamified participation: streak bonuses, leaderboards, governance XP',
      'Add liquid delegation with auto-expiry to maintain effective participation',
      'Reduce proposal frequency: consolidate minor proposals into monthly batches',
      'Deploy AI proposal summaries and impact analysis to reduce evaluation time',
      'Create tiered participation: quick polls for minor items, full vote for major items',
      'Implement dynamic quorum: lower quorum for routine proposals, higher for critical ones',
    ],
  };
}

// ─── Composite Analysis ──────────────────────────────────────────────────────

function determineDominantStrategy(dimensions: DimensionResult[]): string {
  // Based on equilibrium analysis, what is the dominant strategy for a rational actor?
  const avgScore = dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length;
  const allStable = dimensions.every(d => d.stable);

  if (allStable && avgScore > 70) {
    return 'Active participation with moderate lock duration (6-12 months) and regular governance voting';
  } else if (avgScore > 55) {
    return 'Selective participation: vote on high-impact proposals, lock for coordination incentives, delegate for routine governance';
  } else {
    return 'Passive holding with minimal governance engagement -- protocol needs stronger participation incentives to shift equilibrium';
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Evaluate 8 game-theoretic dimensions of the NEXUS protocol.
 * Returns per-dimension scores, Nash equilibrium assessment,
 * dominant strategy, and composite equilibrium score.
 */
export function analyzeGameTheory(): GameTheoryResult {
  const nashResult = evaluateNashEquilibrium();
  const rationalResult = evaluateRationalActorAlignment();
  const lockResult = evaluateLongTermLockSustainability();
  const participationResult = evaluateParticipationRewardAlignment();
  const whaleResult = evaluateWhaleDeterrence();
  const federationResult = evaluateFederationEquilibrium();
  const centralizationResult = evaluateCentralizationDrift();
  const decayResult = evaluateParticipationDecay();

  const allDimensions = [
    nashResult, rationalResult, lockResult, participationResult,
    whaleResult, federationResult, centralizationResult, decayResult,
  ];

  // Aggregate findings and recommendations
  const allFindings = allDimensions.flatMap(d => d.findings);
  const allRecommendations = allDimensions.flatMap(d => d.recommendations);

  // Remove duplicate recommendations
  const uniqueRecommendations = [...new Set(allRecommendations)];

  return {
    nashEquilibriumStable: nashResult.stable,
    centralizationDriftRisk: 100 - centralizationResult.score,
    participationDecayRisk: 100 - decayResult.score,
    rationalActorIncentiveAlignment: rationalResult.score,
    longTermLockSustainability: lockResult.score,
    whaleDeterrenceStrength: whaleResult.score,
    federationEquilibrium: federationResult.score,
    findings: allFindings,
    recommendations: uniqueRecommendations,
  };
}
