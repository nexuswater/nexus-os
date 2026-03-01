/**
 * Deterministic pseudo-random number generator (xoshiro128**).
 * Identical seed produces identical sequence across platforms.
 */

export type Rng = () => number; // returns [0, 1)

/** Create a seeded PRNG (xoshiro128**) */
export function createRng(seed: number): Rng {
  let s0 = seed >>> 0 || 1;
  let s1 = (seed * 1597334677) >>> 0 || 2;
  let s2 = (seed * 2246822519) >>> 0 || 3;
  let s3 = (seed * 3266489917) >>> 0 || 4;
  return () => {
    const r = ((((s1 * 5) >>> 0) << 7) | (((s1 * 5) >>> 0) >>> 25)) >>> 0;
    const result = ((r * 9) >>> 0) / 4294967296;
    const t = (s1 << 9) >>> 0;
    s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3;
    s2 ^= t; s3 = ((s3 << 11) | (s3 >>> 21)) >>> 0;
    return result;
  };
}

/** Default seed for all generators */
export const DEFAULT_SEED = 0x4E585042; // "NXPB" in hex

/** Reference date for all mock timestamps */
export const REF = new Date('2026-02-25T12:00:00Z');

// ─── Numeric Utilities ──────────────────────────────────

/** Integer in [min, max] inclusive */
export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Float in [min, max) */
export function randFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min;
}

/** Gaussian-ish via Box-Muller (single variate) */
export function randGauss(rng: Rng, mean: number, stddev: number): number {
  const u1 = rng() || 0.0001;
  const u2 = rng();
  return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Round to N decimal places */
export function round(v: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

// ─── Collection Utilities ───────────────────────────────

/** Pick one element from array */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick N unique elements (Fisher-Yates partial shuffle) */
export function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
    result.push(copy[i]);
  }
  return result;
}

/** Weighted boolean — returns true with given probability */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

// ─── String / ID Utilities ──────────────────────────────

/** Generate hex id of given length */
export function hexId(rng: Rng, len = 8): string {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(rng() * 16).toString(16);
  return s;
}

/** Zero-pad a number to width */
export function pad(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

// ─── Date Utilities ─────────────────────────────────────

/** ISO string N hours before REF */
export function hoursAgo(n: number): string {
  return new Date(REF.getTime() - n * 3_600_000).toISOString();
}

/** ISO string N days before REF */
export function daysAgo(n: number): string {
  return new Date(REF.getTime() - n * 86_400_000).toISOString();
}

/** ISO string N months before REF */
export function monthsAgo(n: number): string {
  const d = new Date(REF);
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

// ─── Additional utilities for new generators ─────────────

/** UUID-v4-like string (deterministic, not cryptographic) */
export function uuid(rng: Rng): string {
  const h = hexId(rng, 32);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '4' + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
}

/** Deterministic XRPL classic address (r...) */
export function xrplAddress(rng: Rng): string {
  return 'r' + hexId(rng, 24);
}

/** Deterministic EVM-style 0x address (40 hex chars) */
export function evmAddress(rng: Rng): string {
  return '0x' + hexId(rng, 40);
}

/** Deterministic transaction hash (64 hex chars) */
export function txHash(rng: Rng): string {
  return '0x' + hexId(rng, 64);
}

/** ISO timestamp offset from a base ISO string by offsetMs milliseconds */
export function offsetFrom(base: string, offsetMs: number): string {
  return new Date(new Date(base).getTime() + offsetMs).toISOString();
}

// ─── Shared domain pools ────────────────────────────────

export const REGIONS = [
  'US-AZ', 'US-TX', 'US-CO', 'US-HI', 'US-OR', 'US-CA', 'US-FL', 'US-NV',
  'KE-NBI', 'ZA-CPT', 'NG-LOS',
  'ES-BCN', 'NL-AMS', 'GB-LDN', 'DE-BER', 'NO-OSL', 'CH-ZUR',
  'JP-TKY', 'IN-MUM', 'AU-SYD', 'SG-SIN', 'ID-JKT', 'AE-DXB',
  'BR-SPL', 'PE-LIM', 'CO-BOG',
] as const;

export type Region = (typeof REGIONS)[number];

export const SITE_IDS = [
  'site-001', 'site-002', 'site-003', 'site-004', 'site-005',
  'site-006', 'site-007', 'site-008', 'site-009', 'site-010',
  'site-011', 'site-012', 'site-013', 'site-014', 'site-015',
  'site-016', 'site-017', 'site-018', 'site-019', 'site-020',
  'site-021', 'site-022', 'site-023', 'site-024', 'site-025',
  'site-026', 'site-027', 'site-028', 'site-029', 'site-030',
  'site-031', 'site-032', 'site-033', 'site-034', 'site-035',
  'site-036', 'site-037', 'site-038', 'site-039', 'site-040',
  'site-041', 'site-042',
] as const;

export type SiteId = (typeof SITE_IDS)[number];

export const TOKENS = ['NXS', 'WTR', 'ENG', 'XRP', 'RLUSD', 'USDC', 'ETH'] as const;
export type Token = (typeof TOKENS)[number];

export const BRIDGE_TOKENS = ['NXS', 'WTR', 'ENG', 'USDC'] as const;
export type BridgeToken = (typeof BRIDGE_TOKENS)[number];

export const CHAINS = ['XRPL', 'BASE', 'ARBITRUM', 'COREUM'] as const;
export type Chain = (typeof CHAINS)[number];
