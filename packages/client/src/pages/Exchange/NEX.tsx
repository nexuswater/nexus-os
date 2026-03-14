import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Activity, Layers, Cpu, Coins, BarChart3, Users,
  Zap, Droplets, Wind, Leaf, Image, Flame,
  Clock, Radio, Shield, Vote, DollarSign,
  Server, Bot, Landmark, FileCheck, Store, Database,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const TICKERS = [
  { pair: 'WTR/USD', price: '$0.0038', delta: '+2.4%', up: true },
  { pair: 'ENG/USD', price: '$0.0021', delta: '+5.1%', up: true },
  { pair: 'CARB/USD', price: '$0.0014', delta: '-1.2%', up: false },
  { pair: 'NXS/USD', price: '$0.42', delta: '+12.3%', up: true },
  { pair: 'WTR/XRP', price: '0.0158', delta: '+0.8%', up: true },
  { pair: 'Mkt Cap', price: '$4.2M', delta: '+8.7%', up: true },
];

const BIDS = [
  { price: 0.0039, amount: 25_000, total: 97.5 },
  { price: 0.0038, amount: 50_000, total: 190.0 },
  { price: 0.0037, amount: 120_000, total: 444.0 },
  { price: 0.0036, amount: 85_000, total: 306.0 },
  { price: 0.0035, amount: 200_000, total: 700.0 },
];

const ASKS = [
  { price: 0.004, amount: 30_000, total: 120.0 },
  { price: 0.0041, amount: 45_000, total: 184.5 },
  { price: 0.0042, amount: 15_000, total: 63.0 },
  { price: 0.0043, amount: 90_000, total: 387.0 },
  { price: 0.0045, amount: 60_000, total: 270.0 },
];

const MAX_BID_AMT = Math.max(...BIDS.map((b) => b.amount));
const MAX_ASK_AMT = Math.max(...ASKS.map((a) => a.amount));

interface AssetClass {
  name: string;
  ticker: string;
  icon: React.FC<{ size?: number; className?: string }>;
  type: string;
  backed: string;
  rows: { label: string; value: string }[];
}

const ASSET_CLASSES: AssetClass[] = [
  {
    name: 'Water Credits',
    ticker: 'WTR',
    icon: Droplets,
    type: 'Commodity Token (XRPL MPT)',
    backed: 'Verified water production',
    rows: [
      { label: '24h Volume', value: '$12,450' },
      { label: 'Holders', value: '1,847' },
      { label: 'Supply', value: '8.4M tokens' },
      { label: 'Yield', value: '4.2% staking APR' },
    ],
  },
  {
    name: 'Energy Credits',
    ticker: 'ENG',
    icon: Zap,
    type: 'Utility Token (XRPL MPT)',
    backed: 'Renewable energy generation',
    rows: [
      { label: '24h Volume', value: '$8,920' },
      { label: 'Holders', value: '1,203' },
      { label: 'Supply', value: '12.1M tokens' },
      { label: 'Yield', value: '3.8% staking APR' },
    ],
  },
  {
    name: 'Carbon Offsets',
    ticker: 'CARB',
    icon: Leaf,
    type: 'Carbon Credit Certificate',
    backed: 'Verified emissions prevention',
    rows: [
      { label: '24h Volume', value: '$3,280' },
      { label: 'Certificates', value: '892' },
      { label: 'CO\u2082 Offset', value: '127,400 kg total' },
      { label: 'Standard', value: 'Nexus Verified' },
    ],
  },
  {
    name: 'Infrastructure NFTs',
    ticker: 'INFRA',
    icon: Image,
    type: 'Non-Fungible Token (XRPL)',
    backed: 'AWG installation ownership shares',
    rows: [
      { label: 'Floor Price', value: '450 XRP' },
      { label: 'Listed', value: '34' },
      { label: 'Unique Holders', value: '267' },
      { label: 'Revenue Share', value: 'Yes' },
    ],
  },
  {
    name: 'Elementalz NFTs',
    ticker: 'ELMZ',
    icon: Flame,
    type: 'Dynamic NFT (XRPL)',
    backed: 'Token burn mechanics',
    rows: [
      { label: 'Floor Price', value: '120 XRP' },
      { label: 'Collection', value: '500' },
      { label: 'Burn Rate', value: '12,400 WTR/day' },
      { label: 'Evolution', value: '5 stages' },
    ],
  },
];

interface Trade {
  time: string;
  pair: string;
  side: 'BUY' | 'SELL';
  amount: string;
  price: string;
  total: string;
}

const RECENT_TRADES: Trade[] = [
  { time: '14:32:05', pair: 'WTR/USD', side: 'BUY', amount: '12,500', price: '0.0038', total: '$47.50' },
  { time: '14:31:48', pair: 'ENG/USD', side: 'SELL', amount: '8,000', price: '0.0021', total: '$16.80' },
  { time: '14:31:22', pair: 'WTR/USD', side: 'BUY', amount: '50,000', price: '0.0038', total: '$190.00' },
  { time: '14:30:59', pair: 'CARB/USD', side: 'SELL', amount: '3,200', price: '0.0014', total: '$4.48' },
  { time: '14:30:41', pair: 'NXS/USD', side: 'BUY', amount: '1,000', price: '0.4200', total: '$420.00' },
  { time: '14:30:18', pair: 'WTR/XRP', side: 'BUY', amount: '25,000', price: '0.0158', total: '395 XRP' },
  { time: '14:29:55', pair: 'ENG/USD', side: 'BUY', amount: '15,000', price: '0.0021', total: '$31.50' },
  { time: '14:29:32', pair: 'WTR/USD', side: 'SELL', amount: '40,000', price: '0.0037', total: '$148.00' },
  { time: '14:29:10', pair: 'CARB/USD', side: 'BUY', amount: '5,000', price: '0.0014', total: '$7.00' },
  { time: '14:28:47', pair: 'NXS/USD', side: 'SELL', amount: '500', price: '0.4180', total: '$209.00' },
];

interface DepthMetric { label: string; value: string }

const DEPTH_METRICS: DepthMetric[] = [
  { label: 'Total Value Locked', value: '$2.8M' },
  { label: '24h Trading Volume', value: '$47,200' },
  { label: 'Unique Traders (24h)', value: '342' },
  { label: 'Liquidity Depth (WTR)', value: '$180,000' },
  { label: 'Liquidity Depth (ENG)', value: '$95,000' },
  { label: 'Active Market Makers', value: '12 (8 AI, 4 human)' },
];

interface EconomyLayer {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  metric: string;
}

const ECONOMY_LAYERS: EconomyLayer[] = [
  { icon: Cpu, title: 'Infrastructure Layer', desc: 'IoT sensors, AWG machines, solar panels', metric: '127 active nodes' },
  { icon: Coins, title: 'Asset Layer', desc: 'WTR, ENG, CARB tokens minted from verified production', metric: '8.4M+ tokens' },
  { icon: BarChart3, title: 'Market Layer', desc: 'NEX exchange, liquidity pools, order matching', metric: '$47K 24h volume' },
  { icon: Bot, title: 'Agent Layer', desc: 'AI agents trading, routing, optimizing', metric: '23 active agents' },
  { icon: Landmark, title: 'Governance Layer', desc: 'DAO proposals, treasury, delegation', metric: '847 active voters' },
];

interface RevenueStream {
  name: string;
  model: string;
  daily: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const REVENUE_STREAMS: RevenueStream[] = [
  { name: 'Transaction Fees', model: '0.3% per trade', daily: '$141.60/day', icon: DollarSign },
  { name: 'Mint Fees', model: '$0.10 per WTR minted', daily: '$84,720/day potential', icon: Coins },
  { name: 'Carbon Certificates', model: '$2.50 per cert', daily: '$222.50/day', icon: FileCheck },
  { name: 'Agent Skill Marketplace', model: '5% commission', daily: '$45.00/day', icon: Store },
  { name: 'Infrastructure Leasing', model: 'Revenue share', daily: '$180.00/day', icon: Server },
  { name: 'Data & Analytics', model: 'Premium tier', daily: '$0/day (launching soon)', icon: Database },
  { name: 'Elementalz Burns', model: '70% burned, 30% treasury', daily: 'variable', icon: Flame },
];

/* ═══════════════════════════════════════════════════════════
   SMALL HELPERS
   ═══════════════════════════════════════════════════════════ */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em] mb-3">
      {children}
    </h3>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111820] border border-[#1C2432] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NEX PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function NEX() {
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── 1. PAGE HEADER ──────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Nexus Environmental Exchange
              </h1>
              <span className="bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/30 px-2 py-0.5 rounded text-xs font-mono font-bold">
                NEX
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#475569] mt-1">
              {'// environmental_asset_exchange \u00b7 real_time_market_data'}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)] animate-pulse" />
              <span className="text-[10px] font-mono font-semibold text-[#25D695] uppercase tracking-wider">
                Market Open
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#475569]">
            <Radio size={12} className="text-[#25D695]" />
            24/7 Global Environmental Market
          </div>
        </header>

        {/* ── 2. MARKET OVERVIEW STRIP ────────────────── */}
        <section>
          <SectionHeader>Market Overview</SectionHeader>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {TICKERS.map((t) => (
              <div
                key={t.pair}
                className="min-w-[150px] bg-[#111820] border border-[#1C2432] rounded-lg px-3 py-2.5 flex-shrink-0"
              >
                <div className="text-[10px] font-mono text-[#475569] mb-1">{t.pair}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono font-bold text-white tabular-nums">{t.price}</span>
                  <span className={`flex items-center gap-0.5 text-[10px] font-mono font-semibold tabular-nums ${t.up ? 'text-[#25D695]' : 'text-rose-400'}`}>
                    {t.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {t.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. ORDER BOOK ───────────────────────────── */}
        <section>
          <SectionHeader>Order Book &mdash; WTR/USD</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bids */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-[#25D695]" />
                <span className="text-xs font-semibold text-[#25D695]">Buy Orders (Bids)</span>
              </div>
              <div className="space-y-0">
                {/* header row */}
                <div className="grid grid-cols-3 text-[9px] font-mono text-[#475569] uppercase tracking-wider pb-1.5 border-b border-[#1C2432]">
                  <span>Price</span>
                  <span className="text-right">Amount (WTR)</span>
                  <span className="text-right">Total</span>
                </div>
                {BIDS.map((b) => {
                  const pct = (b.amount / MAX_BID_AMT) * 100;
                  return (
                    <div key={b.price} className="relative grid grid-cols-3 text-xs font-mono tabular-nums py-1.5">
                      <div
                        className="absolute inset-y-0 right-0 bg-[#25D695]/[0.06] rounded-r"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative text-[#25D695]">{b.price.toFixed(4)}</span>
                      <span className="relative text-right text-[#94A3B8]">{b.amount.toLocaleString()}</span>
                      <span className="relative text-right text-white">${b.total.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Asks */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-rose-400" />
                <span className="text-xs font-semibold text-rose-400">Sell Orders (Asks)</span>
              </div>
              <div className="space-y-0">
                <div className="grid grid-cols-3 text-[9px] font-mono text-[#475569] uppercase tracking-wider pb-1.5 border-b border-[#1C2432]">
                  <span>Price</span>
                  <span className="text-right">Amount (WTR)</span>
                  <span className="text-right">Total</span>
                </div>
                {ASKS.map((a) => {
                  const pct = (a.amount / MAX_ASK_AMT) * 100;
                  return (
                    <div key={a.price} className="relative grid grid-cols-3 text-xs font-mono tabular-nums py-1.5">
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-400/[0.06] rounded-l"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative text-rose-400">{a.price.toFixed(4)}</span>
                      <span className="relative text-right text-[#94A3B8]">{a.amount.toLocaleString()}</span>
                      <span className="relative text-right text-white">${a.total.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Spread indicator */}
          <div className="flex justify-center mt-3">
            <div className="bg-[#111820] border border-[#1C2432] rounded-lg px-4 py-2 text-center">
              <span className="text-[10px] font-mono text-[#475569]">Spread: </span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">$0.0001</span>
              <span className="text-[10px] font-mono text-[#475569] ml-1">(2.6%)</span>
            </div>
          </div>
        </section>

        {/* ── 4. ENVIRONMENTAL ASSET CLASSES ──────────── */}
        <section>
          <SectionHeader>Environmental Asset Classes</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ASSET_CLASSES.map((ac) => {
              const Icon = ac.icon;
              return (
                <Card key={ac.ticker}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
                      <Icon size={14} className="text-[#25D695]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white leading-tight">{ac.name}</div>
                      <div className="text-[9px] font-mono text-[#475569]">{ac.ticker}</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-[#475569] mb-1 leading-snug">{ac.type}</div>
                  <div className="text-[9px] text-[#64748B] mb-3">Backed by: {ac.backed}</div>
                  <div className="space-y-1.5 border-t border-[#1C2432] pt-2">
                    {ac.rows.map((r) => (
                      <div key={r.label} className="flex justify-between text-[10px]">
                        <span className="text-[#475569]">{r.label}</span>
                        <span className="font-mono tabular-nums text-[#94A3B8]">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── 5. RECENT TRADES FEED ───────────────────── */}
        <section>
          <SectionHeader>Recent Trades</SectionHeader>
          <Card className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[9px] text-[#475569] uppercase tracking-wider border-b border-[#1C2432]">
                  <th className="text-left py-2 pr-4 font-semibold">Time</th>
                  <th className="text-left py-2 pr-4 font-semibold">Pair</th>
                  <th className="text-left py-2 pr-4 font-semibold">Side</th>
                  <th className="text-right py-2 pr-4 font-semibold">Amount</th>
                  <th className="text-right py-2 pr-4 font-semibold">Price</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TRADES.map((t, i) => (
                  <tr key={i} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/30 transition-colors">
                    <td className="py-1.5 pr-4 tabular-nums text-[#64748B]">{t.time}</td>
                    <td className="py-1.5 pr-4 text-white font-semibold">{t.pair}</td>
                    <td className={`py-1.5 pr-4 font-bold ${t.side === 'BUY' ? 'text-[#25D695]' : 'text-rose-400'}`}>
                      {t.side}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-[#94A3B8]">{t.amount}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-[#94A3B8]">{t.price}</td>
                    <td className="py-1.5 text-right tabular-nums text-white">{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── 6. MARKET DEPTH ANALYSIS ────────────────── */}
        <section>
          <SectionHeader>Market Depth Analysis</SectionHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DEPTH_METRICS.map((m) => (
              <Card key={m.label} className="text-center">
                <div className="text-[9px] font-mono text-[#475569] mb-1">{m.label}</div>
                <div className="text-sm font-mono font-bold text-white tabular-nums">{m.value}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 7. AUTONOMOUS ECONOMY LAYERS ────────────── */}
        <section>
          <SectionHeader>Autonomous Economy Layers</SectionHeader>
          <Card className="relative">
            <div className="space-y-0">
              {ECONOMY_LAYERS.map((layer, idx) => {
                const Icon = layer.icon;
                const isLast = idx === ECONOMY_LAYERS.length - 1;
                return (
                  <div key={layer.title} className="relative flex items-start gap-4 py-3">
                    {/* Vertical connector */}
                    {!isLast && (
                      <div className="absolute left-[17px] top-[42px] w-px h-[calc(100%-30px)] bg-gradient-to-b from-[#25D695]/40 to-[#1C2432]" />
                    )}

                    {/* Layer number + icon */}
                    <div className="relative flex-shrink-0 w-9 h-9 rounded-lg bg-[#25D695]/10 border border-[#25D695]/20 flex items-center justify-center">
                      <Icon size={16} className="text-[#25D695]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-[#25D695] font-bold">L{idx + 1}</span>
                        <span className="text-xs font-semibold text-white">{layer.title}</span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{layer.desc}</p>
                    </div>

                    {/* Metric badge */}
                    <div className="flex-shrink-0 bg-[#0B0F14] border border-[#1C2432] rounded-md px-2.5 py-1">
                      <span className="text-[10px] font-mono font-semibold text-[#25D695] tabular-nums whitespace-nowrap">
                        {layer.metric}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* ── 8. REVENUE ENGINES ──────────────────────── */}
        <section>
          <SectionHeader>Revenue Engines</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {REVENUE_STREAMS.map((rs, idx) => {
              const Icon = rs.icon;
              return (
                <Card key={rs.name} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#25D695]/10 flex items-center justify-center mt-0.5">
                    <Icon size={13} className="text-[#25D695]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-[#475569]">#{idx + 1}</span>
                      <span className="text-[11px] font-semibold text-white leading-tight">{rs.name}</span>
                    </div>
                    <div className="text-[9px] font-mono text-[#64748B] mt-0.5">{rs.model}</div>
                    <div className="text-[10px] font-mono font-semibold text-[#25D695] tabular-nums mt-1">{rs.daily}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── 9. FOOTER ───────────────────────────────── */}
        <footer className="border-t border-[#1C2432] pt-4 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono text-[#475569]">
          <span>nex_exchange v1.0 // nexus_protocol</span>
          <span>{ts}</span>
          <span>Powered by XRPL &middot; BASE &middot; Arbitrum &middot; HyperEVM</span>
        </footer>
      </div>
    </div>
  );
}
