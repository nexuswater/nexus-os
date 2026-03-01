import { useState, useMemo } from 'react';
import {
  useNexusOrderbooks,
  useNexusTrades,
  useNexusActions,
} from '@/mock/useNexusStore';
import type { TradePair } from '@/mock/types';
import type { Token } from '@/mock/seed';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const PAIRS: TradePair[] = [
  'WTR/NXS',
  'ENG/NXS',
  'NXS/XRP',
  'XRP/RLUSD',
  'WTR/RLUSD',
  'ENG/RLUSD',
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function fmt(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPrice(n: number): string {
  if (n < 0.01) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function changeBadge(pct: number): { color: string; label: string } {
  const label = `${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(2)}%`;
  const color = pct >= 0 ? '#25D695' : '#E5484D';
  return { color, label };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Depth Bar                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function DepthRow({
  price,
  size,
  maxSize,
  side,
}: {
  price: number;
  size: number;
  maxSize: number;
  side: 'bid' | 'ask';
}) {
  const pct = maxSize > 0 ? (size / maxSize) * 100 : 0;
  const barColor = side === 'bid' ? 'rgba(37,214,149,0.15)' : 'rgba(229,72,77,0.15)';
  const textColor = side === 'bid' ? '#25D695' : '#E5484D';

  return (
    <div className="relative flex items-center text-xs tabular-nums py-1 px-2">
      <div
        className="absolute inset-y-0 rounded-sm"
        style={{
          background: barColor,
          width: `${pct}%`,
          ...(side === 'bid' ? { right: 0 } : { left: 0 }),
        }}
      />
      <span className="relative flex-1 font-medium" style={{ color: textColor }}>
        {fmtPrice(price)}
      </span>
      <span className="relative" style={{ color: '#8B95A5' }}>
        {fmt(size, 2)}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Trade Form                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function TradeForm({
  pair,
  midPrice,
  onClose,
}: {
  pair: TradePair;
  midPrice: number;
  onClose: () => void;
}) {
  const actions = useNexusActions();
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);

  const [base, quote] = pair.split('/') as [Token, Token];
  const total = Number(amount) * midPrice;

  function submit() {
    const a = Number(amount);
    if (!a || a <= 0) return;
    if (side === 'BUY') {
      actions.swap(quote, base, a * midPrice);
    } else {
      actions.swap(base, quote, a);
    }
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm p-6 rounded-xl"
        style={{ background: '#111820', border: '1px solid #1C2432' }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-xl font-bold mb-2" style={{ color: '#25D695' }}>
              Order Submitted
            </div>
            <p className="text-sm" style={{ color: '#8B95A5' }}>
              {side} {amount} {base} at ~{fmtPrice(midPrice)} {quote}
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1C2432', color: '#C9D1D9' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">
              Trade {pair}
            </h3>

            {/* Side toggle */}
            <div
              className="flex rounded-lg overflow-hidden mb-5"
              style={{ border: '1px solid #1C2432' }}
            >
              {(['BUY', 'SELL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: side === s
                      ? s === 'BUY' ? '#25D695' : '#E5484D'
                      : '#0B0F14',
                    color: side === s ? '#000' : '#8B95A5',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <label className="block text-xs mb-1" style={{ color: '#8B95A5' }}>
              Amount ({base})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mb-3 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
              style={{ background: '#0B0F14', border: '1px solid #1C2432' }}
            />

            <div className="flex items-center justify-between text-xs mb-5" style={{ color: '#8B95A5' }}>
              <span>Price: ~{fmtPrice(midPrice)} {quote}</span>
              <span>Total: ~{isNaN(total) ? '0.00' : fmt(total)} {quote}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={!amount || Number(amount) <= 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: side === 'BUY' ? '#25D695' : '#E5484D' }}
              >
                {side} {base}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: '#1C2432', color: '#C9D1D9' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export default function Marketplace() {
  const orderbooks = useNexusOrderbooks();
  const allTrades = useNexusTrades();

  const [selectedPair, setSelectedPair] = useState<TradePair>('WTR/NXS');
  const [tradeOpen, setTradeOpen] = useState(false);

  /* ── Current orderbook ── */
  const book = useMemo(
    () => orderbooks.find((ob) => ob.pair === selectedPair),
    [orderbooks, selectedPair],
  );

  /* ── Filtered trades (last 20) ── */
  const trades = useMemo(
    () =>
      allTrades
        .filter((t) => t.pair === selectedPair)
        .slice(-20)
        .reverse(),
    [allTrades, selectedPair],
  );

  /* ── Max depth for bar scaling ── */
  const maxBid = useMemo(
    () => Math.max(...(book?.bids.map((b) => b.amount) ?? [1]), 1),
    [book],
  );
  const maxAsk = useMemo(
    () => Math.max(...(book?.asks.map((a) => a.amount) ?? [1]), 1),
    [book],
  );

  const change = book ? changeBadge(book.changePct24h) : { color: '#8B95A5', label: '0.00%' };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ background: '#0B0F14' }}>
      {/* ─── Header ─── */}
      <h1
        className="text-2xl font-bold tracking-tight mb-6"
        style={{ color: '#25D695' }}
      >
        Market
      </h1>

      {/* ─── Pair Selector Tabs ─── */}
      <div
        className="flex flex-wrap gap-1 rounded-lg p-1 mb-6"
        style={{ background: '#111820', border: '1px solid #1C2432' }}
      >
        {PAIRS.map((pair) => (
          <button
            key={pair}
            onClick={() => setSelectedPair(pair)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{
              background: selectedPair === pair ? '#25D695' : 'transparent',
              color: selectedPair === pair ? '#000' : '#8B95A5',
            }}
          >
            {pair}
          </button>
        ))}
      </div>

      {!book ? (
        <div
          className="rounded-xl p-10 text-center text-sm"
          style={{ background: '#111820', border: '1px solid #1C2432', color: '#8B95A5' }}
        >
          No orderbook data for {selectedPair}.
        </div>
      ) : (
        <>
          {/* ─── Price Header ─── */}
          <div
            className="rounded-xl p-5 mb-6"
            style={{ background: '#111820', border: '1px solid #1C2432' }}
          >
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              {/* Mid price */}
              <div>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#8B95A5' }}>
                  {selectedPair}
                </div>
                <div className="text-3xl font-bold text-white tabular-nums">
                  {fmtPrice(book.midPrice)}
                </div>
              </div>

              {/* 24h Change */}
              <div>
                <div className="text-xs mb-1" style={{ color: '#8B95A5' }}>24h Change</div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: change.color }}>
                  {change.label}
                </div>
              </div>

              {/* High / Low */}
              <div>
                <div className="text-xs mb-1" style={{ color: '#8B95A5' }}>24h High</div>
                <div className="text-sm font-medium text-white tabular-nums">{fmtPrice(book.high24h)}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#8B95A5' }}>24h Low</div>
                <div className="text-sm font-medium text-white tabular-nums">{fmtPrice(book.low24h)}</div>
              </div>

              {/* Volume */}
              <div>
                <div className="text-xs mb-1" style={{ color: '#8B95A5' }}>Volume</div>
                <div className="text-sm font-medium text-white tabular-nums">{fmt(book.volume24h)}</div>
              </div>

              {/* Spread */}
              <div>
                <div className="text-xs mb-1" style={{ color: '#8B95A5' }}>Spread</div>
                <div className="text-sm font-medium text-white tabular-nums">
                  {(book.spreadPct * 100).toFixed(3)}%
                </div>
              </div>
            </div>
          </div>

          {/* ─── Orderbook + Trades Grid ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Bids */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#111820', border: '1px solid #1C2432' }}
            >
              <div
                className="px-4 py-3 text-xs font-semibold uppercase tracking-widest flex items-center justify-between"
                style={{ borderBottom: '1px solid #1C2432', color: '#25D695' }}
              >
                <span>Bids</span>
                <span style={{ color: '#8B95A5' }}>Size</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {book.bids.slice(0, 15).map((level, i) => (
                  <DepthRow
                    key={`bid-${i}`}
                    price={level.price}
                    size={level.amount}
                    maxSize={maxBid}
                    side="bid"
                  />
                ))}
              </div>
            </div>

            {/* Asks */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#111820', border: '1px solid #1C2432' }}
            >
              <div
                className="px-4 py-3 text-xs font-semibold uppercase tracking-widest flex items-center justify-between"
                style={{ borderBottom: '1px solid #1C2432', color: '#E5484D' }}
              >
                <span>Asks</span>
                <span style={{ color: '#8B95A5' }}>Size</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {book.asks.slice(0, 15).map((level, i) => (
                  <DepthRow
                    key={`ask-${i}`}
                    price={level.price}
                    size={level.amount}
                    maxSize={maxAsk}
                    side="ask"
                  />
                ))}
              </div>
            </div>

            {/* Recent Trades */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#111820', border: '1px solid #1C2432' }}
            >
              <div
                className="px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                style={{ borderBottom: '1px solid #1C2432', color: '#8B95A5' }}
              >
                Recent Trades
              </div>
              <div className="max-h-80 overflow-y-auto">
                {trades.length === 0 ? (
                  <div className="p-4 text-xs text-center" style={{ color: '#8B95A5' }}>
                    No trades yet for {selectedPair}.
                  </div>
                ) : (
                  trades.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center text-xs tabular-nums px-4 py-1.5"
                      style={{ borderBottom: '1px solid rgba(28,36,50,0.5)' }}
                    >
                      <span
                        className="w-10 font-semibold"
                        style={{ color: t.side === 'BUY' ? '#25D695' : '#E5484D' }}
                      >
                        {t.side}
                      </span>
                      <span className="flex-1 text-white">{fmtPrice(t.price)}</span>
                      <span style={{ color: '#8B95A5' }}>{fmt(t.amount)}</span>
                      <span className="ml-3" style={{ color: '#555D6E' }}>
                        {fmtTime(t.ts)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── Quick Trade Buttons ─── */}
          <div className="flex gap-3">
            <button
              onClick={() => setTradeOpen(true)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-black"
              style={{ background: '#25D695' }}
            >
              Buy {selectedPair.split('/')[0]}
            </button>
            <button
              onClick={() => setTradeOpen(true)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: '#E5484D' }}
            >
              Sell {selectedPair.split('/')[0]}
            </button>
          </div>

          {/* ─── Trade Modal ─── */}
          {tradeOpen && (
            <TradeForm
              pair={selectedPair}
              midPrice={book.midPrice}
              onClose={() => setTradeOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
