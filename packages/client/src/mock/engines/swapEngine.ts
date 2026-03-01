/**
 * Swap engine — mock swap execution with realistic quotes.
 * Uses orderbook mid-prices for pricing and emits SWAP events.
 */

import type { TradeRecord, PairOrderbook, TradePair } from '../types';
import type { Token } from '../seed';
import { createRng, uuid, txHash, round, hexId } from '../seed';
import type { EventBus } from './eventBus';
import type { PortfolioEngine } from './portfolioEngine';

export interface SwapQuote {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fee: number;
  route: Token[];
  slippage: number;
  midPrice: number;
}

export interface SwapResult {
  success: boolean;
  txHash: string;
  quote: SwapQuote;
  trade: TradeRecord;
}

const DIRECT_PAIRS: TradePair[] = [
  'WTR/NXS', 'ENG/NXS', 'NXS/XRP', 'XRP/RLUSD', 'WTR/RLUSD', 'ENG/RLUSD',
];

function findPair(a: Token, b: Token): TradePair | null {
  const fwd = `${a}/${b}` as TradePair;
  const rev = `${b}/${a}` as TradePair;
  if (DIRECT_PAIRS.includes(fwd)) return fwd;
  if (DIRECT_PAIRS.includes(rev)) return rev;
  return null;
}

export class SwapEngine {
  private rng = createRng(0xBEEF);

  constructor(
    private orderbooksRef: () => PairOrderbook[],
    private tradesRef: () => TradeRecord[],
    private portfolio: PortfolioEngine,
    private eventBus: EventBus,
  ) {}

  /** Generate a swap quote without executing. */
  quote(tokenIn: Token, tokenOut: Token, amountIn: number): SwapQuote {
    const books = this.orderbooksRef();
    const directPair = findPair(tokenIn, tokenOut);
    let route: Token[];
    let midPrice: number;
    let volume24h: number;

    if (directPair) {
      const book = books.find(b => b.pair === directPair)!;
      const isForward = directPair.startsWith(tokenIn);
      midPrice = isForward ? book.midPrice : 1 / book.midPrice;
      volume24h = book.volume24h;
      route = [tokenIn, tokenOut];
    } else {
      // Route through NXS
      const legA = books.find(b => b.pair === findPair(tokenIn, 'NXS' as Token));
      const legB = books.find(b => b.pair === findPair('NXS' as Token, tokenOut));
      const pA = legA ? legA.midPrice : 1;
      const pB = legB ? legB.midPrice : 1;
      midPrice = pA * pB;
      volume24h = Math.min(legA?.volume24h ?? 10000, legB?.volume24h ?? 10000);
      route = [tokenIn, 'NXS' as Token, tokenOut];
    }

    const priceImpact = Math.min(Math.sqrt(amountIn / volume24h) * 100, 15);
    const fee = round(amountIn * 0.003, 6);
    const effectivePrice = midPrice * (1 - priceImpact / 100);
    const amountOut = round((amountIn - fee) * effectivePrice, 6);
    const slippage = round(priceImpact * 0.5, 4);

    return { tokenIn, tokenOut, amountIn, amountOut, priceImpact: round(priceImpact, 4), fee, route, slippage, midPrice: round(midPrice, 6) };
  }

  /** Execute swap: debit tokenIn, credit tokenOut, record trade, emit event. */
  execute(tokenIn: Token, tokenOut: Token, amountIn: number, chain: 'XRPL' | 'BASE' | 'ARBITRUM' | 'COREUM' = 'XRPL'): SwapResult {
    const q = this.quote(tokenIn, tokenOut, amountIn);
    this.portfolio.debit(tokenIn, amountIn, chain);
    this.portfolio.credit(tokenOut, q.amountOut, chain);

    const pair = findPair(tokenIn, tokenOut) ?? (`${tokenIn}/${tokenOut}` as TradePair);
    const trade: TradeRecord = {
      id: uuid(this.rng),
      pair,
      side: 'BUY',
      price: q.midPrice,
      amount: amountIn,
      total: q.amountOut,
      ts: new Date().toISOString(),
      maker: 'pool-' + hexId(this.rng, 6),
      taker: 'user',
    };
    this.tradesRef().push(trade);

    const hash = txHash(this.rng);
    this.eventBus.emit({
      id: uuid(this.rng),
      type: 'SWAP',
      timeISO: trade.ts,
      message: `Swapped ${amountIn} ${tokenIn} → ${round(q.amountOut, 4)} ${tokenOut}`,
      severity: 'success',
      payload: { tokenIn, tokenOut, amountIn, amountOut: q.amountOut, txHash: hash },
    });

    return { success: true, txHash: hash, quote: q, trade };
  }
}
