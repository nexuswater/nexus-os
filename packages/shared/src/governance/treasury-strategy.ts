/**
 * Treasury Yield Strategy Framework
 * All allocations require proposal + vote.
 * Treasury decisions are governance acts, not investment strategies.
 */

export type RiskLevel = 'conservative' | 'moderate' | 'growth';
export type YieldSource = 'xrpl_amm_lp' | 'staking' | 'stable_reserves' | 'external_yield';

export interface TreasuryStrategy {
  strategyId: string;
  name: string;
  description: string;
  allocationPercent: number;
  yieldSource: YieldSource;
  riskLevel: RiskLevel;
  expectedYieldApr: number;
  active: boolean;
  approvedByProposalId?: string;
  createdAt: string;
}

export interface TreasuryStrategyConfig {
  strategies: TreasuryStrategy[];
  maxGrowthAllocation: number; // max % in growth risk
  maxSingleStrategyAllocation: number; // max % per strategy
  rebalanceEpochInterval: number;
  emergencyWithdrawEnabled: boolean;
}

export const DEFAULT_TREASURY_STRATEGIES: TreasuryStrategy[] = [
  {
    strategyId: 'ts-stable-01',
    name: 'Stable Reserves',
    description: 'RLUSD/USDC held in verified custodial wallets',
    allocationPercent: 50,
    yieldSource: 'stable_reserves',
    riskLevel: 'conservative',
    expectedYieldApr: 0.02,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    strategyId: 'ts-amm-01',
    name: 'XRPL AMM LP',
    description: 'Liquidity provision in XRPL native AMM pools',
    allocationPercent: 25,
    yieldSource: 'xrpl_amm_lp',
    riskLevel: 'moderate',
    expectedYieldApr: 0.06,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    strategyId: 'ts-staking-01',
    name: 'Governance Staking',
    description: 'NXS staking for protocol security',
    allocationPercent: 15,
    yieldSource: 'staking',
    riskLevel: 'conservative',
    expectedYieldApr: 0.04,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    strategyId: 'ts-external-01',
    name: 'External Yield (Stub)',
    description: 'Future integration with verified external yield sources',
    allocationPercent: 10,
    yieldSource: 'external_yield',
    riskLevel: 'growth',
    expectedYieldApr: 0.08,
    active: false,
    createdAt: new Date().toISOString(),
  },
];

/** Validate strategy allocation doesn't exceed limits */
export function validateStrategyAllocation(
  strategies: TreasuryStrategy[],
  config: Partial<TreasuryStrategyConfig> = {},
): { valid: boolean; errors: string[] } {
  const maxGrowth = config.maxGrowthAllocation ?? 20;
  const maxSingle = config.maxSingleStrategyAllocation ?? 50;
  const errors: string[] = [];

  const totalAlloc = strategies.filter(s => s.active).reduce((s, st) => s + st.allocationPercent, 0);
  if (totalAlloc > 100) errors.push(`Total allocation ${totalAlloc}% exceeds 100%`);

  const growthAlloc = strategies
    .filter(s => s.active && s.riskLevel === 'growth')
    .reduce((s, st) => s + st.allocationPercent, 0);
  if (growthAlloc > maxGrowth) errors.push(`Growth allocation ${growthAlloc}% exceeds max ${maxGrowth}%`);

  for (const s of strategies.filter(st => st.active)) {
    if (s.allocationPercent > maxSingle) {
      errors.push(`Strategy "${s.name}" at ${s.allocationPercent}% exceeds max ${maxSingle}%`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Calculate projected annual yield from treasury strategies */
export function projectedTreasuryYield(
  totalBalance: number,
  strategies: TreasuryStrategy[] = DEFAULT_TREASURY_STRATEGIES,
): { totalYield: number; breakdown: Array<{ name: string; yield: number }> } {
  const activeStrategies = strategies.filter(s => s.active);
  const breakdown = activeStrategies.map(s => ({
    name: s.name,
    yield: totalBalance * (s.allocationPercent / 100) * s.expectedYieldApr,
  }));
  return {
    totalYield: breakdown.reduce((s, b) => s + b.yield, 0),
    breakdown,
  };
}
