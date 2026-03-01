/**
 * batches.ts — Generate 65 MockBatch records (40 WTR, 25 ENG).
 * Statuses: 40 ACTIVE, 15 RETIRED, 8 PENDING, 2 CANCELLED.
 * Linked to siteIds from the sites generator.
 */
import type { Rng } from '../seed';
import { randInt, randFloat, pick, hexId, daysAgo, monthsAgo, round, pad } from '../seed';
import type { ExtendedSite, MockBatch, BatchTicker, BatchStatus } from '../types';

// ─── Status plan ────────────────────────────────────────

const STATUS_PLAN: BatchStatus[] = [
  ...Array(40).fill('ACTIVE'),
  ...Array(15).fill('RETIRED'),
  ...Array(8).fill('PENDING'),
  ...Array(2).fill('CANCELLED'),
] as BatchStatus[];

// ─── Amount ranges by ticker ────────────────────────────

const MINT_RANGES: Record<BatchTicker, [number, number]> = {
  WTR: [1_000, 25_000],
  ENG: [500, 15_000],
};

// ─── Retirement fraction logic ──────────────────────────

function computeRetiredFraction(
  status: BatchStatus,
  ageMonths: number,
  retirementMonths: number,
  rng: Rng,
): number {
  switch (status) {
    case 'RETIRED':   return 1.0;
    case 'CANCELLED': return 0;
    case 'PENDING':   return 0;
    case 'ACTIVE': {
      // Proportional to age / retirementMonths with noise, capped at 0.95
      const raw = ageMonths / retirementMonths + randFloat(rng, -0.05, 0.05);
      return Math.max(0, Math.min(0.95, raw));
    }
  }
}

function computeRemainingValue(
  status: BatchStatus,
  retiredFraction: number,
  rng: Rng,
): number {
  if (status === 'RETIRED' || status === 'CANCELLED') return 0;
  if (status === 'PENDING') return round(randFloat(rng, 80, 100));
  return round(Math.max(0, (1 - retiredFraction) * 100));
}

// ─── Generator ──────────────────────────────────────────

export function generateBatches(rng: Rng, sites: ExtendedSite[]): MockBatch[] {
  const batches: MockBatch[] = [];

  // Only use non-SPACE, non-PLANNED sites for linking
  const linkable = sites.filter(
    (s) => s.type !== 'SPACE' && s.status !== 'PLANNED',
  );

  for (let i = 0; i < 65; i++) {
    const ticker: BatchTicker = i < 40 ? 'WTR' : 'ENG';
    const status = STATUS_PLAN[i];
    const site = pick(rng, linkable);

    const retirementMonths = randInt(rng, 12, 60);
    const ageMonths = randInt(rng, 1, 36);
    const mintDate = monthsAgo(ageMonths);

    const retiredFraction = computeRetiredFraction(status, ageMonths, retirementMonths, rng);
    const remainingValue = computeRemainingValue(status, retiredFraction, rng);

    const [mintLo, mintHi] = MINT_RANGES[ticker];
    const amountMinted = randInt(rng, mintLo, mintHi);

    batches.push({
      id: `batch-${ticker.toLowerCase()}-${pad(i + 1)}`,
      ticker,
      siteId: site.id,
      status,
      amountMinted,
      mintDate,
      retirementMonths,
      retiredFraction: round(retiredFraction, 3),
      remainingValue: round(remainingValue),
      region: site.location.region,
      metadataUri: `ipfs://QmBatch${ticker}${hexId(rng, 12)}`,
    });
  }

  return batches;
}

/** Convenience: summarize batch distribution for sanity checks */
export function batchSummary(batches: MockBatch[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of batches) {
    const key = `${b.ticker}:${b.status}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
