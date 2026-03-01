/**
 * Epoch Dividend Distribution Engine
 * Revenue sources → distribution pools → proportional member distribution.
 * IMPORTANT: Uses "coordination incentive" language, NOT "dividend" in UI.
 */

export interface EpochSnapshot {
  epochId: number;
  snapshotTimestamp: string;
  totalRevenue: number;
  revenueBreakdown: RevenueBreakdown;
  poolAllocations: PoolAllocations;
  /** Participating members with their weights */
  participants: EpochParticipant[];
  distributed: boolean;
  distributedAt?: string;
}

export interface RevenueBreakdown {
  infrastructureLicensing: number;
  institutionalFees: number;
  treasuryYield: number;
  impactValidation: number;
  marketplaceFees: number;
}

export interface PoolAllocations {
  operations: number;       // 40%
  treasuryReserve: number;  // 25%
  coordinationPool: number; // 20% (UI: "coordination incentive", NOT "dividend")
  infrastructureExpansion: number; // 15%
}

export const DEFAULT_POOL_RATIOS: Record<keyof PoolAllocations, number> = {
  operations: 0.40,
  treasuryReserve: 0.25,
  coordinationPool: 0.20,
  infrastructureExpansion: 0.15,
};

export interface EpochParticipant {
  userId: string;
  walletAddress: string;
  governanceWeight: number;
  lockBoost: number;
  participationScore: number; // 0-1 based on recent governance activity
  allocation: number;
}

/** Calculate pool allocations from total revenue */
export function calculatePoolAllocations(
  totalRevenue: number,
  ratios: Record<keyof PoolAllocations, number> = DEFAULT_POOL_RATIOS,
): PoolAllocations {
  return {
    operations: totalRevenue * ratios.operations,
    treasuryReserve: totalRevenue * ratios.treasuryReserve,
    coordinationPool: totalRevenue * ratios.coordinationPool,
    infrastructureExpansion: totalRevenue * ratios.infrastructureExpansion,
  };
}

/** Calculate per-participant distribution from coordination pool */
export function distributeCoordinationPool(
  poolAmount: number,
  participants: Array<{
    userId: string;
    walletAddress: string;
    governanceWeight: number;
    lockBoost: number;
    participationScore: number;
  }>,
): EpochParticipant[] {
  // Effective weight = governanceWeight * lockBoost * participationScore
  const effectiveWeights = participants.map(p => ({
    ...p,
    effectiveWeight: p.governanceWeight * p.lockBoost * Math.max(0.1, p.participationScore),
  }));

  const totalWeight = effectiveWeights.reduce((s, p) => s + p.effectiveWeight, 0);

  return effectiveWeights.map(p => ({
    userId: p.userId,
    walletAddress: p.walletAddress,
    governanceWeight: p.governanceWeight,
    lockBoost: p.lockBoost,
    participationScore: p.participationScore,
    allocation: totalWeight > 0 ? (p.effectiveWeight / totalWeight) * poolAmount : 0,
  }));
}

/** Create an epoch snapshot */
export function createEpochSnapshot(
  epochId: number,
  revenue: RevenueBreakdown,
  participants: Array<{
    userId: string;
    walletAddress: string;
    governanceWeight: number;
    lockBoost: number;
    participationScore: number;
  }>,
): EpochSnapshot {
  const totalRevenue = Object.values(revenue).reduce((s, v) => s + v, 0);
  const pools = calculatePoolAllocations(totalRevenue);
  const distributed = distributeCoordinationPool(pools.coordinationPool, participants);

  return {
    epochId,
    snapshotTimestamp: new Date().toISOString(),
    totalRevenue,
    revenueBreakdown: revenue,
    poolAllocations: pools,
    participants: distributed,
    distributed: false,
  };
}
