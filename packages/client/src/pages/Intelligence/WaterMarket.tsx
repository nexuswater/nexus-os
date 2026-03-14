/**
 * WaterMarket — Bloomberg-style water commodity + carbon offset market simulation.
 * Tracks real-time water production, carbon prevention, regional pricing,
 * token architecture options, logistics, and AI agent trading activity.
 */

import {
  Droplets, Zap, Leaf, Truck, Bot, TrendingUp,
  TrendingDown, AlertTriangle, Sun, Package,
  Radio, ArrowRight, CircleDot, Shield,
  CheckCircle2, Clock, BarChart3, Layers,
  Star, Activity, Globe,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────

interface KPICard {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon: typeof Droplets;
  color: string;
}

interface RegionRow {
  region: string;
  flag: string;
  supply: number;
  demand: number;
  pricePerL: number;
  carbonValue: number;
  combinedValue: number;
}

interface ProductionEvent {
  id: string;
  source: string;
  volume: string;
  energy: string;
  carbonPrevented: string;
  waterValue: string;
  carbonVal: string;
  energyIcon: typeof Sun;
  energyColor: string;
}

interface TokenOption {
  title: string;
  recommended?: boolean;
  symbols: string;
  pros: string[];
  cons: string[];
  grade: string;
  gradeColor: string;
}

interface LogisticsEvent {
  id: string;
  origin: string;
  destination: string;
  distance: string;
  transport: string;
  costPerL: string;
  carbonAdded: string;
  carbonNet: string;
  status: 'delivered' | 'in-transit' | 'pending';
}

interface AgentEvent {
  id: string;
  agent: string;
  action: string;
  color: string;
}

interface MarketSignal {
  title: string;
  body: string;
  type: 'alert' | 'surplus' | 'premium' | 'opportunity';
  icon: typeof AlertTriangle;
  color: string;
  borderColor: string;
  bgColor: string;
}

// ─── Mock Data ─────────────────────────────────────────────

const KPI_DATA: KPICard[] = [
  {
    label: 'Network Water Production',
    value: '847,200 L/day',
    delta: '+12%',
    deltaUp: true,
    icon: Droplets,
    color: '#00b8f0',
  },
  {
    label: 'Avg Water Price',
    value: '$0.0038/L',
    delta: '-3%',
    deltaUp: false,
    icon: BarChart3,
    color: '#25D695',
  },
  {
    label: 'Carbon Prevented Today',
    value: '2,847 kg CO\u2082',
    delta: '+18%',
    deltaUp: true,
    icon: Leaf,
    color: '#A78BFA',
  },
  {
    label: 'Active Infrastructure',
    value: '127 nodes',
    delta: '+5',
    deltaUp: true,
    icon: Radio,
    color: '#f99d07',
  },
];

const REGIONS: RegionRow[] = [
  { region: 'Maui, HI', flag: 'US', supply: 45000, demand: 52000, pricePerL: 0.0045, carbonValue: 0.0012, combinedValue: 0.0057 },
  { region: 'Austin, TX', flag: 'US', supply: 120000, demand: 95000, pricePerL: 0.0032, carbonValue: 0.0008, combinedValue: 0.0040 },
  { region: 'Phoenix, AZ', flag: 'US', supply: 78000, demand: 110000, pricePerL: 0.0058, carbonValue: 0.0015, combinedValue: 0.0073 },
  { region: 'San Juan, PR', flag: 'PR', supply: 35000, demand: 48000, pricePerL: 0.0051, carbonValue: 0.0018, combinedValue: 0.0069 },
  { region: 'Lagos, NG', flag: 'NG', supply: 22000, demand: 85000, pricePerL: 0.0072, carbonValue: 0.0022, combinedValue: 0.0094 },
  { region: 'Dubai, UAE', flag: 'AE', supply: 95000, demand: 140000, pricePerL: 0.0065, carbonValue: 0.0014, combinedValue: 0.0079 },
];

const PRODUCTION_FEED: ProductionEvent[] = [
  { id: 'p1', source: 'AWG-Maui-07', volume: '500L', energy: 'Solar', carbonPrevented: '1.8kg CO\u2082', waterValue: '$1.90', carbonVal: '$0.45', energyIcon: Sun, energyColor: 'text-amber-400' },
  { id: 'p2', source: 'AWG-Austin-12', volume: '1,200L', energy: 'Grid+Solar', carbonPrevented: '3.2kg CO\u2082', waterValue: '$3.84', carbonVal: '$0.80', energyIcon: Zap, energyColor: 'text-sky-400' },
  { id: 'p3', source: 'AWG-Phoenix-03', volume: '800L', energy: 'Solar', carbonPrevented: '2.9kg CO\u2082', waterValue: '$4.64', carbonVal: '$1.16', energyIcon: Sun, energyColor: 'text-amber-400' },
  { id: 'p4', source: 'AWG-Dubai-15', volume: '2,100L', energy: 'Solar+Wind', carbonPrevented: '6.4kg CO\u2082', waterValue: '$13.65', carbonVal: '$2.94', energyIcon: Sun, energyColor: 'text-amber-400' },
  { id: 'p5', source: 'AWG-Lagos-02', volume: '350L', energy: 'Grid', carbonPrevented: '0.6kg CO\u2082', waterValue: '$2.52', carbonVal: '$0.77', energyIcon: Zap, energyColor: 'text-sky-400' },
  { id: 'p6', source: 'AWG-SanJuan-09', volume: '620L', energy: 'Solar', carbonPrevented: '2.1kg CO\u2082', waterValue: '$3.16', carbonVal: '$1.12', energyIcon: Sun, energyColor: 'text-amber-400' },
  { id: 'p7', source: 'AWG-Austin-08', volume: '950L', energy: 'Grid+Solar', carbonPrevented: '2.5kg CO\u2082', waterValue: '$3.04', carbonVal: '$0.63', energyIcon: Zap, energyColor: 'text-sky-400' },
  { id: 'p8', source: 'AWG-Maui-11', volume: '780L', energy: 'Solar', carbonPrevented: '2.8kg CO\u2082', waterValue: '$2.96', carbonVal: '$0.70', energyIcon: Sun, energyColor: 'text-amber-400' },
];

const TOKEN_OPTIONS: TokenOption[] = [
  {
    title: 'Separate Tokens',
    symbols: 'WTR = water commodity, CARB = carbon credit',
    pros: ['Clear separation of concerns', 'Regulatory clarity per asset class'],
    cons: ['Complex for end users', 'Fragmented liquidity across markets'],
    grade: 'B',
    gradeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  },
  {
    title: 'Dual-Purpose WTR',
    recommended: true,
    symbols: 'WTR contains water quantity + carbon offset metadata',
    pros: ['Simple UX, single asset captures both values', 'XRPL MPT compatible'],
    cons: ['Metadata complexity', 'Harder to trade carbon independently'],
    grade: 'A',
    gradeColor: 'text-[#25D695] bg-[#25D695]/10 border-[#25D695]/30',
  },
  {
    title: 'Base Token + Receipt Overlays',
    symbols: 'WTR = base unit, receipts attach carbon/logistics data',
    pros: ['Most flexible, future-proof', 'Enterprise compatible'],
    cons: ['More infrastructure needed', 'Higher initial development cost'],
    grade: 'A-',
    gradeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  },
];

const LOGISTICS: LogisticsEvent[] = [
  { id: 'l1', origin: 'AWG Station Maui', destination: 'Resort Water Storage', distance: '5 mi', transport: 'Electric Truck', costPerL: '$0.001/L', carbonAdded: '+0.2kg CO\u2082', carbonNet: '-1.6kg CO\u2082', status: 'delivered' },
  { id: 'l2', origin: 'AWG Hub Austin', destination: 'Municipal Reserve Tank', distance: '12 mi', transport: 'Pipeline', costPerL: '$0.0004/L', carbonAdded: '+0.1kg CO\u2082', carbonNet: '-3.1kg CO\u2082', status: 'delivered' },
  { id: 'l3', origin: 'AWG Station Phoenix', destination: 'Hospital Supply', distance: '8 mi', transport: 'Electric Truck', costPerL: '$0.0008/L', carbonAdded: '+0.15kg CO\u2082', carbonNet: '-2.75kg CO\u2082', status: 'in-transit' },
  { id: 'l4', origin: 'AWG Cluster Dubai', destination: 'Commercial Complex', distance: '3 mi', transport: 'Pipeline', costPerL: '$0.0003/L', carbonAdded: '+0.05kg CO\u2082', carbonNet: '-6.35kg CO\u2082', status: 'delivered' },
  { id: 'l5', origin: 'AWG Station Lagos', destination: 'Community Water Point', distance: '2 mi', transport: 'Electric Van', costPerL: '$0.0006/L', carbonAdded: '+0.08kg CO\u2082', carbonNet: '-0.52kg CO\u2082', status: 'pending' },
];

const AGENT_EVENTS: AgentEvent[] = [
  { id: 'a1', agent: 'LiquidityBot', action: 'Matched surplus from Austin to Phoenix buyer | 15,000L | $48.00', color: 'text-[#25D695]' },
  { id: 'a2', agent: 'CarbonPricer', action: 'Calculated premium: +$0.0012/L for solar-powered AWG water', color: 'text-amber-400' },
  { id: 'a3', agent: 'DemandForecaster', action: 'Phoenix demand spike expected +40% (heat wave incoming)', color: 'text-rose-400' },
  { id: 'a4', agent: 'LogisticsRouter', action: 'Rerouted delivery to avoid congestion, saved 12kg CO\u2082', color: 'text-sky-400' },
  { id: 'a5', agent: 'PriceOptimizer', action: 'Adjusted Lagos pricing -8% to increase accessibility', color: 'text-purple-400' },
  { id: 'a6', agent: 'ComplianceAgent', action: 'Verified carbon offset certificates for Dubai cluster', color: 'text-teal-400' },
];

const MARKET_SIGNALS: MarketSignal[] = [
  {
    title: 'Drought Alert: Phoenix',
    body: 'Demand +40%, price trending up. Heat wave expected next 72 hours.',
    type: 'alert',
    icon: AlertTriangle,
    color: 'text-rose-400',
    borderColor: 'border-rose-400/20',
    bgColor: 'bg-rose-400/5',
  },
  {
    title: 'Surplus: Austin Network',
    body: '25,000L excess capacity available for spot market.',
    type: 'surplus',
    icon: TrendingUp,
    color: 'text-[#25D695]',
    borderColor: 'border-[#25D695]/20',
    bgColor: 'bg-[#25D695]/5',
  },
  {
    title: 'Carbon Premium Rising',
    body: 'Solar-powered water +18% carbon value this week.',
    type: 'premium',
    icon: Leaf,
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    bgColor: 'bg-amber-400/5',
  },
  {
    title: 'New Buyer: Lagos NGO',
    body: '50,000L/week contract pending approval.',
    type: 'opportunity',
    icon: Globe,
    color: 'text-sky-400',
    borderColor: 'border-sky-400/20',
    bgColor: 'bg-sky-400/5',
  },
];

// ─── Helpers ───────────────────────────────────────────────

function supplyDemandColor(supply: number, demand: number): string {
  const ratio = supply / demand;
  if (ratio >= 1.1) return 'text-[#25D695]'; // surplus
  if (ratio >= 0.85) return 'text-amber-400'; // balanced
  return 'text-rose-400'; // deficit
}

function supplyDemandBg(supply: number, demand: number): string {
  const ratio = supply / demand;
  if (ratio >= 1.1) return 'bg-[#25D695]/8';
  if (ratio >= 0.85) return 'bg-amber-400/8';
  return 'bg-rose-400/8';
}

function supplyDemandLabel(supply: number, demand: number): string {
  const ratio = supply / demand;
  if (ratio >= 1.1) return 'SURPLUS';
  if (ratio >= 0.85) return 'BALANCED';
  return 'DEFICIT';
}

function statusIcon(status: string) {
  if (status === 'delivered') return <CheckCircle2 size={12} className="text-[#25D695]" />;
  if (status === 'in-transit') return <Truck size={12} className="text-amber-400" />;
  return <Clock size={12} className="text-gray-500" />;
}

function statusLabel(status: string) {
  if (status === 'delivered') return 'Delivered';
  if (status === 'in-transit') return 'In Transit';
  return 'Pending';
}

// ─── Section Header ────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em]">
        {children}
      </span>
      <div className="flex-1 h-px bg-[#1C2432]" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function WaterMarket() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Water & Environmental Market
          </h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider hidden sm:inline">
            // live water commodity + carbon offset simulation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)] animate-pulse" />
          <span className="text-[10px] text-[#475569] font-mono hidden sm:inline">LIVE</span>
        </div>
      </div>

      {/* ═══ A. KPI Bar ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#1C2432]/80 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}12` }}
                >
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider leading-tight">
                  {kpi.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  {kpi.value}
                </span>
                <span className={`text-[11px] font-mono ${kpi.deltaUp ? 'text-[#25D695]' : 'text-rose-400'}`}>
                  {kpi.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ B. Regional Pricing Table ════════════════════════ */}
      <div>
        <SectionHeader>Regional Water Pricing</SectionHeader>
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2.5 border-b border-[#1C2432] text-[9px] font-mono text-[#475569] uppercase tracking-wider">
            <span>Region</span>
            <span className="text-right">Supply (L/day)</span>
            <span className="text-right">Demand</span>
            <span className="text-right">Price/L</span>
            <span className="text-right">Carbon Value</span>
            <span className="text-right">Combined Value</span>
            <span className="text-right">Status</span>
          </div>
          {/* Rows */}
          {REGIONS.map((r) => (
            <div
              key={r.region}
              className={`grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 border-b border-[#1C2432]/60 last:border-b-0 hover:bg-[#0B0F14]/50 transition-colors ${supplyDemandBg(r.supply, r.demand)}`}
            >
              <div className="flex items-center gap-2">
                <CircleDot size={10} className={supplyDemandColor(r.supply, r.demand)} />
                <span className="text-sm text-white font-medium">{r.region}</span>
              </div>
              <span className="text-sm font-mono text-gray-300 text-right tabular-nums">
                {r.supply.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-gray-300 text-right tabular-nums hidden md:block">
                {r.demand.toLocaleString()}
              </span>
              <span className="text-sm font-mono text-white text-right tabular-nums hidden md:block">
                ${r.pricePerL.toFixed(4)}
              </span>
              <span className="text-sm font-mono text-[#A78BFA] text-right tabular-nums hidden md:block">
                ${r.carbonValue.toFixed(4)}
              </span>
              <span className="text-sm font-mono text-[#25D695] text-right tabular-nums hidden md:block">
                ${r.combinedValue.toFixed(4)}
              </span>
              <div className="hidden md:flex items-center justify-end gap-1.5">
                <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  supplyDemandLabel(r.supply, r.demand) === 'SURPLUS'
                    ? 'text-[#25D695] bg-[#25D695]/10 border-[#25D695]/30'
                    : supplyDemandLabel(r.supply, r.demand) === 'BALANCED'
                      ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                      : 'text-rose-400 bg-rose-400/10 border-rose-400/30'
                }`}>
                  {supplyDemandLabel(r.supply, r.demand)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ C. Water as Dual Asset Explainer ═════════════════ */}
      <div>
        <SectionHeader>Dual Asset Value</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Water Commodity */}
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
                <Droplets size={16} className="text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Water Commodity Value</h3>
                <p className="text-[10px] text-[#64748B] font-mono">Physical asset production & distribution</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Daily Production</span>
                <span className="font-mono text-white tabular-nums">847,200 L</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Avg Sale Price</span>
                <span className="font-mono text-white tabular-nums">$0.0038/L</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Daily Revenue</span>
                <span className="font-mono text-sky-400 tabular-nums">$3,219.36</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Active Transfers</span>
                <span className="font-mono text-white tabular-nums">342</span>
              </div>
            </div>
          </div>

          {/* Carbon Offset */}
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 flex items-center justify-center">
                <Leaf size={16} className="text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Carbon Offset Value</h3>
                <p className="text-[10px] text-[#64748B] font-mono">Emissions prevented & credits generated</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">CO&#8322; Prevented Today</span>
                <span className="font-mono text-white tabular-nums">2,847 kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Carbon Credit Price</span>
                <span className="font-mono text-white tabular-nums">$0.0014/L avg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Carbon Revenue</span>
                <span className="font-mono text-[#A78BFA] tabular-nums">$1,186.08</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748B]">Certificates Issued</span>
                <span className="font-mono text-white tabular-nums">89</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combined value banner */}
        <div className="mt-3 bg-[#111820] border border-[#25D695]/20 rounded-lg p-4 text-center">
          <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
            Combined Environmental Asset Value
          </span>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-sm font-mono text-sky-400">Water Market</span>
            <span className="text-[#475569]">+</span>
            <span className="text-sm font-mono text-[#A78BFA]">Carbon Premium</span>
            <span className="text-[#475569]">=</span>
            <span className="text-lg font-bold font-mono text-[#25D695] tabular-nums">$4,405.44/day</span>
          </div>
        </div>
      </div>

      {/* ═══ D. Live Production Feed ══════════════════════════ */}
      <div>
        <SectionHeader>Live Production Feed</SectionHeader>
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg divide-y divide-[#1C2432]/60">
          {PRODUCTION_FEED.map((evt) => {
            const EnergyIcon = evt.energyIcon;
            return (
              <div key={evt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0B0F14]/50 transition-colors">
                {/* Source */}
                <div className="flex items-center gap-2 min-w-0 w-36 shrink-0">
                  <Droplets size={12} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-mono text-white truncate">{evt.source}</span>
                </div>

                {/* Volume */}
                <span className="text-xs font-mono text-gray-300 tabular-nums w-16 text-right shrink-0 hidden sm:block">
                  {evt.volume}
                </span>

                {/* Energy */}
                <div className="flex items-center gap-1 w-24 shrink-0 hidden lg:flex">
                  <EnergyIcon size={11} className={evt.energyColor} />
                  <span className="text-[10px] font-mono text-[#64748B]">{evt.energy}</span>
                </div>

                {/* Carbon prevented */}
                <div className="flex items-center gap-1 w-28 shrink-0 hidden lg:flex">
                  <Leaf size={10} className="text-[#A78BFA]" />
                  <span className="text-[10px] font-mono text-[#A78BFA]">{evt.carbonPrevented}</span>
                </div>

                {/* Arrow */}
                <ArrowRight size={10} className="text-[#1C2432] shrink-0 hidden md:block" />

                {/* Values */}
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs font-mono text-sky-400 tabular-nums">{evt.waterValue}</span>
                  <span className="text-[#1C2432]">+</span>
                  <span className="text-xs font-mono text-[#A78BFA] tabular-nums">{evt.carbonVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ E. Token Architecture Explorer ═══════════════════ */}
      <div>
        <SectionHeader>Token Architecture Explorer</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TOKEN_OPTIONS.map((opt) => (
            <div
              key={opt.title}
              className={`bg-[#111820] rounded-lg p-4 transition-all ${
                opt.recommended
                  ? 'border-2 border-[#25D695]/40 shadow-[0_0_24px_rgba(37,214,149,0.06)]'
                  : 'border border-[#1C2432]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {opt.recommended && <Star size={12} className="text-[#25D695]" />}
                  <h3 className="text-sm font-semibold text-white">{opt.title}</h3>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${opt.gradeColor}`}>
                  {opt.grade}
                </span>
              </div>

              {opt.recommended && (
                <span className="inline-block text-[9px] font-mono uppercase tracking-widest text-[#25D695] bg-[#25D695]/10 px-2 py-0.5 rounded-full border border-[#25D695]/30 mb-3">
                  Recommended
                </span>
              )}

              {/* Description */}
              <p className="text-[11px] font-mono text-[#64748B] mb-3 leading-relaxed">{opt.symbols}</p>

              {/* Pros */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[9px] font-mono text-[#475569] uppercase tracking-wider">Pros</span>
                {opt.pros.map((pro) => (
                  <div key={pro} className="flex items-start gap-1.5">
                    <CheckCircle2 size={10} className="text-[#25D695] mt-0.5 shrink-0" />
                    <span className="text-[11px] text-gray-400">{pro}</span>
                  </div>
                ))}
              </div>

              {/* Cons */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-[#475569] uppercase tracking-wider">Cons</span>
                {opt.cons.map((con) => (
                  <div key={con} className="flex items-start gap-1.5">
                    <AlertTriangle size={10} className="text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-gray-400">{con}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ F. Logistics Flow Panel ══════════════════════════ */}
      <div>
        <SectionHeader>Logistics Flow</SectionHeader>
        <div className="space-y-2">
          {LOGISTICS.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#1C2432]/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-sky-400" />
                  <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
                    Logistics Event #{evt.id.replace('l', '2483')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(evt.status)}
                  <span className={`text-[10px] font-mono ${
                    evt.status === 'delivered' ? 'text-[#25D695]'
                      : evt.status === 'in-transit' ? 'text-amber-400'
                        : 'text-gray-500'
                  }`}>
                    {statusLabel(evt.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-white">{evt.origin}</span>
                <ArrowRight size={12} className="text-[#475569]" />
                <span className="text-sm text-white">{evt.destination}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#64748B]">
                <span>Distance: {evt.distance}</span>
                <span>Transport: {evt.transport}</span>
                <span>Cost: {evt.costPerL}</span>
                <span className="text-amber-400">Carbon: {evt.carbonAdded}</span>
                <span className="text-[#25D695]">Net: {evt.carbonNet}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ G. Agent Trading Activity ════════════════════════ */}
      <div>
        <SectionHeader>Agent Trading Activity</SectionHeader>
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg divide-y divide-[#1C2432]/60">
          {AGENT_EVENTS.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#0B0F14]/50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#1C2432] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className={evt.color} />
              </div>
              <div className="min-w-0">
                <span className={`text-xs font-mono font-semibold ${evt.color}`}>{evt.agent}</span>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{evt.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ H. Market Signals ════════════════════════════════ */}
      <div>
        <SectionHeader>Market Signals</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MARKET_SIGNALS.map((signal) => {
            const SigIcon = signal.icon;
            return (
              <div
                key={signal.title}
                className={`rounded-lg p-4 border ${signal.borderColor} ${signal.bgColor} hover:bg-opacity-80 transition-colors`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SigIcon size={14} className={signal.color} />
                  <h4 className={`text-sm font-semibold ${signal.color}`}>{signal.title}</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{signal.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1C2432]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#475569]">
          <Activity size={10} />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <span className="text-[10px] font-mono text-[#475569]">
          Water Market Simulation v1.0
        </span>
      </div>
    </div>
  );
}
