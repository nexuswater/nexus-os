/**
 * loanEngine.ts — Runtime lending engine.
 * Creates loans against lending pools, tracks health factors,
 * handles repayment and collateral release.
 */
import type { Rng } from '../seed';
import {
  uuid, hexId, round, randFloat,
} from '../seed';
import type { LoanPosition, LendingPool, TokenPrice } from '../types';
import type { Token } from '../seed';

// ─── Event callback type ────────────────────────────────

export type LoanEventKind = 'LOAN_OPENED' | 'LOAN_REPAID' | 'LOAN_CLOSED';

export interface LoanEvent {
  kind: LoanEventKind;
  loanId: string;
  poolId: string;
  borrower: string;
  amount: number;
  healthFactor: number;
  timestamp: string;
}

export type LoanListener = (evt: LoanEvent) => void;

// ─── Engine ─────────────────────────────────────────────

export class LoanEngine {
  private pools: Map<string, LendingPool>;
  private positions: Map<string, LoanPosition>;
  private prices: Map<Token, number>;
  private rng: Rng;
  private listeners: LoanListener[] = [];

  constructor(
    rng: Rng,
    pools: LendingPool[],
    positions: LoanPosition[],
    prices: TokenPrice[],
  ) {
    this.rng = rng;
    this.pools = new Map(pools.map((p) => [p.id, { ...p }]));
    this.positions = new Map(positions.map((p) => [p.id, { ...p }]));
    this.prices = new Map(prices.map((p) => [p.token, p.usd]));
  }

  onEvent(fn: LoanListener): void {
    this.listeners.push(fn);
  }

  private emit(evt: LoanEvent): void {
    for (const fn of this.listeners) fn(evt);
  }

  private price(token: Token): number {
    return this.prices.get(token) ?? 1;
  }

  /** Find the lending pool for a given borrow token. */
  findPool(borrowToken: Token): LendingPool | undefined {
    for (const p of this.pools.values()) {
      if (p.token === borrowToken) return p;
    }
    return undefined;
  }

  /** Open a new loan position. */
  createLoan(
    borrower: string,
    collateralToken: Token,
    collateralAmt: number,
    borrowToken: Token,
    borrowAmt: number,
  ): LoanPosition | null {
    const pool = this.findPool(borrowToken);
    if (!pool) return null;
    if (borrowAmt > pool.availableLiquidity) return null;

    const colValue = collateralAmt * this.price(collateralToken) * pool.collateralFactor;
    const borValue = borrowAmt * this.price(borrowToken);
    const healthFactor = round(borValue > 0 ? colValue / borValue : 99, 4);

    const now = new Date().toISOString();
    const position: LoanPosition = {
      id: `loan-${hexId(this.rng, 12)}`,
      poolId: pool.id,
      token: borrowToken,
      borrower,
      collateralToken,
      collateralAmount: round(collateralAmt, 4),
      borrowedAmount: round(borrowAmt, 4),
      healthFactor,
      openedAt: now,
      lastAccrual: now,
      interestAccrued: 0,
    };

    // Update pool
    pool.totalBorrowed = round(pool.totalBorrowed + borrowAmt, 2);
    pool.availableLiquidity = round(pool.totalSupply - pool.totalBorrowed, 2);
    pool.utilization = round(pool.totalBorrowed / pool.totalSupply, 4);

    this.positions.set(position.id, position);

    this.emit({
      kind: 'LOAN_OPENED',
      loanId: position.id,
      poolId: pool.id,
      borrower,
      amount: borrowAmt,
      healthFactor,
      timestamp: now,
    });

    return position;
  }

  /** Repay part or all of a loan. */
  repay(loanId: string, amount: number): LoanPosition | null {
    const pos = this.positions.get(loanId);
    if (!pos) return null;
    const pool = this.pools.get(pos.poolId);
    if (!pool) return null;

    const repayAmt = Math.min(amount, pos.borrowedAmount);
    const fraction = repayAmt / pos.borrowedAmount;

    pos.borrowedAmount = round(pos.borrowedAmount - repayAmt, 4);
    const collateralRelease = round(pos.collateralAmount * fraction, 4);
    pos.collateralAmount = round(pos.collateralAmount - collateralRelease, 4);

    // Recalculate health factor
    if (pos.borrowedAmount > 0) {
      const colValue = pos.collateralAmount * this.price(pos.collateralToken) * pool.collateralFactor;
      const borValue = pos.borrowedAmount * this.price(pos.token);
      pos.healthFactor = round(borValue > 0 ? colValue / borValue : 99, 4);
    } else {
      pos.healthFactor = 99;
    }

    pos.lastAccrual = new Date().toISOString();

    // Update pool
    pool.totalBorrowed = round(pool.totalBorrowed - repayAmt, 2);
    pool.availableLiquidity = round(pool.totalSupply - pool.totalBorrowed, 2);
    pool.utilization = round(pool.totalBorrowed / pool.totalSupply, 4);

    const kind: LoanEventKind = pos.borrowedAmount <= 0 ? 'LOAN_CLOSED' : 'LOAN_REPAID';

    if (pos.borrowedAmount <= 0) {
      this.positions.delete(loanId);
    }

    this.emit({
      kind,
      loanId,
      poolId: pool.id,
      borrower: pos.borrower,
      amount: repayAmt,
      healthFactor: pos.healthFactor,
      timestamp: new Date().toISOString(),
    });

    return pos;
  }

  /** Get current health factor for a position. */
  getHealthFactor(loanId: string): number | null {
    return this.positions.get(loanId)?.healthFactor ?? null;
  }

  /** Snapshot of all pools. */
  getPools(): LendingPool[] {
    return [...this.pools.values()];
  }

  /** Snapshot of all positions. */
  getPositions(): LoanPosition[] {
    return [...this.positions.values()];
  }
}
