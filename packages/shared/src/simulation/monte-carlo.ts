/**
 * Monte Carlo Simulation Engine
 *
 * Runs N iterations of the tokenomics model with stochastic volatility
 * to generate percentile-based projections over 1-10 year horizons.
 */

import type {
  SimulationConfig,
  TokenomicsInputs,
  TokenomicsSnapshot,
  MonteCarloResult,
} from './types';
import { DEFAULT_SIM_CONFIG, DEFAULT_TOKENOMICS } from './types';

// ─── Deterministic PRNG (xoshiro128**) ──────────────────

function createSimRng(seed: number) {
  let s0 = seed | 0;
  let s1 = (seed << 13) ^ seed;
  let s2 = (seed >> 7) ^ (seed << 3);
  let s3 = (seed << 5) ^ (seed >> 11);

  function next(): number {
    const result = (s1 * 5) | 0;
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = (s3 << 11) | (s3 >>> 21);
    return ((result << 7) | (result >>> 25)) / 4294967296 + 0.5;
  }

  /** Box-Muller transform for normal distribution */
  function gaussian(mean = 0, stdDev = 1): number {
    const u1 = next();
    const u2 = next();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  return { next, gaussian };
}

// ─── Single Run Simulation ──────────────────────────────

function runSingleSimulation(
  inputs: TokenomicsInputs,
  config: SimulationConfig,
  rng: ReturnType<typeof createSimRng>,
): TokenomicsSnapshot[] {
  const totalSteps = config.horizonYears * config.stepsPerYear;
  const snapshots: TokenomicsSnapshot[] = [];

  let wtrCirculating = inputs.initialWtrSupply;
  let engCirculating = inputs.initialEngSupply;
  let nxsCirculating = inputs.initialNxsSupply;
  let wtrRetiredTotal = 0;
  let engRetiredTotal = 0;
  let members = inputs.initialMembers;
  let monthlyRevenue = inputs.initialMonthlyRevenue;
  let treasuryBalance = monthlyRevenue * 6; // Start with 6 months runway

  for (let step = 0; step < totalSteps; step++) {
    const month = step % 12;
    const year = Math.floor(step / 12) + 1;

    // Stochastic shock on growth rates
    const growthShock = rng.gaussian(1, inputs.volatility);
    const revenueShock = rng.gaussian(1, inputs.volatility * 0.8);

    // Member growth with noise
    const memberGrowth = Math.max(0, inputs.memberGrowthRate * growthShock);
    members = Math.round(members * (1 + memberGrowth));

    // Token issuance (with decreasing rate over time — halving every 3 years)
    const halvingFactor = Math.pow(0.5, step / (36));
    const wtrMinted = inputs.wtrIssuanceRate * halvingFactor * Math.max(0.5, growthShock);
    const engMinted = inputs.engIssuanceRate * halvingFactor * Math.max(0.5, growthShock);

    wtrCirculating += wtrMinted;
    engCirculating += engMinted;

    // Retirement (burns)
    const wtrRetired = wtrCirculating * inputs.retirementRate * Math.max(0, growthShock);
    const engRetired = engCirculating * inputs.retirementRate * Math.max(0, growthShock);
    wtrCirculating -= wtrRetired;
    engCirculating -= engRetired;
    wtrRetiredTotal += wtrRetired;
    engRetiredTotal += engRetired;

    // NXS from retirements
    nxsCirculating += (wtrRetired + engRetired) * inputs.nxsRewardRate;

    // Locking
    const wtrLocked = wtrCirculating * inputs.lockParticipation;
    const engLocked = engCirculating * inputs.lockParticipation;
    const nxsLocked = nxsCirculating * inputs.lockParticipation * 0.5;

    // Revenue & Treasury
    monthlyRevenue *= (1 + inputs.revenueGrowthRate * revenueShock);
    const treasuryInflow = monthlyRevenue * 0.3; // 30% to treasury
    const treasuryYield = treasuryBalance * (inputs.treasuryYieldRate / 12);
    const operationalCosts = monthlyRevenue * 0.4;
    treasuryBalance += treasuryInflow + treasuryYield - operationalCosts * 0.1;
    treasuryBalance = Math.max(0, treasuryBalance);

    // Dividend
    const dividendPool = monthlyRevenue * 0.15; // 15% to dividend
    const dividendPerMember = members > 0 ? dividendPool / members : 0;

    // Governance participation (decreases as member count grows, stabilizes)
    const baseParticipation = 0.35;
    const participationDecay = Math.max(0.15, baseParticipation - Math.log10(members) * 0.05);
    const govParticipation = participationDecay * Math.max(0.7, growthShock);

    // Lock ratio
    const totalSupply = wtrCirculating + engCirculating;
    const totalLocked = wtrLocked + engLocked;
    const lockRatio = totalSupply > 0 ? totalLocked / totalSupply : 0;

    // Inflation rate (annualized)
    const newSupplyMonth = wtrMinted + engMinted;
    const retiredMonth = wtrRetired + engRetired;
    const netNewSupply = newSupplyMonth - retiredMonth;
    const inflationRate = totalSupply > 0 ? (netNewSupply * 12) / totalSupply : 0;

    snapshots.push({
      month: step + 1,
      year,
      wtrCirculating: Math.round(wtrCirculating),
      engCirculating: Math.round(engCirculating),
      nxsCirculating: Math.round(nxsCirculating),
      wtrLocked: Math.round(wtrLocked),
      engLocked: Math.round(engLocked),
      nxsLocked: Math.round(nxsLocked),
      wtrRetiredTotal: Math.round(wtrRetiredTotal),
      engRetiredTotal: Math.round(engRetiredTotal),
      activeMembers: members,
      govParticipationRate: Math.round(govParticipation * 1000) / 1000,
      treasuryBalance: Math.round(treasuryBalance),
      monthlyRevenue: Math.round(monthlyRevenue),
      dividendPerMember: Math.round(dividendPerMember * 100) / 100,
      lockRatio: Math.round(lockRatio * 1000) / 1000,
      inflationRate: Math.round(inflationRate * 10000) / 10000,
    });
  }

  return snapshots;
}

// ─── Monte Carlo Runner ─────────────────────────────────

/**
 * Run Monte Carlo simulation with N iterations.
 * Returns percentile-based projections and summary scores.
 */
export function runMonteCarloSimulation(
  inputs: TokenomicsInputs = DEFAULT_TOKENOMICS,
  config: SimulationConfig = DEFAULT_SIM_CONFIG,
): MonteCarloResult {
  const allRuns: TokenomicsSnapshot[][] = [];

  for (let i = 0; i < config.iterations; i++) {
    const rng = createSimRng(config.seed + i);
    allRuns.push(runSingleSimulation(inputs, config, rng));
  }

  const totalSteps = config.horizonYears * config.stepsPerYear;
  const percentileIndices = {
    p5: Math.floor(config.iterations * 0.05),
    p25: Math.floor(config.iterations * 0.25),
    p50: Math.floor(config.iterations * 0.5),
    p75: Math.floor(config.iterations * 0.75),
    p95: Math.floor(config.iterations * 0.95),
  };

  const percentiles: MonteCarloResult['percentiles'] = {
    p5: [], p25: [], p50: [], p75: [], p95: [],
  };

  // For each time step, sort runs by key metric and pick percentiles
  for (let step = 0; step < totalSteps; step++) {
    const stepSnapshots = allRuns.map(run => run[step]).filter(Boolean);

    // Sort by total circulating supply for supply percentiles
    stepSnapshots.sort((a, b) =>
      (a.wtrCirculating + a.engCirculating) - (b.wtrCirculating + b.engCirculating)
    );

    for (const [key, idx] of Object.entries(percentileIndices)) {
      const safeIdx = Math.min(idx, stepSnapshots.length - 1);
      (percentiles as any)[key].push(stepSnapshots[safeIdx]);
    }
  }

  // Calculate summary scores from median run
  const medianFinal = percentiles.p50[percentiles.p50.length - 1];
  const medianMid = percentiles.p50[Math.floor(percentiles.p50.length / 2)];

  // Stability index: low volatility between p25 and p75 at end
  const p25Final = percentiles.p25[percentiles.p25.length - 1];
  const p75Final = percentiles.p75[percentiles.p75.length - 1];
  const supplySpread = p75Final.wtrCirculating + p75Final.engCirculating
    - p25Final.wtrCirculating - p25Final.engCirculating;
  const medianSupply = medianFinal.wtrCirculating + medianFinal.engCirculating;
  const stabilityIndex = Math.max(0, Math.min(100,
    100 - (supplySpread / (medianSupply + 1)) * 100
  ));

  // Inflation risk: based on median inflation rate at end
  const inflationRiskScore = Math.max(0, Math.min(100,
    medianFinal.inflationRate > 0.1 ? 20 :
    medianFinal.inflationRate > 0.05 ? 40 :
    medianFinal.inflationRate > 0.02 ? 60 :
    medianFinal.inflationRate > 0 ? 80 : 95
  ));

  // Governance concentration: based on participation rate
  const govConcentrationRisk = Math.max(0, Math.min(100,
    medianFinal.govParticipationRate < 0.1 ? 25 :
    medianFinal.govParticipationRate < 0.2 ? 50 :
    medianFinal.govParticipationRate < 0.3 ? 70 : 85
  ));

  // Dividend sustainability: based on treasury runway
  const monthlyDividendCost = medianFinal.dividendPerMember * medianFinal.activeMembers;
  const dividendSustainability = medianFinal.treasuryBalance > 0 && monthlyDividendCost > 0
    ? Math.min(100, (medianFinal.treasuryBalance / (monthlyDividendCost * 24)) * 100)
    : 50;

  // Treasury runway in months
  const monthlyBurn = medianFinal.monthlyRevenue * 0.4;
  const treasuryRunway = monthlyBurn > 0
    ? medianFinal.treasuryBalance / monthlyBurn
    : 120;

  return {
    percentiles,
    stabilityIndex: Math.round(stabilityIndex),
    inflationRiskScore: Math.round(inflationRiskScore),
    govConcentrationRisk: Math.round(govConcentrationRisk),
    dividendSustainability: Math.round(dividendSustainability),
    treasuryRunway: Math.round(treasuryRunway),
  };
}
