/**
 * Token Emission Engine — Configurable supply schedule
 * Supports fixed, halving, and governance-adjustable emission models.
 */

export type EmissionModel = 'FIXED' | 'HALVING' | 'GOVERNANCE_ADJUSTABLE';

export interface EmissionConfig {
  model: EmissionModel;
  /** Base emission rate (tokens per epoch) */
  baseRate: number;
  /** Halving interval in epochs (for HALVING model) */
  halvingEpochInterval: number;
  /** Hard cap on total supply (0 = no cap) */
  supplyCap: number;
  /** Current epoch */
  currentEpoch: number;
  /** Governance-adjusted rate multiplier (for GOVERNANCE_ADJUSTABLE) */
  governanceMultiplier: number;
  /** Distribution rules: fraction to each pool */
  distribution: EmissionDistribution;
}

export interface EmissionDistribution {
  /** Fraction to active minters/validators */
  minterRewards: number;
  /** Fraction to treasury */
  treasury: number;
  /** Fraction to staking/lock rewards */
  lockRewards: number;
  /** Fraction to ecosystem fund */
  ecosystemFund: number;
}

export const DEFAULT_EMISSION_CONFIG: EmissionConfig = {
  model: 'HALVING',
  baseRate: 50000,
  halvingEpochInterval: 12, // every 12 epochs (1 year if monthly)
  supplyCap: 100_000_000,
  currentEpoch: 0,
  governanceMultiplier: 1.0,
  distribution: {
    minterRewards: 0.40,
    treasury: 0.25,
    lockRewards: 0.20,
    ecosystemFund: 0.15,
  },
};

/** Calculate emission for a given epoch */
export function epochEmission(epoch: number, config: EmissionConfig = DEFAULT_EMISSION_CONFIG): number {
  switch (config.model) {
    case 'FIXED':
      return config.baseRate;
    case 'HALVING': {
      const halvings = Math.floor(epoch / config.halvingEpochInterval);
      return config.baseRate * Math.pow(0.5, halvings);
    }
    case 'GOVERNANCE_ADJUSTABLE':
      return config.baseRate * config.governanceMultiplier;
    default:
      return config.baseRate;
  }
}

/** Calculate total emitted tokens up to a given epoch */
export function totalEmitted(upToEpoch: number, config: EmissionConfig = DEFAULT_EMISSION_CONFIG): number {
  let total = 0;
  for (let e = 0; e < upToEpoch; e++) {
    total += epochEmission(e, config);
    if (config.supplyCap > 0 && total >= config.supplyCap) return config.supplyCap;
  }
  return Math.min(total, config.supplyCap > 0 ? config.supplyCap : Infinity);
}

/** Distribute epoch emission across pools */
export function distributeEmission(
  emission: number,
  dist: EmissionDistribution = DEFAULT_EMISSION_CONFIG.distribution,
): Record<keyof EmissionDistribution, number> {
  return {
    minterRewards: emission * dist.minterRewards,
    treasury: emission * dist.treasury,
    lockRewards: emission * dist.lockRewards,
    ecosystemFund: emission * dist.ecosystemFund,
  };
}

/** Project emission schedule for N epochs */
export function emissionSchedule(
  epochs: number,
  config: EmissionConfig = DEFAULT_EMISSION_CONFIG,
): Array<{ epoch: number; emission: number; totalSupply: number }> {
  const schedule = [];
  let cumulative = 0;
  for (let e = 0; e < epochs; e++) {
    const em = epochEmission(e, config);
    cumulative += em;
    if (config.supplyCap > 0) cumulative = Math.min(cumulative, config.supplyCap);
    schedule.push({ epoch: e, emission: Math.round(em), totalSupply: Math.round(cumulative) });
  }
  return schedule;
}
