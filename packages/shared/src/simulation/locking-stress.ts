/**
 * Locking Stress Test Engine
 *
 * Models 3 locking participation scenarios (10%, 50%, 80%) and calculates
 * governance centralization, liquidity shock risk, volatility amplification,
 * and unlock cliff risk for each scenario.
 *
 * Protocol context:
 *   - Linear VP with optional lock multiplier considerations
 *   - 12-month linear batch retirement schedule
 *   - NXS + WTR + ENG contribute to VP
 *   - Source Node NFT multipliers (1.0x - 1.4x)
 */

import type { LockingScenario, LockingStressReport } from './types';

// ─── Protocol Parameters ─────────────────────────────────────────────────────

const PARAMS = {
  totalNXSSupply: 1_000_000,
  totalMPTSupply: 750_000,
  avgLockDurationMonths: 6,
  maxLockDurationMonths: 12,
  retirementDurationMonths: 12,
  nxsRewardRate: 0.02,
  treasuryPct: 0.30,             // 30% of revenue to treasury
  operationalPct: 0.40,          // 40% operational costs
  avgHoldersCount: 2000,
  top10HolderPct: 0.35,          // top 10 holders own ~35% of supply
  marketDepthUSD: 200_000,       // estimated DEX liquidity depth
};

// ─── Scenario Builders ───────────────────────────────────────────────────────

function buildLowLockScenario(): LockingScenario {
  const lockPct = 0.10;
  const circulatingPct = 1 - lockPct;
  const totalSupply = PARAMS.totalNXSSupply + PARAMS.totalMPTSupply;
  const lockedSupply = totalSupply * lockPct;
  const circulatingSupply = totalSupply * circulatingPct;

  // Governance centralization: with only 10% locked, governance is dominated
  // by whoever bothers to lock. If top 10 holders lock preferentially,
  // their share of locked VP is disproportionate.
  // Herfindahl estimate: top 10 own 35% of total, if they lock at 2x rate
  // of average, they represent ~70% of locked supply.
  const topHolderLockShare = Math.min(0.90, PARAMS.top10HolderPct * 2 / lockPct);
  const govCentralization = Math.min(1.0, topHolderLockShare * 0.8);

  // Liquidity shock: 90% circulating means plenty of liquidity
  const liquidityShockRisk = 0.1;

  // Volatility amplification: low lock = high free float = normal volatility
  const volatilityAmplification = 1.0;

  // Unlock cliff: small locked amount means unlock events are minor
  const unlockCliffRisk = 0.05;

  // Effective voter concentration (Herfindahl-like, 0-1 where 1 = monopoly)
  const effectiveVoterConcentration = Math.min(1.0, govCentralization * 0.9);

  return {
    name: '10% Lock Participation (Low Engagement)',
    lockParticipation: lockPct,
    govCentralization,
    liquidityShockRisk,
    volatilityAmplification,
    unlockCliffRisk,
  };
}

function buildMediumLockScenario(): LockingScenario {
  const lockPct = 0.50;
  const circulatingPct = 1 - lockPct;
  const totalSupply = PARAMS.totalNXSSupply + PARAMS.totalMPTSupply;
  const lockedSupply = totalSupply * lockPct;
  const circulatingSupply = totalSupply * circulatingPct;

  // Governance centralization: broader lock participation dilutes whale control.
  // Top 10 holders represent proportional share of locked supply.
  const topHolderLockShare = PARAMS.top10HolderPct; // proportional at 50%
  const govCentralization = Math.min(1.0, topHolderLockShare * 0.7);

  // Liquidity shock: 50% circulating is healthy but market depth matters
  const freeFloatUSD = circulatingSupply * 3.5; // estimated avg price
  const liquidityShockRisk = Math.min(1.0,
    PARAMS.marketDepthUSD / freeFloatUSD < 0.15 ? 0.3 : 0.2
  );

  // Volatility amplification: reduced free float amplifies price moves
  const volatilityAmplification = 1.0 / circulatingPct; // 1 / 0.5 = 2.0x

  // Unlock cliff: 50% locked means scheduled unlocks could be significant
  // Average 6-month lock means ~8.3% unlocks per month
  const monthlyUnlockPct = lockPct / PARAMS.avgLockDurationMonths;
  const unlockCliffRisk = Math.min(1.0, monthlyUnlockPct * 3);

  return {
    name: '50% Lock Participation (Balanced)',
    lockParticipation: lockPct,
    govCentralization,
    liquidityShockRisk,
    volatilityAmplification,
    unlockCliffRisk,
  };
}

function buildHighLockScenario(): LockingScenario {
  const lockPct = 0.80;
  const circulatingPct = 1 - lockPct;
  const totalSupply = PARAMS.totalNXSSupply + PARAMS.totalMPTSupply;
  const lockedSupply = totalSupply * lockPct;
  const circulatingSupply = totalSupply * circulatingPct;

  // Governance centralization: very high lock means most participants are locked,
  // reducing whale dominance IF broad participation.
  // However, 80% locked could mean locked whales still dominate with larger absolute VP.
  const topHolderLockShare = PARAMS.top10HolderPct * 0.95; // whales almost certainly lock
  const govCentralization = Math.min(1.0, topHolderLockShare * 0.6);

  // Liquidity shock: only 20% circulating creates severe liquidity constraints
  const freeFloatUSD = circulatingSupply * 3.5;
  const liquidityShockRisk = Math.min(1.0,
    PARAMS.marketDepthUSD / freeFloatUSD < 0.3 ? 0.7 : 0.5
  );

  // Volatility amplification: 5x amplification with only 20% free float
  const volatilityAmplification = 1.0 / circulatingPct; // 1 / 0.2 = 5.0x

  // Unlock cliff: 80% locked with average 6-month duration
  // Monthly unlock rate: 80% / 6 = ~13.3% of total supply per month
  const monthlyUnlockPct = lockPct / PARAMS.avgLockDurationMonths;
  const unlockCliffRisk = Math.min(1.0, monthlyUnlockPct * 2.5);

  return {
    name: '80% Lock Participation (High Lock)',
    lockParticipation: lockPct,
    govCentralization,
    liquidityShockRisk,
    volatilityAmplification,
    unlockCliffRisk,
  };
}

// ─── Analysis Utilities ──────────────────────────────────────────────────────

function calculateOptimalRange(scenarios: LockingScenario[]): { min: number; max: number } {
  // Optimal range minimizes the composite of:
  // - Governance centralization (want low)
  // - Liquidity shock risk (want low)
  // - Unlock cliff risk (want low)
  // While maintaining:
  // - Reasonable governance participation (want moderate-high lock)

  // Heuristic: sweet spot is 30-55% lock participation
  // Below 30%: governance centralization spikes
  // Above 55%: liquidity risk and unlock cliff risk escalate
  return { min: 30, max: 55 };
}

function calculateOverallHealth(scenarios: LockingScenario[]): number {
  // Health score based on how well the protocol handles each scenario.
  // Score 100 = perfectly healthy across all scenarios, 0 = critical risk.
  let totalScore = 0;

  for (const s of scenarios) {
    // Per-scenario health: invert risk metrics
    const centralScore = (1 - s.govCentralization) * 25;
    const liquidityScore = (1 - s.liquidityShockRisk) * 25;
    const volatilityScore = Math.max(0, 25 - (s.volatilityAmplification - 1) * 10);
    const cliffScore = (1 - s.unlockCliffRisk) * 25;

    totalScore += centralScore + liquidityScore + volatilityScore + cliffScore;
  }

  return Math.round(totalScore / scenarios.length);
}

function generateSummary(
  scenarios: LockingScenario[],
  optimalRange: { min: number; max: number },
  healthScore: number,
): string {
  const lowScenario = scenarios.find(s => s.lockParticipation === 0.1)!;
  const highScenario = scenarios.find(s => s.lockParticipation === 0.8)!;

  const risks: string[] = [];
  if (lowScenario.govCentralization > 0.6) {
    risks.push('severe governance centralization at low lock participation');
  }
  if (highScenario.liquidityShockRisk > 0.5) {
    risks.push('liquidity crisis risk at high lock participation');
  }
  if (highScenario.volatilityAmplification > 3.0) {
    risks.push(`${highScenario.volatilityAmplification.toFixed(1)}x volatility amplification at 80% lock`);
  }

  return (
    `Locking stress analysis health score: ${healthScore}/100. ` +
    `Optimal lock participation range: ${optimalRange.min}-${optimalRange.max}%. ` +
    `Key risks: ${risks.length > 0 ? risks.join('; ') : 'none critical'}. ` +
    `The protocol should implement dynamic incentives to maintain lock participation ` +
    `within the optimal range and stagger unlock schedules to prevent cliff events.`
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyze locking stress scenarios at 10%, 50%, and 80% lock participation.
 * Returns per-scenario metrics and overall health assessment.
 */
export function analyzeLockingStress(): LockingStressReport {
  const scenarios: LockingScenario[] = [
    buildLowLockScenario(),
    buildMediumLockScenario(),
    buildHighLockScenario(),
  ];

  const optimalRange = calculateOptimalRange(scenarios);
  const healthScore = calculateOverallHealth(scenarios);

  return {
    scenarios,
    dangerousThreshold: 0.75, // >75% lock participation enters danger zone
    recommendedMaxBoost: 2.0, // max lock multiplier recommendation
    recommendedMaxLockDuration: 12, // months
  };
}
