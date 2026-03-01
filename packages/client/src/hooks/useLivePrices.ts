/**
 * useLivePrices — Fetches real-time token prices from DexScreener (XRPL DEX)
 * and CoinGecko (XRP native). Refreshes every 30 seconds.
 *
 * Tokens fetched:
 *   NXS   — DexScreener: NXS/XRP pair on XRPL (issuer rNexusA23ZQdtejTCeHZZaiKoJRsrnXboq)
 *   XRP   — CoinGecko simple price API
 *   RLUSD — DexScreener: RLUSD/XRP pair on XRPL (issuer rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De)
 *   USDC  — DexScreener: USDC on XRPL (issuer rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────

export interface LivePrice {
  token: string;
  usd: number;
  change24h: number;
  volume24h?: number;
  liquidity?: number;
  source: 'dexscreener' | 'coingecko' | 'static';
  updatedAt: number; // epoch ms
}

interface DexScreenerPair {
  chainId: string;
  pairAddress: string;
  baseToken: { symbol: string; address: string; name: string };
  quoteToken: { symbol: string; address: string; name: string };
  priceUsd: string;
  priceNative?: string;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

interface CoinGeckoSimplePrice {
  [id: string]: { usd: number; usd_24h_change?: number };
}

// ─── Constants ───────────────────────────────────────────

const REFRESH_INTERVAL = 30_000; // 30 seconds

const NXS_ISSUER = 'rNexusA23ZQdtejTCeHZZaiKoJRsrnXboq';
const RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';
const USDC_ISSUER = 'rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE';

// ─── Fetchers ────────────────────────────────────────────

async function fetchDexScreenerPair(
  query: string,
  chain: string,
  baseSymbol: string,
  issuer?: string,
): Promise<DexScreenerPair | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return null;
    const data: DexScreenerResponse = await res.json();
    if (!data.pairs) return null;

    // Filter for the right chain + base symbol + optional issuer match
    const matches = data.pairs.filter(p => {
      if (p.chainId !== chain) return false;
      if (p.baseToken.symbol !== baseSymbol) return false;
      if (issuer && !p.baseToken.address.includes(issuer)) return false;
      return true;
    });

    // Pick the pair with highest liquidity
    if (matches.length === 0) return null;
    return matches.reduce((best, p) =>
      (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best,
    );
  } catch {
    return null;
  }
}

async function fetchXRPPrice(): Promise<{ usd: number; change24h: number } | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true',
    );
    if (!res.ok) return null;
    const data: CoinGeckoSimplePrice = await res.json();
    if (!data.ripple) return null;
    return {
      usd: data.ripple.usd,
      change24h: data.ripple.usd_24h_change ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Main fetcher ────────────────────────────────────────

async function fetchAllPrices(): Promise<LivePrice[]> {
  const now = Date.now();
  const results: LivePrice[] = [];

  // Fetch all in parallel
  const [nxsPair, xrpData, rlusdPair, usdcPair] = await Promise.all([
    fetchDexScreenerPair(`NXS ${NXS_ISSUER}`, 'xrpl', 'NXS', NXS_ISSUER),
    fetchXRPPrice(),
    fetchDexScreenerPair(`RLUSD ${RLUSD_ISSUER}`, 'xrpl', 'RLUSD', RLUSD_ISSUER),
    fetchDexScreenerPair(`USDC ${USDC_ISSUER}`, 'xrpl', 'USDC', USDC_ISSUER),
  ]);

  // NXS
  if (nxsPair) {
    results.push({
      token: 'NXS',
      usd: parseFloat(nxsPair.priceUsd),
      change24h: nxsPair.priceChange?.h24 ?? 0,
      volume24h: nxsPair.volume?.h24,
      liquidity: nxsPair.liquidity?.usd,
      source: 'dexscreener',
      updatedAt: now,
    });
  }

  // XRP — primary: CoinGecko, fallback: derive from RLUSD/XRP pair
  if (xrpData) {
    results.push({
      token: 'XRP',
      usd: xrpData.usd,
      change24h: xrpData.change24h,
      source: 'coingecko',
      updatedAt: now,
    });
  } else if (rlusdPair?.priceNative) {
    // Derive XRP/USD from RLUSD/XRP pair: XRP = RLUSD_USD / priceNative
    const rlusdUsd = parseFloat(rlusdPair.priceUsd);
    const rlusdPerXrp = parseFloat(rlusdPair.priceNative);
    if (rlusdPerXrp > 0) {
      results.push({
        token: 'XRP',
        usd: rlusdUsd / rlusdPerXrp,
        change24h: -(rlusdPair.priceChange?.h24 ?? 0), // inverse of RLUSD change
        source: 'dexscreener',
        updatedAt: now,
      });
    }
  }

  // RLUSD
  if (rlusdPair) {
    results.push({
      token: 'RLUSD',
      usd: parseFloat(rlusdPair.priceUsd),
      change24h: rlusdPair.priceChange?.h24 ?? 0,
      volume24h: rlusdPair.volume?.h24,
      liquidity: rlusdPair.liquidity?.usd,
      source: 'dexscreener',
      updatedAt: now,
    });
  } else {
    // Fallback for RLUSD — it's a stablecoin
    results.push({
      token: 'RLUSD',
      usd: 1.0,
      change24h: 0,
      source: 'static',
      updatedAt: now,
    });
  }

  // USDC
  if (usdcPair) {
    results.push({
      token: 'USDC',
      usd: parseFloat(usdcPair.priceUsd),
      change24h: usdcPair.priceChange?.h24 ?? 0,
      source: 'dexscreener',
      updatedAt: now,
    });
  } else {
    results.push({
      token: 'USDC',
      usd: 1.0,
      change24h: 0,
      source: 'static',
      updatedAt: now,
    });
  }

  return results;
}

// ─── Hook ────────────────────────────────────────────────

export function useLivePrices() {
  const [prices, setPrices] = useState<LivePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAllPrices();
      if (data.length > 0) {
        setPrices(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  /** Get a single token price by symbol */
  const getPrice = useCallback(
    (symbol: string): LivePrice | undefined => prices.find(p => p.token === symbol),
    [prices],
  );

  return { prices, loading, error, refresh, getPrice };
}
