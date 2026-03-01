/**
 * swaps.ts — Generate orderbooks for each of the 6 trading pairs.
 * 20 bids (descending from mid), 20 asks (ascending from mid).
 * Spread 0.2-0.8%. Includes 24h volume, high, low, changePct.
 */
import type { Rng } from '../seed';
import { randFloat, randInt, round } from '../seed';
import type { TradePair, PairOrderbook, OrderbookLevel } from '../types';

// ─── Pair base prices (must match trades.ts) ────────────

const BASE_PRICES: Record<TradePair, number> = {
  'WTR/NXS':   0.85,
  'ENG/NXS':   1.20,
  'NXS/XRP':   2.50,
  'XRP/RLUSD': 0.52,
  'WTR/RLUSD': 1.12,
  'ENG/RLUSD': 1.58,
};

const ALL_PAIRS: TradePair[] = [
  'WTR/NXS', 'ENG/NXS', 'NXS/XRP', 'XRP/RLUSD', 'WTR/RLUSD', 'ENG/RLUSD',
];

const LEVELS = 20;

// ─── Generator ──────────────────────────────────────────

export function generateOrderbooks(rng: Rng): PairOrderbook[] {
  const books: PairOrderbook[] = [];

  for (const pair of ALL_PAIRS) {
    const base = BASE_PRICES[pair];

    // Spread between 0.2% and 0.8%
    const spreadPct = round(randFloat(rng, 0.2, 0.8), 3);
    const halfSpread = base * (spreadPct / 100 / 2);

    const midPrice = round(base * (1 + randFloat(rng, -0.01, 0.01)), 6);
    const bestBid = round(midPrice - halfSpread, 6);
    const bestAsk = round(midPrice + halfSpread, 6);

    // Build bids: descending from bestBid
    const bids: OrderbookLevel[] = [];
    let cumBid = 0;
    for (let i = 0; i < LEVELS; i++) {
      const tickDown = base * randFloat(rng, 0.0005, 0.003);
      const price = round(bestBid - i * tickDown, 6);
      const amount = round(randFloat(rng, 50, 8000));
      cumBid += amount;
      bids.push({ price: Math.max(price, 0.000001), amount, total: round(cumBid) });
    }

    // Build asks: ascending from bestAsk
    const asks: OrderbookLevel[] = [];
    let cumAsk = 0;
    for (let i = 0; i < LEVELS; i++) {
      const tickUp = base * randFloat(rng, 0.0005, 0.003);
      const price = round(bestAsk + i * tickUp, 6);
      const amount = round(randFloat(rng, 50, 8000));
      cumAsk += amount;
      asks.push({ price, amount, total: round(cumAsk) });
    }

    // 24h stats
    const changePct = round(randFloat(rng, -6, 6), 2);
    const high24h = round(midPrice * (1 + Math.abs(randFloat(rng, 0.01, 0.04))), 6);
    const low24h = round(midPrice * (1 - Math.abs(randFloat(rng, 0.01, 0.04))), 6);
    const volume24h = round(randFloat(rng, 20_000, 500_000));

    books.push({
      pair,
      bids,
      asks,
      midPrice,
      spreadPct,
      volume24h,
      high24h,
      low24h,
      changePct24h: changePct,
    });
  }
  return books;
}
