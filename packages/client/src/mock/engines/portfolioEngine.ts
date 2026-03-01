/**
 * Portfolio engine — manages user balances across chains.
 * Operates on mutable MockUser state and TokenPrice[] for valuations.
 */

import type { MockUser, TokenPrice, ChainBalance } from '../types';
import type { Token, Chain } from '../seed';

export class PortfolioEngine {
  constructor(
    private userRef: () => MockUser,
    private pricesRef: () => TokenPrice[],
  ) {}

  /** Return all chain balances for the current user. */
  getBalances(): ChainBalance[] {
    return this.userRef().chainBalances;
  }

  /** Get balance of a specific token across all chains, or on a specific chain. */
  getTokenBalance(token: Token, chain?: Chain): number {
    const balances = this.userRef().chainBalances;
    if (chain) {
      const cb = balances.find(b => b.chain === chain);
      return cb?.balances[token] ?? 0;
    }
    return balances.reduce((sum, cb) => sum + (cb.balances[token] ?? 0), 0);
  }

  /** Credit an amount of a token on the given chain. Creates chain entry if missing. */
  credit(token: Token, amount: number, chain: Chain): void {
    const user = this.userRef();
    let cb = user.chainBalances.find(b => b.chain === chain);
    if (!cb) {
      cb = { chain, balances: {} as Record<Token, number> };
      user.chainBalances.push(cb);
    }
    cb.balances[token] = (cb.balances[token] ?? 0) + amount;
  }

  /** Debit an amount of a token on the given chain. Returns false if insufficient. */
  debit(token: Token, amount: number, chain: Chain): boolean {
    const user = this.userRef();
    const cb = user.chainBalances.find(b => b.chain === chain);
    if (!cb) return false;
    const current = cb.balances[token] ?? 0;
    if (current < amount) return false;
    cb.balances[token] = current - amount;
    return true;
  }

  /** Sum of all balances * prices across every chain. */
  getPortfolioValue(): number {
    const prices = this.pricesRef();
    const priceMap = new Map(prices.map(p => [p.token, p.usd]));
    let total = 0;
    for (const cb of this.userRef().chainBalances) {
      for (const [token, qty] of Object.entries(cb.balances)) {
        const price = priceMap.get(token as Token) ?? 0;
        total += qty * price;
      }
    }
    return Math.round(total * 100) / 100;
  }

  /** Get value breakdown per chain. */
  getChainValues(): { chain: Chain; valueUsd: number }[] {
    const prices = this.pricesRef();
    const priceMap = new Map(prices.map(p => [p.token, p.usd]));
    return this.userRef().chainBalances.map(cb => {
      let valueUsd = 0;
      for (const [token, qty] of Object.entries(cb.balances)) {
        valueUsd += qty * (priceMap.get(token as Token) ?? 0);
      }
      return { chain: cb.chain, valueUsd: Math.round(valueUsd * 100) / 100 };
    });
  }
}
