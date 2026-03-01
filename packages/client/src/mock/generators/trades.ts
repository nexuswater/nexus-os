/**
 * trades.ts — Generate 500 trade records across 6 pairs.
 * Prices spread +/-5% around base. More trades concentrated in recent days.
 * Quadratic time bias ensures realistic volume clustering.
 */
import type { Rng } from '../seed';
import { randFloat, pick, chance, hexId, round, REF } from '../seed';
import type { TradeRecord, TradePair, TradeSide } from '../types';

// ─── Pair configuration ─────────────────────────────────

interface PairConfig {
  pair: TradePair;
  basePrice: number;
  avgAmount: number;
  /** Higher weight = more trades for this pair */
  weight: number;
}

const PAIRS: PairConfig[] = [
  { pair: 'WTR/NXS',    basePrice: 0.85,  avgAmount: 2000,  weight: 1.2 },
  { pair: 'ENG/NXS',    basePrice: 1.20,  avgAmount: 1500,  weight: 1.0 },
  { pair: 'NXS/XRP',    basePrice: 2.50,  avgAmount: 800,   weight: 1.5 },
  { pair: 'XRP/RLUSD',  basePrice: 0.52,  avgAmount: 5000,  weight: 1.3 },
  { pair: 'WTR/RLUSD',  basePrice: 1.12,  avgAmount: 1800,  weight: 0.8 },
  { pair: 'ENG/RLUSD',  basePrice: 1.58,  avgAmount: 1200,  weight: 0.7 },
];

const WALLET_POOL = [
  'rNxMaker01', 'rNxMaker02', 'rNxMaker03', 'rNxMaker04', 'rNxMaker05',
  'rNxTaker01', 'rNxTaker02', 'rNxTaker03', 'rNxTaker04', 'rNxTaker05',
  'rNxTrader06', 'rNxTrader07', 'rNxTrader08', 'rNxTrader09', 'rNxTrader10',
];

// ─── Weighted pair selection ────────────────────────────

function pickWeightedPair(rng: Rng): PairConfig {
  const totalWeight = PAIRS.reduce((s, p) => s + p.weight, 0);
  let roll = rng() * totalWeight;
  for (const p of PAIRS) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return PAIRS[PAIRS.length - 1];
}

// ─── Unique wallet pair ─────────────────────────────────

function pickDistinctWallets(rng: Rng): [string, string] {
  const maker = pick(rng, WALLET_POOL);
  let taker = pick(rng, WALLET_POOL);
  while (taker === maker) taker = pick(rng, WALLET_POOL);
  return [maker, taker];
}

// ─── Generator ──────────────────────────────────────────

export function generateTrades(rng: Rng): TradeRecord[] {
  const trades: TradeRecord[] = [];
  const TOTAL = 500;

  for (let i = 0; i < TOTAL; i++) {
    const cfg = pickWeightedPair(rng);

    // Price: base +/- 5%
    const priceDelta = randFloat(rng, -0.05, 0.05);
    const price = round(cfg.basePrice * (1 + priceDelta), 6);

    // Amount: uniform-ish around avg with wide range
    const amount = round(Math.max(1, cfg.avgAmount * randFloat(rng, 0.2, 3.0)));

    const side: TradeSide = chance(rng, 0.5) ? 'BUY' : 'SELL';

    // Quadratic bias: u^2 clusters timestamps toward the present
    const u = rng();
    const hoursBack = Math.floor(u * u * 30 * 24);
    const ts = new Date(REF.getTime() - hoursBack * 3_600_000).toISOString();

    const [maker, taker] = pickDistinctWallets(rng);

    trades.push({
      id: `trade-${hexId(rng, 10)}`,
      pair: cfg.pair,
      side,
      price,
      amount,
      total: round(price * amount, 4),
      ts,
      maker,
      taker,
    });
  }

  // Sort chronologically (oldest first)
  trades.sort((a, b) => a.ts.localeCompare(b.ts));
  return trades;
}

/** Convenience: get trades filtered to a specific pair */
export function tradesByPair(trades: TradeRecord[], pair: TradePair): TradeRecord[] {
  return trades.filter((t) => t.pair === pair);
}
