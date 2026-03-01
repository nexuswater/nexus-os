/**
 * loans.ts — Generate 5 lending pools and 15 active loan positions.
 * Pools: WTR (5.2% APR), ENG (4.8%), NXS (3.5%), XRP (2.1%), RLUSD (1.8%).
 * Utilization: 45-85%. One near-liquidation position (health factor 1.1).
 */
import type { Rng } from '../seed';
import { randInt, randFloat, round, pick, hexId, evmAddress, daysAgo } from '../seed';
import type { LendingPool, LoanPosition } from '../types';
import type { Token } from '../seed';

// ─── Pool seeds ─────────────────────────────────────────

interface PoolSeed {
  token: Token;
  name: string;
  supplyAPR: number;
  borrowAPR: number;
  utilizationTarget: number;
  collateralFactor: number;
  liquidationThreshold: number;
}

const POOL_SEEDS: PoolSeed[] = [
  { token: 'WTR',   name: 'Water Credit Pool',       supplyAPR: 5.2, borrowAPR: 7.8, utilizationTarget: 0.72, collateralFactor: 0.65, liquidationThreshold: 0.80 },
  { token: 'ENG',   name: 'Energy Credit Pool',      supplyAPR: 4.8, borrowAPR: 7.2, utilizationTarget: 0.68, collateralFactor: 0.60, liquidationThreshold: 0.75 },
  { token: 'NXS',   name: 'Nexus Governance Pool',   supplyAPR: 3.5, borrowAPR: 5.5, utilizationTarget: 0.55, collateralFactor: 0.70, liquidationThreshold: 0.85 },
  { token: 'XRP',   name: 'XRP Native Pool',         supplyAPR: 2.1, borrowAPR: 3.8, utilizationTarget: 0.62, collateralFactor: 0.75, liquidationThreshold: 0.90 },
  { token: 'RLUSD', name: 'RLUSD Stablecoin Pool',   supplyAPR: 1.8, borrowAPR: 3.2, utilizationTarget: 0.82, collateralFactor: 0.85, liquidationThreshold: 0.92 },
];

/** 15 positions spread across pools: WTR(4), ENG(3), NXS(3), XRP(2), RLUSD(3) */
const POOL_IDX = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4];

const COLLATERAL_MAP: Record<Token, readonly Token[]> = {
  WTR:   ['NXS', 'RLUSD', 'USDC'],
  ENG:   ['NXS', 'RLUSD', 'XRP'],
  NXS:   ['WTR', 'ENG', 'RLUSD'],
  XRP:   ['NXS', 'RLUSD', 'USDC'],
  RLUSD: ['NXS', 'WTR', 'ENG'],
  USDC:  ['NXS', 'WTR'],
  ETH:   ['NXS', 'USDC'],
};

// ─── Generator ──────────────────────────────────────────

export function generatePools(rng: Rng): LendingPool[] {
  return POOL_SEEDS.map((s) => {
    const utilization = round(
      Math.max(0.45, Math.min(0.85, s.utilizationTarget + randFloat(rng, -0.10, 0.10))),
      4,
    );
    const totalSupply = round(randFloat(rng, 500_000, 5_000_000), 2);
    const totalBorrowed = round(totalSupply * utilization, 2);

    return {
      id: `pool-${s.token.toLowerCase()}`,
      token: s.token,
      name: s.name,
      totalSupply,
      totalBorrowed,
      utilization,
      supplyAPR: s.supplyAPR,
      borrowAPR: s.borrowAPR,
      availableLiquidity: round(totalSupply - totalBorrowed, 2),
      collateralFactor: s.collateralFactor,
      liquidationThreshold: s.liquidationThreshold,
    };
  });
}

export function generatePositions(rng: Rng, pools: LendingPool[]): LoanPosition[] {
  const positions: LoanPosition[] = [];

  for (let i = 0; i < 15; i++) {
    const pool = pools[POOL_IDX[i]];
    const collateralToken = pick(rng, COLLATERAL_MAP[pool.token]);

    const borrowedAmount = round(randFloat(rng, 500, 80_000), 2);
    const collateralAmount = round(borrowedAmount * randFloat(rng, 1.5, 4.0), 2);

    // Position 7 is near-liquidation (health 1.1), others 1.5-3.0
    const healthFactor = i === 7 ? 1.1 : round(randFloat(rng, 1.5, 3.0), 2);

    const openedAt = daysAgo(randInt(rng, 5, 180));
    const daysSinceAccrual = randInt(rng, 1, 30);
    const interestAccrued = round(
      borrowedAmount * (pool.borrowAPR / 100) * (daysSinceAccrual / 365),
      4,
    );

    positions.push({
      id: `loan-${hexId(rng, 12)}`,
      poolId: pool.id,
      token: pool.token,
      borrower: evmAddress(rng),
      collateralToken,
      collateralAmount,
      borrowedAmount,
      healthFactor,
      openedAt,
      lastAccrual: daysAgo(randInt(rng, 0, 2)),
      interestAccrued,
    });
  }

  return positions;
}
