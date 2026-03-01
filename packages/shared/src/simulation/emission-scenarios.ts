/**
 * Emission Collapse Scenario Engine
 *
 * Models 4 emission collapse scenarios and calculates dividend sustainability,
 * treasury depletion timelines, and governance instability risk under stress.
 *
 * Protocol context:
 *   - NXS reward rate: 0.02 per unit retired
 *   - 12-month linear batch retirement
 *   - Treasury: proposal-gated with timelock
 *   - Revenue-backed emission model (not pure inflation)
 */

import type { EmissionScenario, EmissionReport } from './types';

// ─── Baseline Economics ──────────────────────────────────────────────────────

const BASELINE = {
  monthlyRevenueUSD: 50_000,
  treasuryBalanceUSD: 300_000,
  treasuryYieldAnnual: 0.04,          // 4% annual yield
  monthlyEmissionsNXS: 10_000,
  nxsRewardRate: 0.02,
  retirementRateMonthly: 0.02,        // 2% of active MPT retired per month
  dividendPoolPct: 0.15,              // 15% of revenue to dividends
  operationalCostPct: 0.40,           // 40% of revenue to operations
  treasuryInflowPct: 0.30,            // 30% of revenue to treasury
  activeMembers: 500,
  totalMPTSupply: 750_000,
  lockParticipation: 0.30,
  govParticipationRate: 0.25,         // 25% typical governance participation
};

// ─── Scenario Builders ───────────────────────────────────────────────────────

function buildRevenueDecline(): EmissionScenario {
  const declinePct = 0.40; // 40% revenue decline
  const stressedRevenue = BASELINE.monthlyRevenueUSD * (1 - declinePct);

  // Dividend sustainability: monthly dividend pool shrinks
  const baselineDividendPool = BASELINE.monthlyRevenueUSD * BASELINE.dividendPoolPct;
  const stressedDividendPool = stressedRevenue * BASELINE.dividendPoolPct;
  const treasuryYieldMonthly = BASELINE.treasuryBalanceUSD * (BASELINE.treasuryYieldAnnual / 12);

  // How many months can treasury supplement the dividend shortfall?
  const monthlyShortfall = baselineDividendPool - stressedDividendPool;
  const dividendSustainableMonths = monthlyShortfall > 0
    ? Math.round(BASELINE.treasuryBalanceUSD / monthlyShortfall)
    : 120; // indefinite

  // Treasury depletion: reduced inflow + continued operations
  const stressedInflow = stressedRevenue * BASELINE.treasuryInflowPct;
  const operationalDrain = stressedRevenue * BASELINE.operationalCostPct * 0.8; // some cost reduction
  const netMonthlyTreasuryChange = stressedInflow + treasuryYieldMonthly - operationalDrain * 0.3;
  const treasuryDepletionMonths = netMonthlyTreasuryChange < 0
    ? Math.round(BASELINE.treasuryBalanceUSD / Math.abs(netMonthlyTreasuryChange))
    : 120;

  // Governance instability: revenue decline causes member disengagement
  // and potential sell pressure on NXS
  const govInstability = Math.min(10, Math.round(declinePct * 15));

  return {
    name: 'Revenue Decline (40%)',
    description:
      `Monthly revenue drops ${(declinePct * 100).toFixed(0)}% from ` +
      `$${BASELINE.monthlyRevenueUSD.toLocaleString()} to $${stressedRevenue.toLocaleString()}. ` +
      `Dividend pool shrinks proportionally. Treasury must bridge the gap or dividends ` +
      `are reduced, causing potential governance disengagement and NXS sell pressure.`,
    revenueDecline: declinePct,
    treasuryYieldCollapse: 0,
    marketCrash: 0,
    suddenUnlock: 0,
    dividendSustainableMonths,
    treasuryDepletionMonths,
    govInstability,
    recommendations: [
      'Implement dynamic dividend throttling: auto-reduce dividends when revenue drops >20%',
      'Build 12-month operational runway in treasury before enabling dividends',
      'Create revenue diversification strategy (multiple yield sources)',
      'Add governance proposal requirement for dividend rate changes',
      'Implement counter-cyclical NXS buyback during revenue dips to support price',
    ],
  };
}

function buildTreasuryYieldCollapse(): EmissionScenario {
  // Treasury yield drops to near zero (e.g., DeFi yield compression, market downturn)
  const yieldCollapsePct = 0.90; // 90% yield reduction
  const stressedYieldAnnual = BASELINE.treasuryYieldAnnual * (1 - yieldCollapsePct);
  const baseYieldMonthly = BASELINE.treasuryBalanceUSD * (BASELINE.treasuryYieldAnnual / 12);
  const stressedYieldMonthly = BASELINE.treasuryBalanceUSD * (stressedYieldAnnual / 12);
  const yieldLossMonthly = baseYieldMonthly - stressedYieldMonthly;

  // If treasury yield was supplementing dividends, loss affects sustainability
  const dividendSustainableMonths = yieldLossMonthly > 0
    ? Math.round(BASELINE.treasuryBalanceUSD / (yieldLossMonthly * 3))
    : 120;

  // Treasury depletion: treasury still receives revenue inflows but earns less
  const normalInflow = BASELINE.monthlyRevenueUSD * BASELINE.treasuryInflowPct;
  const operationalCost = BASELINE.monthlyRevenueUSD * BASELINE.operationalCostPct * 0.1;
  const netChange = normalInflow + stressedYieldMonthly - operationalCost;
  const treasuryDepletionMonths = netChange < 0
    ? Math.round(BASELINE.treasuryBalanceUSD / Math.abs(netChange))
    : 120;

  const govInstability = 3; // moderate -- yield is secondary revenue

  return {
    name: 'Treasury Yield Collapse',
    description:
      `Treasury yield drops ${(yieldCollapsePct * 100).toFixed(0)}% from ` +
      `${(BASELINE.treasuryYieldAnnual * 100).toFixed(1)}% to ` +
      `${(stressedYieldAnnual * 100).toFixed(2)}% APY. Monthly yield income falls from ` +
      `$${baseYieldMonthly.toFixed(0)} to $${stressedYieldMonthly.toFixed(0)}. ` +
      `Impact is moderate since treasury yield is supplementary, not primary revenue.`,
    revenueDecline: 0,
    treasuryYieldCollapse: yieldCollapsePct,
    marketCrash: 0,
    suddenUnlock: 0,
    dividendSustainableMonths,
    treasuryDepletionMonths,
    govInstability,
    recommendations: [
      'Diversify treasury yield sources across DeFi, TradFi, and stablecoin strategies',
      'Cap treasury yield dependency at 20% of total dividend funding',
      'Implement yield floor: if yield drops below threshold, reallocate to stablecoin reserves',
      'Add risk-adjusted yield reporting in governance dashboards',
    ],
  };
}

function buildMarketCrash(): EmissionScenario {
  const crashPct = 0.60; // 60% market crash
  const nxsPriceMultiplier = 1 - crashPct;

  // Market crash reduces:
  // 1. NXS price (sell pressure from panic)
  // 2. Treasury value if held in volatile assets
  // 3. Member confidence and participation
  const stressedTreasury = BASELINE.treasuryBalanceUSD * (1 - crashPct * 0.5); // 50% correlated
  const stressedRevenue = BASELINE.monthlyRevenueUSD * (1 - crashPct * 0.3); // 30% revenue impact

  const stressedDividendPool = stressedRevenue * BASELINE.dividendPoolPct;
  const baselineDividendPool = BASELINE.monthlyRevenueUSD * BASELINE.dividendPoolPct;
  const shortfall = baselineDividendPool - stressedDividendPool;

  const dividendSustainableMonths = shortfall > 0
    ? Math.round(stressedTreasury / shortfall)
    : 120;

  // Treasury depletion accelerates in crash
  const stressedInflow = stressedRevenue * BASELINE.treasuryInflowPct;
  const stressedYield = stressedTreasury * (BASELINE.treasuryYieldAnnual * 0.3 / 12); // yield also compresses
  const operationalCost = stressedRevenue * BASELINE.operationalCostPct * 0.7;
  const netChange = stressedInflow + stressedYield - operationalCost * 0.3;
  const treasuryDepletionMonths = netChange < 0
    ? Math.round(stressedTreasury / Math.abs(netChange))
    : 120;

  // Governance instability: high -- panic selling, participation drop, rage-quit proposals
  const govInstability = 8;

  return {
    name: 'Market Crash (60%)',
    description:
      `Broad market crashes ${(crashPct * 100).toFixed(0)}%, NXS price drops proportionally. ` +
      `Treasury value declines ~${(crashPct * 50).toFixed(0)}% from correlated asset exposure. ` +
      `Revenue drops ~${(crashPct * 30).toFixed(0)}%. Governance faces panic-driven proposals ` +
      `and potential mass unlock requests.`,
    revenueDecline: crashPct * 0.3,
    treasuryYieldCollapse: crashPct * 0.7,
    marketCrash: crashPct,
    suddenUnlock: 0,
    dividendSustainableMonths,
    treasuryDepletionMonths,
    govInstability,
    recommendations: [
      'Maintain 60%+ treasury in stablecoins/low-volatility assets',
      'Implement automatic governance cooldown during extreme volatility (>30% drop in 7 days)',
      'Add emergency dividend suspension mechanism with automatic reinstatement trigger',
      'Create counter-cyclical reserve fund (10% of treasury) for crash scenarios',
      'Implement NXS buyback program triggered by price drops exceeding 40%',
      'Add rage-quit delay: 7-day cooling period for unlock requests during market stress',
    ],
  };
}

function buildSuddenUnlock(): EmissionScenario {
  // Large coordinated unlock event (e.g., major lock period expires for early investors)
  const unlockPct = 0.25; // 25% of locked supply unlocks simultaneously
  const lockedSupply = (BASELINE.totalMPTSupply + 1_000_000) * BASELINE.lockParticipation;
  const unlockAmount = lockedSupply * unlockPct;

  // Sudden unlock creates:
  // 1. Massive sell pressure if unlocked tokens are sold
  // 2. VP redistribution (locked VP > unlocked VP if lock multiplier exists)
  // 3. Liquidity crisis if DEX depth is insufficient

  const estimatedSellPct = 0.4; // 40% of unlocked tokens are sold
  const sellAmountUSD = unlockAmount * estimatedSellPct * 3.5; // avg token price $3.50
  const priceImpactPct = Math.min(0.5, sellAmountUSD / BASELINE.treasuryBalanceUSD);

  // Revenue impact from price decline and reduced participation
  const stressedRevenue = BASELINE.monthlyRevenueUSD * (1 - priceImpactPct * 0.2);

  const dividendSustainableMonths = 36; // dividend mostly unaffected if revenue holds
  const treasuryDepletionMonths = 48;   // treasury is resilient to unlock events

  // Governance instability: moderate -- VP reshuffling but no structural damage
  const govInstability = 5;

  return {
    name: 'Sudden Unlock Event (25%)',
    description:
      `${(unlockPct * 100).toFixed(0)}% of locked supply (${unlockAmount.toLocaleString()} tokens) ` +
      `unlocks simultaneously. Estimated ${(estimatedSellPct * 100).toFixed(0)}% sell-through ` +
      `creates $${sellAmountUSD.toLocaleString()} sell pressure. Price impact estimated at ` +
      `${(priceImpactPct * 100).toFixed(0)}%. Governance VP redistribution follows.`,
    revenueDecline: priceImpactPct * 0.2,
    treasuryYieldCollapse: 0,
    marketCrash: 0,
    suddenUnlock: unlockPct,
    dividendSustainableMonths,
    treasuryDepletionMonths,
    govInstability,
    recommendations: [
      'Implement staggered unlock schedules: no more than 5% of locked supply unlocks per month',
      'Add unlock notification system: 30-day advance warning for large unlock events',
      'Create re-lock incentive: bonus NXS rewards for extending lock duration at expiry',
      'Implement DEX liquidity reserves to absorb unlock sell pressure',
      'Add progressive unlock: large positions unlock over 30-90 days, not instantly',
      'Deploy unlock impact dashboard showing projected market impact',
    ],
  };
}

// ─── Emergency Rules & Throttling ────────────────────────────────────────────

function generateEmergencyRules(): string[] {
  return [
    'Auto-suspend dividends if treasury drops below 6-month operational runway',
    'Implement governance cooldown (72h pause) if NXS price drops >40% in 7 days',
    'Auto-reduce emission rate by 50% if retirement rate drops below 1% monthly',
    'Emergency multisig override for treasury protection (3-of-5 with 24h delay)',
    'Automatic DEX liquidity injection from treasury reserves if slippage exceeds 10%',
  ];
}

function generateThrottlingRules(): string[] {
  return [
    'Dynamic emission throttle: reduce NXS minting proportional to revenue decline',
    'Dividend smoothing: use 3-month rolling average, not spot revenue',
    'Treasury yield allocation: shift to stablecoins when yield drops below 2% APY',
    'Lock incentive scaling: increase lock rewards during high-unlock periods',
    'Governance participation incentive: boost NXS rewards for voting during stress',
  ];
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyze 4 emission collapse scenarios against the NEXUS economic model.
 * Returns per-scenario sustainability metrics, emergency rules, and throttling strategies.
 */
export function analyzeEmissionScenarios(): EmissionReport {
  const scenarios: EmissionScenario[] = [
    buildRevenueDecline(),
    buildTreasuryYieldCollapse(),
    buildMarketCrash(),
    buildSuddenUnlock(),
  ];

  return {
    scenarios,
    emergencyRules: generateEmergencyRules(),
    dynamicThrottling: generateThrottlingRules(),
  };
}
