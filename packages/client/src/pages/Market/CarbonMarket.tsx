/**
 * CarbonMarket — Micro Carbon Credit Marketplace.
 * Trade verified carbon prevention units (MCR tokens) generated
 * from real infrastructure: AWG, solar, greywater, rainwater.
 */

import { useState } from 'react';
import {
  Leaf,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpDown,
  Shield,
  Cpu,
  Radio,
  Activity,
  Zap,
  Droplets,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────

const MARKET_OVERVIEW = [
  { label: 'MCR Price', value: '$12.40', sub: '/ton', delta: '+3.2%', up: true },
  { label: '24h Volume', value: '847', sub: 'tons', extra: '$10,502' },
  { label: 'Total Credits Issued', value: '127,400', sub: 'tons' },
  { label: 'Active Sellers', value: '89' },
  { label: 'Active Buyers', value: '234' },
];

const PRICE_HISTORY = [
  9.20, 9.50, 9.10, 8.80, 8.20, 8.60, 9.00, 9.40, 9.80, 10.10,
  10.40, 10.00, 9.70, 10.20, 10.80, 11.10, 11.50, 11.20, 11.80, 12.10,
  12.40, 11.90, 12.60, 13.00, 13.40, 14.00, 14.60, 13.80, 12.90, 12.40,
];

const CREDIT_SOURCES = [
  {
    name: 'AWG',
    full: 'Atmospheric Water Generators',
    pct: 42,
    tons: 53508,
    desc: 'Local water production prevents transport emissions',
    color: '#00b8f0',
    icon: Droplets,
  },
  {
    name: 'Solar',
    full: 'Solar Generation',
    pct: 28,
    tons: 35672,
    desc: 'Clean energy prevents fossil fuel emissions',
    color: '#f99d07',
    icon: Zap,
  },
  {
    name: 'Greywater',
    full: 'Greywater Recycling',
    pct: 18,
    tons: 22932,
    desc: 'Water reuse prevents treatment & pumping emissions',
    color: '#25D695',
    icon: RefreshCw,
  },
  {
    name: 'Rainwater',
    full: 'Rainwater Harvesting',
    pct: 12,
    tons: 15288,
    desc: 'Passive collection prevents infrastructure emissions',
    color: '#A78BFA',
    icon: Activity,
  },
];

const BIDS = [
  { price: 12.38, amount: 14.2, total: 175.80 },
  { price: 12.35, amount: 22.5, total: 277.88 },
  { price: 12.30, amount: 8.0, total: 98.40 },
  { price: 12.28, amount: 35.0, total: 429.80 },
  { price: 12.25, amount: 18.7, total: 229.08 },
  { price: 12.20, amount: 42.1, total: 513.62 },
  { price: 12.15, amount: 11.3, total: 137.30 },
  { price: 12.10, amount: 28.9, total: 349.69 },
];

const ASKS = [
  { price: 12.42, amount: 10.5, total: 130.41 },
  { price: 12.45, amount: 19.8, total: 246.51 },
  { price: 12.50, amount: 31.2, total: 390.00 },
  { price: 12.55, amount: 7.6, total: 95.38 },
  { price: 12.60, amount: 25.0, total: 315.00 },
  { price: 12.65, amount: 15.4, total: 194.81 },
  { price: 12.70, amount: 44.8, total: 568.96 },
  { price: 12.80, amount: 20.1, total: 257.28 },
];

const MAX_BID_AMT = Math.max(...BIDS.map((b) => b.amount));
const MAX_ASK_AMT = Math.max(...ASKS.map((a) => a.amount));

const RECENT_TRADES = [
  { price: 12.40, amount: 5.2, buyer: '0xA3f...8c1D', seller: '0x71B...4e2F', time: '2m ago', source: 'AWG', isBuy: true },
  { price: 12.38, amount: 12.0, buyer: '0x9E2...a7B3', seller: '0xC44...d1A8', time: '5m ago', source: 'Solar', isBuy: false },
  { price: 12.42, amount: 3.8, buyer: '0x5D1...c9E6', seller: '0xF08...b3C2', time: '8m ago', source: 'AWG', isBuy: true },
  { price: 12.35, amount: 8.5, buyer: '0x2A7...e4F1', seller: '0xB63...a8D5', time: '12m ago', source: 'Greywater', isBuy: false },
  { price: 12.44, amount: 2.1, buyer: '0xD19...f2A4', seller: '0x8C5...b7E3', time: '15m ago', source: 'Solar', isBuy: true },
  { price: 12.30, amount: 18.0, buyer: '0x6F3...d1C8', seller: '0xE27...c5B9', time: '22m ago', source: 'Rainwater', isBuy: false },
  { price: 12.41, amount: 6.7, buyer: '0x4B8...a3D2', seller: '0x1E9...f8C6', time: '28m ago', source: 'AWG', isBuy: true },
  { price: 12.36, amount: 9.3, buyer: '0x7C4...e6A1', seller: '0x3D2...b4F7', time: '35m ago', source: 'Greywater', isBuy: false },
  { price: 12.43, amount: 4.0, buyer: '0xA15...c8E3', seller: '0x9F7...d2B4', time: '41m ago', source: 'Solar', isBuy: true },
  { price: 12.32, amount: 15.6, buyer: '0x8E6...f1A9', seller: '0x2C3...a7D5', time: '48m ago', source: 'Rainwater', isBuy: false },
];

const PORTFOLIO = {
  held: 42.8,
  value: 530.72,
  avgPrice: 11.20,
  pnl: 51.36,
  pnlPct: 10.7,
};

const VERIFICATION_STEPS = [
  { step: 'Infrastructure Output', icon: Cpu, desc: 'AWG, solar, or water system generates measurable output' },
  { step: 'IoT Measurement', icon: Radio, desc: 'Real-time sensors capture flow, kWh, and volume data' },
  { step: 'On-chain Attestation', icon: Shield, desc: 'Oracle network validates data and posts cryptographic proof' },
  { step: 'Credit Issuance', icon: CheckCircle2, desc: 'Verified MCR credits minted to producer wallet' },
];

// ─── Section Header Component ────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] mb-3">
      {children}
    </h2>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function CarbonMarket() {
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('12.40');

  const parsedAmount = parseFloat(orderAmount) || 0;
  const parsedPrice = parseFloat(orderPrice) || 0;
  const orderTotal = parsedAmount * parsedPrice;
  const networkFee = orderTotal * 0.003;

  const priceMin = Math.min(...PRICE_HISTORY);
  const priceMax = Math.max(...PRICE_HISTORY);
  const priceRange = priceMax - priceMin;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ═══ 1. Page Header ═══ */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center flex-shrink-0">
            <Leaf size={20} className="text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Micro Carbon Credit Market
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-xl">
              Trade verified carbon prevention units from real infrastructure — AWG, solar, greywater, rainwater
            </p>
          </div>
        </div>

        {/* ═══ 2. Market Overview ═══ */}
        <div>
          <SectionHeader>Market Overview</SectionHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MARKET_OVERVIEW.map((m) => (
              <div
                key={m.label}
                className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4"
              >
                <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-2">
                  {m.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-mono text-white tabular-nums">{m.value}</span>
                  {m.sub && <span className="text-xs text-[#64748B] font-mono">{m.sub}</span>}
                </div>
                {m.delta && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-mono ${m.up ? 'text-[#25D695]' : 'text-red-400'}`}>
                    {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {m.delta}
                  </div>
                )}
                {m.extra && (
                  <div className="text-[11px] font-mono text-[#64748B] mt-1">{m.extra}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 3. Price Chart Area ═══ */}
        <div>
          <SectionHeader>Price Chart</SectionHeader>
          <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <BarChart3 size={16} className="text-[#A78BFA]" />
                <span className="text-sm font-medium text-white">MCR Price — 30 Day</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-[#64748B]">
                <span>Low: <span className="text-red-400">${priceMin.toFixed(2)}</span></span>
                <span>High: <span className="text-[#25D695]">${priceMax.toFixed(2)}</span></span>
              </div>
            </div>

            {/* CSS-only bar chart */}
            <div className="flex items-end gap-[3px] h-40 sm:h-48">
              {PRICE_HISTORY.map((price, i) => {
                const heightPct = priceRange > 0 ? ((price - priceMin) / priceRange) * 100 : 50;
                const isLast = i === PRICE_HISTORY.length - 1;
                const isHigh = price === priceMax;
                const isLow = price === priceMin;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group"
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        isLast
                          ? 'bg-[#A78BFA] shadow-[0_0_8px_rgba(167,139,250,0.4)]'
                          : isHigh
                          ? 'bg-[#25D695]/80'
                          : isLow
                          ? 'bg-red-400/60'
                          : 'bg-white/[0.08] group-hover:bg-white/[0.15]'
                      }`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1C2432] text-[10px] font-mono text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      ${price.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day markers */}
            <div className="flex justify-between mt-2 text-[9px] font-mono text-[#475569]">
              <span>Day 1</span>
              <span>Day 10</span>
              <span>Day 20</span>
              <span>Day 30</span>
            </div>

            {/* Current price callout */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Current</span>
              <span className="text-lg font-mono text-[#A78BFA] tabular-nums">$12.40</span>
              <span className="text-xs font-mono text-[#25D695]">+3.2%</span>
            </div>
          </div>
        </div>

        {/* ═══ 4. Carbon Credit Sources ═══ */}
        <div>
          <SectionHeader>Carbon Credit Sources</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CREDIT_SOURCES.map((src) => {
              const Icon = src.icon;
              return (
                <div
                  key={src.name}
                  className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${src.color}15` }}
                    >
                      <Icon size={16} style={{ color: src.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{src.name}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">{src.full}</div>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-mono text-white tabular-nums">{src.pct}%</span>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {src.tons.toLocaleString()} tons
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${src.pct}%`,
                        backgroundColor: src.color,
                        boxShadow: `0 0 8px ${src.color}40`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">{src.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 5. Order Book + 6. Trade Panel (side by side on lg) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Order Book — spans 2 cols */}
          <div className="lg:col-span-2">
            <SectionHeader>Order Book</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-4">

                {/* Bids (buy orders) */}
                <div>
                  <div className="text-[10px] font-mono text-[#25D695] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp size={10} />
                    Bids
                  </div>
                  <div className="grid grid-cols-3 gap-x-2 mb-2 text-[9px] font-mono text-[#475569] uppercase tracking-wider">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="space-y-[2px]">
                    {BIDS.map((bid, i) => (
                      <div key={i} className="relative grid grid-cols-3 gap-x-2 py-1 text-xs font-mono">
                        {/* Depth bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-[#25D695]/[0.06] rounded-sm"
                          style={{ width: `${(bid.amount / MAX_BID_AMT) * 100}%` }}
                        />
                        <span className="relative text-[#25D695] tabular-nums">${bid.price.toFixed(2)}</span>
                        <span className="relative text-right text-white tabular-nums">{bid.amount.toFixed(1)}</span>
                        <span className="relative text-right text-[#64748B] tabular-nums">${bid.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks (sell orders) */}
                <div>
                  <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingDown size={10} />
                    Asks
                  </div>
                  <div className="grid grid-cols-3 gap-x-2 mb-2 text-[9px] font-mono text-[#475569] uppercase tracking-wider">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="space-y-[2px]">
                    {ASKS.map((ask, i) => (
                      <div key={i} className="relative grid grid-cols-3 gap-x-2 py-1 text-xs font-mono">
                        {/* Depth bar */}
                        <div
                          className="absolute inset-y-0 right-0 bg-red-400/[0.06] rounded-sm"
                          style={{ width: `${(ask.amount / MAX_ASK_AMT) * 100}%` }}
                        />
                        <span className="relative text-red-400 tabular-nums">${ask.price.toFixed(2)}</span>
                        <span className="relative text-right text-white tabular-nums">{ask.amount.toFixed(1)}</span>
                        <span className="relative text-right text-[#64748B] tabular-nums">${ask.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spread indicator */}
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/[0.06]">
                <ArrowUpDown size={12} className="text-[#64748B]" />
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Spread</span>
                <span className="text-xs font-mono text-white tabular-nums">
                  ${(ASKS[0].price - BIDS[0].price).toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  ({((ASKS[0].price - BIDS[0].price) / BIDS[0].price * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Trade Panel */}
          <div>
            <SectionHeader>Trade</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#1C2432]">
                <button
                  onClick={() => setTradeTab('buy')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tradeTab === 'buy'
                      ? 'text-[#25D695] border-b-2 border-[#25D695] bg-[#25D695]/[0.04]'
                      : 'text-[#64748B] hover:text-white'
                  }`}
                >
                  Buy MCR
                </button>
                <button
                  onClick={() => setTradeTab('sell')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    tradeTab === 'sell'
                      ? 'text-red-400 border-b-2 border-red-400 bg-red-400/[0.04]'
                      : 'text-[#64748B] hover:text-white'
                  }`}
                >
                  Sell MCR
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Amount input */}
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Amount (tons)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="w-full bg-[#0B0F14] border border-[#1C2432] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-gray-700 outline-none focus:border-[#A78BFA]/40 transition-colors tabular-nums"
                  />
                </div>

                {/* Price input */}
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Price ($/ton)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="12.40"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full bg-[#0B0F14] border border-[#1C2432] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-gray-700 outline-none focus:border-[#A78BFA]/40 transition-colors tabular-nums"
                  />
                </div>

                {/* Total & Fee */}
                <div className="bg-[#0B0F14] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B] font-mono">Total</span>
                    <span className="font-mono text-white tabular-nums">
                      ${orderTotal > 0 ? orderTotal.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B] font-mono">Network Fee (0.3%)</span>
                    <span className="font-mono text-[#64748B] tabular-nums">
                      ${networkFee > 0 ? networkFee.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-2 flex justify-between text-xs">
                    <span className="text-[#64748B] font-mono">You {tradeTab === 'buy' ? 'pay' : 'receive'}</span>
                    <span className="font-mono text-white tabular-nums">
                      ${orderTotal > 0
                        ? (tradeTab === 'buy' ? orderTotal + networkFee : orderTotal - networkFee).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Place Order button */}
                <button
                  disabled={parsedAmount <= 0 || parsedPrice <= 0}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    tradeTab === 'buy'
                      ? 'bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90'
                      : 'bg-red-500 text-white hover:bg-red-500/90'
                  }`}
                >
                  {tradeTab === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 7. Recent Trades ═══ */}
        <div>
          <SectionHeader>Recent Trades</SectionHeader>
          <div className="bg-[#111820] border border-[#1C2432] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-6 gap-2 px-4 sm:px-5 py-3 border-b border-[#1C2432] text-[9px] font-mono text-[#475569] uppercase tracking-wider">
              <span>Type</span>
              <span className="text-right">Price</span>
              <span className="text-right">Amount</span>
              <span>Buyer</span>
              <span>Seller</span>
              <span className="text-right">Time</span>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {RECENT_TRADES.map((trade, i) => (
                <div key={i} className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-4 sm:px-5 py-2.5 text-xs font-mono hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${trade.isBuy ? 'bg-[#25D695]' : 'bg-red-400'}`}
                    />
                    <span className={trade.isBuy ? 'text-[#25D695]' : 'text-red-400'}>
                      {trade.isBuy ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-[10px] text-[#475569] sm:hidden">
                      {trade.source}
                    </span>
                  </div>
                  <span className="text-right text-white tabular-nums">${trade.price.toFixed(2)}</span>
                  <span className="text-right text-white tabular-nums">{trade.amount} t</span>
                  <span className="text-[#64748B] hidden sm:block">{trade.buyer}</span>
                  <span className="text-[#64748B] hidden sm:block">{trade.seller}</span>
                  <span className="text-right text-[#64748B] hidden sm:block">{trade.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 8. Your Carbon Portfolio + 9. Verification (side by side on lg) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Portfolio */}
          <div>
            <SectionHeader>Your Carbon Portfolio</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1">
                    MCR Held
                  </div>
                  <div className="text-xl font-mono text-white tabular-nums">
                    {PORTFOLIO.held} <span className="text-xs text-[#64748B]">tons</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1">
                    Current Value
                  </div>
                  <div className="text-xl font-mono text-white tabular-nums">
                    ${PORTFOLIO.value.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1">
                    Avg Purchase Price
                  </div>
                  <div className="text-sm font-mono text-white tabular-nums">
                    ${PORTFOLIO.avgPrice.toFixed(2)}/ton
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-1">
                    Unrealized P&L
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[#25D695] tabular-nums">
                      +${PORTFOLIO.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono text-[#25D695]">
                      (+{PORTFOLIO.pnlPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-sm font-medium text-[#A78BFA] hover:bg-[#A78BFA]/15 transition-colors">
                  <Lock size={14} />
                  Retire Credits
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#F472B6]/10 border border-[#F472B6]/20 text-sm font-medium text-[#F472B6] hover:bg-[#F472B6]/15 transition-colors">
                  <Leaf size={14} />
                  Convert to Mercy
                </button>
              </div>
            </div>
          </div>

          {/* Verification & Methodology */}
          <div>
            <SectionHeader>Verification & Methodology</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-[#A78BFA]" />
                <span className="text-sm font-medium text-white">How MCR Credits Are Verified</span>
              </div>

              <div className="space-y-4">
                {VERIFICATION_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      {/* Step number + connector */}
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-lg bg-[#A78BFA]/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-[#A78BFA]" />
                        </div>
                        {i < VERIFICATION_STEPS.length - 1 && (
                          <div className="w-px h-4 bg-[#1C2432] mt-1" />
                        )}
                      </div>
                      <div className="pt-0.5">
                        <div className="text-xs font-medium text-white mb-0.5">
                          {i + 1}. {step.step}
                        </div>
                        <div className="text-[11px] text-[#64748B] leading-relaxed">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust badge */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <div className="flex items-start gap-2.5 bg-[#A78BFA]/[0.05] border border-[#A78BFA]/10 rounded-lg p-3">
                  <CheckCircle2 size={14} className="text-[#A78BFA] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    All credits verified by NexusOS oracle network with real-time IoT data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
