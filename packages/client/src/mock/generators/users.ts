/**
 * users.ts — Single mock admin user with multi-chain balances
 * and token price table for portfolio calculations.
 *
 * Balances:
 *   XRPL:     NXS 24750, XRP 5200, WTR 3200, ENG 1800, RLUSD 3500
 *   BASE:     NXS 8000, WTR 1500, ENG 900, USDC 12000, ETH 2.5
 *   ARBITRUM: NXS 2000, WTR 500, ENG 300, USDC 3000, ETH 1.2
 */
import type { Rng } from '../seed';
import { xrplAddress, evmAddress, round } from '../seed';
import type { MockUser, ChainBalance, TokenPrice } from '../types';
import type { Token, Chain } from '../seed';

// ─── Static balances ────────────────────────────────────

const CHAIN_BALANCES: ChainBalance[] = [
  {
    chain: 'XRPL' as Chain,
    balances: {
      NXS: 24_750, XRP: 5_200, WTR: 3_200, ENG: 1_800,
      RLUSD: 3_500, USDC: 0, ETH: 0,
    } as Record<Token, number>,
  },
  {
    chain: 'BASE' as Chain,
    balances: {
      NXS: 8_000, XRP: 0, WTR: 1_500, ENG: 900,
      RLUSD: 0, USDC: 12_000, ETH: 2.5,
    } as Record<Token, number>,
  },
  {
    chain: 'ARBITRUM' as Chain,
    balances: {
      NXS: 2_000, XRP: 0, WTR: 500, ENG: 300,
      RLUSD: 0, USDC: 3_000, ETH: 1.2,
    } as Record<Token, number>,
  },
];

// ─── Token prices ───────────────────────────────────────

export const TOKEN_PRICES: TokenPrice[] = [
  { token: 'NXS',   usd: 2.45,     change24h:  3.8  },
  { token: 'WTR',   usd: 1.12,     change24h: -1.2  },
  { token: 'ENG',   usd: 0.87,     change24h:  2.1  },
  { token: 'XRP',   usd: 2.31,     change24h: -0.5  },
  { token: 'RLUSD', usd: 1.00,     change24h:  0.01 },
  { token: 'USDC',  usd: 1.00,     change24h:  0.0  },
  { token: 'ETH',   usd: 3_420.50, change24h:  1.4  },
];

const PRICE_MAP = new Map<Token, number>(TOKEN_PRICES.map((p) => [p.token, p.usd]));

// ─── Generator ──────────────────────────────────────────

export function generateUser(rng: Rng): MockUser {
  return {
    id: 'user-admin-001',
    displayName: 'Nexus Admin',
    email: 'admin@nexus.os',
    role: 'ADMIN',
    xrplAddress: xrplAddress(rng),
    evmAddress: evmAddress(rng),
    region: 'US-AZ',
    createdAt: '2025-06-15T08:00:00Z',
    lastLoginAt: '2026-02-25T11:30:00Z',
    chainBalances: CHAIN_BALANCES,
  };
}

// ─── Portfolio helpers (static, no rng needed) ──────────

/** USD price for a token. Returns 0 if not found. */
export function getTokenPrice(token: Token): number {
  return PRICE_MAP.get(token) ?? 0;
}

/** Total balance for a token across all chains. */
export function getTotalBalance(token: Token): number {
  return round(
    CHAIN_BALANCES.reduce((sum, cb) => sum + (cb.balances[token] ?? 0), 0),
    6,
  );
}

/** Total portfolio value in USD. */
export function getPortfolioValue(): number {
  let total = 0;
  for (const cb of CHAIN_BALANCES) {
    for (const [tok, amt] of Object.entries(cb.balances)) {
      total += amt * (PRICE_MAP.get(tok as Token) ?? 0);
    }
  }
  return round(total, 2);
}

/** Per-token portfolio breakdown sorted by USD value descending. */
export function getPortfolioBreakdown(): Array<{
  token: Token;
  totalAmount: number;
  usdValue: number;
  percentage: number;
}> {
  const totalVal = getPortfolioValue();
  const tokens: Token[] = ['NXS', 'XRP', 'WTR', 'ENG', 'RLUSD', 'USDC', 'ETH'];

  return tokens
    .map((token) => {
      const totalAmount = getTotalBalance(token);
      const usdValue = round(totalAmount * (PRICE_MAP.get(token) ?? 0), 2);
      const percentage = totalVal > 0 ? round((usdValue / totalVal) * 100, 2) : 0;
      return { token, totalAmount, usdValue, percentage };
    })
    .filter((e) => e.totalAmount > 0)
    .sort((a, b) => b.usdValue - a.usdValue);
}

/** Balances for a specific chain. */
export function getBalancesForChain(chain: Chain): Record<Token, number> | undefined {
  return CHAIN_BALANCES.find((cb) => cb.chain === chain)?.balances;
}
