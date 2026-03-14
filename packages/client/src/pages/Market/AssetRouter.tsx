/**
 * AssetRouter — Environmental Asset Router
 * Core interface for allocating environmental asset outputs between
 * Logistics (commodity), Carbon Credit, and Mercy (humanitarian) modes.
 */
import { useState, useCallback } from 'react';
import {
  Droplets, Zap, Leaf, Heart, Brain, ArrowRight, Radio,
  Settings, Gauge, RefreshCw, Code, MapPin, Activity,
} from 'lucide-react';

// ─── Design Tokens ──────────────────────────────────────
const COLOR = {
  bg: '#0B0F14',
  card: '#111820',
  border: '#1C2432',
  primary: '#25D695',
  water: '#00b8f0',
  energy: '#f99d07',
  carbon: '#A78BFA',
  mercy: '#F472B6',
  muted: '#64748B',
  headerMuted: '#475569',
} as const;

// ─── Types ──────────────────────────────────────────────
interface AllocationState {
  logistics: number;
  carbon: number;
  mercy: number;
}

interface SummaryCard {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  color: string;
}

interface Suggestion {
  id: string;
  title: string;
  location: string;
  description: string;
  suggestedAction: string;
  icon: React.ReactNode;
  color: string;
}

interface AllocationEvent {
  id: string;
  deviceId: string;
  location: string;
  amount: string;
  unit: string;
  logistics: number;
  carbon: number;
  mercy: number;
  timeAgo: string;
  type: 'water' | 'energy';
}

// ─── Mock Data ──────────────────────────────────────────
const SUMMARY_CARDS: SummaryCard[] = [
  {
    label: 'Total Water Produced',
    value: '847,200 L/day',
    delta: '+12%',
    icon: <Droplets size={18} />,
    color: COLOR.water,
  },
  {
    label: 'Total Energy Generated',
    value: '2.4 MWh/day',
    delta: '+8%',
    icon: <Zap size={18} />,
    color: COLOR.energy,
  },
  {
    label: 'Carbon Prevented',
    value: '2,847 kg CO\u2082',
    delta: '+18%',
    icon: <Leaf size={18} />,
    color: COLOR.carbon,
  },
  {
    label: 'Active Nodes',
    value: '127',
    delta: '+5',
    icon: <Radio size={18} />,
    color: COLOR.primary,
  },
];

const AI_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-1',
    title: 'Water Shortage Detected',
    location: 'Phoenix, AZ',
    description: 'Regional demand up 34%. Municipal reserves at 62% capacity.',
    suggestedAction: 'Increase logistics to 80%',
    icon: <Droplets size={16} />,
    color: COLOR.water,
  },
  {
    id: 'sug-2',
    title: 'Carbon Price Spike',
    location: '+22% this week',
    description: 'EU ETS permits trading at \u20AC87/ton. Voluntary credits following.',
    suggestedAction: 'Shift 40% to carbon credits',
    icon: <Leaf size={16} />,
    color: COLOR.carbon,
  },
  {
    id: 'sug-3',
    title: 'Hurricane Alert',
    location: 'Caribbean',
    description: 'Category 3 hurricane approaching. 2.1M people in affected zone.',
    suggestedAction: 'Route 50% to mercy network',
    icon: <Heart size={16} />,
    color: COLOR.mercy,
  },
];

const RECENT_ALLOCATIONS: AllocationEvent[] = [
  { id: 'ra-1', deviceId: 'AWG-Node-118', location: 'Maui, HI', amount: '1,000', unit: 'L', logistics: 600, carbon: 200, mercy: 200, timeAgo: '2 min ago', type: 'water' },
  { id: 'ra-2', deviceId: 'SOL-Node-042', location: 'Tucson, AZ', amount: '340', unit: 'kWh', logistics: 170, carbon: 102, mercy: 68, timeAgo: '5 min ago', type: 'energy' },
  { id: 'ra-3', deviceId: 'AWG-Node-205', location: 'San Juan, PR', amount: '750', unit: 'L', logistics: 150, carbon: 75, mercy: 525, timeAgo: '8 min ago', type: 'water' },
  { id: 'ra-4', deviceId: 'SOL-Node-089', location: 'Phoenix, AZ', amount: '520', unit: 'kWh', logistics: 312, carbon: 156, mercy: 52, timeAgo: '12 min ago', type: 'energy' },
  { id: 'ra-5', deviceId: 'AWG-Node-071', location: 'Dubai, UAE', amount: '2,400', unit: 'L', logistics: 1920, carbon: 240, mercy: 240, timeAgo: '18 min ago', type: 'water' },
  { id: 'ra-6', deviceId: 'AWG-Node-334', location: 'Lima, Peru', amount: '600', unit: 'L', logistics: 300, carbon: 120, mercy: 180, timeAgo: '24 min ago', type: 'water' },
  { id: 'ra-7', deviceId: 'SOL-Node-117', location: 'Nairobi, KE', amount: '280', unit: 'kWh', logistics: 84, carbon: 140, mercy: 56, timeAgo: '31 min ago', type: 'energy' },
  { id: 'ra-8', deviceId: 'AWG-Node-092', location: 'Chennai, IN', amount: '1,800', unit: 'L', logistics: 900, carbon: 360, mercy: 540, timeAgo: '45 min ago', type: 'water' },
];

const XRPL_RECEIPT = {
  device: 'AWG-Node-118',
  location: 'Maui, HI',
  water_liters: 1000,
  carbon_prevented_kg: 2.5,
  allocation: {
    logistics: 600,
    carbon: 200,
    mercy: 200,
  },
  token_type: 'MPT',
  chain: 'XRPL',
};

// ─── Helpers ────────────────────────────────────────────
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function formatCurrency(val: number): string {
  return val < 1 ? `$${val.toFixed(4)}` : `$${val.toFixed(2)}`;
}

// ─── Sub-components ─────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: COLOR.headerMuted }}>
      {children}
    </h3>
  );
}

function StatCard({ card }: { card: SummaryCard }) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: COLOR.card, borderColor: COLOR.border }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${card.color}15` }}
        >
          <div style={{ color: card.color }}>{card.icon}</div>
        </div>
        <span
          className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full"
          style={{ background: `${card.color}15`, color: card.color }}
        >
          {card.delta}
        </span>
      </div>
      <div className="font-mono text-lg font-bold text-white">{card.value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: COLOR.muted }}>{card.label}</div>
    </div>
  );
}

function AllocationSlider({
  label,
  value,
  color,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  onChange: (val: number) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <span className="text-xs text-white font-medium">{label}</span>
        </div>
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, ${COLOR.border} ${value}%, ${COLOR.border} 100%)`,
          accentColor: color,
        }}
      />
    </div>
  );
}

function AllocationBar({ allocation, colors }: { allocation: AllocationState; colors: { logistics: string; carbon: string; mercy: string } }) {
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
      {allocation.logistics > 0 && (
        <div
          className="rounded-full transition-all duration-300"
          style={{ width: `${allocation.logistics}%`, background: colors.logistics }}
        />
      )}
      {allocation.carbon > 0 && (
        <div
          className="rounded-full transition-all duration-300"
          style={{ width: `${allocation.carbon}%`, background: colors.carbon }}
        />
      )}
      {allocation.mercy > 0 && (
        <div
          className="rounded-full transition-all duration-300"
          style={{ width: `${allocation.mercy}%`, background: colors.mercy }}
        />
      )}
    </div>
  );
}

function AllocationPanel({
  title,
  totalAmount,
  unit,
  allocation,
  setAllocation,
  logisticsLabel,
  logisticsColor,
  logisticsIcon,
  pricePerUnit,
  carbonConversion,
  carbonPriceTon,
  mercyLabel,
}: {
  title: string;
  totalAmount: number;
  unit: string;
  allocation: AllocationState;
  setAllocation: React.Dispatch<React.SetStateAction<AllocationState>>;
  logisticsLabel: string;
  logisticsColor: string;
  logisticsIcon: React.ReactNode;
  pricePerUnit: number;
  carbonConversion: number;
  carbonPriceTon: number;
  mercyLabel: string;
}) {
  const handleSliderChange = useCallback(
    (key: keyof AllocationState, newVal: number) => {
      setAllocation((prev) => {
        const clamped = clamp(newVal, 0, 100);
        const otherKeys = (['logistics', 'carbon', 'mercy'] as const).filter((k) => k !== key);
        const remaining = 100 - clamped;
        const otherSum = prev[otherKeys[0]] + prev[otherKeys[1]];

        if (otherSum === 0) {
          return {
            ...prev,
            [key]: clamped,
            [otherKeys[0]]: Math.round(remaining / 2),
            [otherKeys[1]]: remaining - Math.round(remaining / 2),
          };
        }

        const ratio0 = prev[otherKeys[0]] / otherSum;
        const newOther0 = Math.round(remaining * ratio0);
        const newOther1 = remaining - newOther0;

        const next: AllocationState = { logistics: 0, carbon: 0, mercy: 0 };
        next[key] = clamped;
        next[otherKeys[0]] = newOther0;
        next[otherKeys[1]] = newOther1;
        return next;
      });
    },
    [setAllocation],
  );

  const logisticsAmount = totalAmount * (allocation.logistics / 100);
  const carbonAmount = totalAmount * (allocation.carbon / 100);
  const mercyAmount = totalAmount * (allocation.mercy / 100);

  const logisticsRevenue = logisticsAmount * pricePerUnit;
  const carbonKg = carbonAmount * carbonConversion;
  const carbonRevenue = (carbonKg / 1000) * carbonPriceTon;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: COLOR.card, borderColor: COLOR.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: COLOR.muted }}>
            <span className="font-mono font-bold text-white">{totalAmount.toLocaleString()} {unit}</span> produced
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${logisticsColor}15` }}
        >
          <Settings size={14} style={{ color: logisticsColor }} />
        </div>
      </div>

      <AllocationSlider
        label={logisticsLabel}
        value={allocation.logistics}
        color={logisticsColor}
        icon={logisticsIcon}
        onChange={(v) => handleSliderChange('logistics', v)}
      />
      <AllocationSlider
        label="Carbon Credits"
        value={allocation.carbon}
        color={COLOR.carbon}
        icon={<Leaf size={14} />}
        onChange={(v) => handleSliderChange('carbon', v)}
      />
      <AllocationSlider
        label="Mercy Donation"
        value={allocation.mercy}
        color={COLOR.mercy}
        icon={<Heart size={14} />}
        onChange={(v) => handleSliderChange('mercy', v)}
      />

      <AllocationBar
        allocation={allocation}
        colors={{ logistics: logisticsColor, carbon: COLOR.carbon, mercy: COLOR.mercy }}
      />

      <div className="flex items-center justify-between mt-1.5 mb-4">
        <span className="text-[10px] font-mono" style={{ color: logisticsColor }}>
          {allocation.logistics}% {logisticsLabel.split(' ')[0]}
        </span>
        <span className="text-[10px] font-mono" style={{ color: COLOR.carbon }}>
          {allocation.carbon}% Carbon
        </span>
        <span className="text-[10px] font-mono" style={{ color: COLOR.mercy }}>
          {allocation.mercy}% Mercy
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div
          className="rounded-xl p-3 border flex items-center justify-between"
          style={{ background: `${logisticsColor}08`, borderColor: `${logisticsColor}20` }}
        >
          <div className="flex items-center gap-2">
            <div style={{ color: logisticsColor }}>{logisticsIcon}</div>
            <div>
              <div className="text-[10px]" style={{ color: COLOR.muted }}>{logisticsLabel}</div>
              <div className="text-xs font-mono text-white">
                {logisticsAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit} x {formatCurrency(pricePerUnit)}/{unit}
              </div>
            </div>
          </div>
          <div className="font-mono text-sm font-bold" style={{ color: logisticsColor }}>
            {formatCurrency(logisticsRevenue)}
          </div>
        </div>

        <div
          className="rounded-xl p-3 border flex items-center justify-between"
          style={{ background: `${COLOR.carbon}08`, borderColor: `${COLOR.carbon}20` }}
        >
          <div className="flex items-center gap-2">
            <Leaf size={14} style={{ color: COLOR.carbon }} />
            <div>
              <div className="text-[10px]" style={{ color: COLOR.muted }}>Carbon Credits</div>
              <div className="text-xs font-mono text-white">
                {carbonAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit} {'\u2192'} {carbonKg.toFixed(1)} kg CO{'\u2082'} x ${carbonPriceTon}/ton
              </div>
            </div>
          </div>
          <div className="font-mono text-sm font-bold" style={{ color: COLOR.carbon }}>
            {formatCurrency(carbonRevenue)}
          </div>
        </div>

        <div
          className="rounded-xl p-3 border flex items-center justify-between"
          style={{ background: `${COLOR.mercy}08`, borderColor: `${COLOR.mercy}20` }}
        >
          <div className="flex items-center gap-2">
            <Heart size={14} style={{ color: COLOR.mercy }} />
            <div>
              <div className="text-[10px]" style={{ color: COLOR.muted }}>{mercyLabel}</div>
              <div className="text-xs font-mono text-white">
                {mercyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {unit} {'\u2192'} humanitarian impact
              </div>
            </div>
          </div>
          <div className="font-mono text-xs font-medium" style={{ color: COLOR.mercy }}>
            Direct Aid
          </div>
        </div>
      </div>

      <button
        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ background: COLOR.primary }}
      >
        Confirm Allocation
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function AssetRouter() {
  const [waterAllocation, setWaterAllocation] = useState<AllocationState>({
    logistics: 60,
    carbon: 20,
    mercy: 20,
  });

  const [energyAllocation, setEnergyAllocation] = useState<AllocationState>({
    logistics: 50,
    carbon: 30,
    mercy: 20,
  });

  return (
    <div className="max-w-6xl mx-auto pb-20" style={{ color: 'white' }}>
      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${COLOR.primary}15` }}
          >
            <Gauge size={20} style={{ color: COLOR.primary }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Environmental Asset Router</h1>
            <p className="text-sm" style={{ color: COLOR.muted }}>
              Allocate infrastructure output across logistics, carbon, and humanitarian channels
            </p>
          </div>
        </div>
      </div>

      {/* ── Infrastructure Output Summary ───────────── */}
      <SectionHeader>Infrastructure Output Summary</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </div>

      {/* ── Asset Allocation Panels ─────────────────── */}
      <SectionHeader>Asset Allocation Control</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <AllocationPanel
          title="Water Output Allocation"
          totalAmount={1000}
          unit="L"
          allocation={waterAllocation}
          setAllocation={setWaterAllocation}
          logisticsLabel="Logistics Sale"
          logisticsColor={COLOR.water}
          logisticsIcon={<Droplets size={14} />}
          pricePerUnit={0.0038}
          carbonConversion={0.0025}
          carbonPriceTon={12.40}
          mercyLabel="Mercy Donation"
        />
        <AllocationPanel
          title="Energy Output Allocation"
          totalAmount={2400}
          unit="kWh"
          allocation={energyAllocation}
          setAllocation={setEnergyAllocation}
          logisticsLabel="Grid Sale"
          logisticsColor={COLOR.energy}
          logisticsIcon={<Zap size={14} />}
          pricePerUnit={0.087}
          carbonConversion={0.42}
          carbonPriceTon={12.40}
          mercyLabel="Mercy Donation"
        />
      </div>

      {/* ── Smart Allocation Suggestions ────────────── */}
      <SectionHeader>Smart Allocation Suggestions</SectionHeader>
      <div
        className="rounded-2xl p-5 border mb-8"
        style={{ background: COLOR.card, borderColor: COLOR.border }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${COLOR.carbon}15` }}
          >
            <Brain size={16} style={{ color: COLOR.carbon }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Optimization Engine</h3>
            <p className="text-[11px]" style={{ color: COLOR.muted }}>
              Real-time allocation recommendations based on market and impact signals
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLOR.primary }} />
            <span className="text-[10px] font-mono" style={{ color: COLOR.primary }}>LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AI_SUGGESTIONS.map((sug) => (
            <div
              key={sug.id}
              className="rounded-xl p-4 border transition-all hover:brightness-110"
              style={{ background: `${sug.color}06`, borderColor: `${sug.color}20` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${sug.color}18` }}
                >
                  {sug.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{sug.title}</div>
                  <div className="text-[10px] font-mono" style={{ color: sug.color }}>
                    {sug.location}
                  </div>
                </div>
              </div>
              <p className="text-[11px] mb-3" style={{ color: COLOR.muted }}>
                {sug.description}
              </p>
              <div
                className="text-[10px] font-mono font-medium mb-3 flex items-center gap-1"
                style={{ color: sug.color }}
              >
                <ArrowRight size={10} />
                Suggest: {sug.suggestedAction}
              </div>
              <button
                className="w-full py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:brightness-125"
                style={{
                  borderColor: `${sug.color}40`,
                  color: sug.color,
                  background: `${sug.color}10`,
                }}
              >
                Apply Suggestion
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Allocations ──────────────────────── */}
      <SectionHeader>Recent Allocations</SectionHeader>
      <div
        className="rounded-2xl border overflow-hidden mb-8"
        style={{ background: COLOR.card, borderColor: COLOR.border }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: COLOR.border }}>
          <div className="flex items-center gap-2">
            <Activity size={14} style={{ color: COLOR.primary }} />
            <span className="text-xs font-semibold text-white">Live Feed</span>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-mono" style={{ color: COLOR.muted }}>
            <RefreshCw size={10} />
            Auto-refresh
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: COLOR.border }}>
          {RECENT_ALLOCATIONS.map((event) => {
            const typeColor = event.type === 'water' ? COLOR.water : COLOR.energy;
            const TypeIcon = event.type === 'water' ? Droplets : Zap;
            const total = event.logistics + event.carbon + event.mercy;
            return (
              <div
                key={event.id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                style={{ borderColor: COLOR.border }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${typeColor}12` }}
                >
                  <TypeIcon size={14} style={{ color: typeColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-white">{event.deviceId}</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: COLOR.muted }}>
                      <MapPin size={8} />
                      {event.location}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: COLOR.muted }}>
                    {event.amount}{event.unit} {'\u2192'}{' '}
                    <span style={{ color: event.type === 'water' ? COLOR.water : COLOR.energy }}>
                      {event.logistics}{event.unit} logistics
                    </span>
                    {' / '}
                    <span style={{ color: COLOR.carbon }}>
                      {event.carbon}{event.unit} carbon
                    </span>
                    {' / '}
                    <span style={{ color: COLOR.mercy }}>
                      {event.mercy}{event.unit} mercy
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="flex h-1.5 w-16 rounded-full overflow-hidden gap-px">
                    <div
                      className="rounded-full"
                      style={{ width: `${(event.logistics / total) * 100}%`, background: typeColor }}
                    />
                    <div
                      className="rounded-full"
                      style={{ width: `${(event.carbon / total) * 100}%`, background: COLOR.carbon }}
                    />
                    <div
                      className="rounded-full"
                      style={{ width: `${(event.mercy / total) * 100}%`, background: COLOR.mercy }}
                    />
                  </div>
                  <span className="text-[10px] font-mono whitespace-nowrap" style={{ color: COLOR.muted }}>
                    {event.timeAgo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── XRPL Receipt Schema ────────────────────── */}
      <SectionHeader>XRPL Receipt Schema</SectionHeader>
      <div
        className="rounded-2xl p-5 border"
        style={{ background: COLOR.card, borderColor: COLOR.border }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${COLOR.primary}15` }}
          >
            <Code size={14} style={{ color: COLOR.primary }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mint Receipt Structure</h3>
            <p className="text-[11px]" style={{ color: COLOR.muted }}>
              XRPL Multi-Purpose Token schema for each allocation event
            </p>
          </div>
        </div>
        <div
          className="rounded-xl p-4 border font-mono text-xs leading-6 overflow-x-auto"
          style={{ background: COLOR.bg, borderColor: COLOR.border }}
        >
          <span style={{ color: COLOR.muted }}>{'{'}</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"device"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.primary }}>"{XRPL_RECEIPT.device}"</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"location"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.primary }}>"{XRPL_RECEIPT.location}"</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"water_liters"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.water }}>{XRPL_RECEIPT.water_liters}</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"carbon_prevented_kg"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.water }}>{XRPL_RECEIPT.carbon_prevented_kg}</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"allocation"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.muted }}>{'{'}</span>{'\n'}
          {'    '}<span style={{ color: COLOR.carbon }}>"logistics"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.water }}>{XRPL_RECEIPT.allocation.logistics}</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'    '}<span style={{ color: COLOR.carbon }}>"carbon"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.water }}>{XRPL_RECEIPT.allocation.carbon}</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'    '}<span style={{ color: COLOR.carbon }}>"mercy"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.water }}>{XRPL_RECEIPT.allocation.mercy}</span>{'\n'}
          {'  '}<span style={{ color: COLOR.muted }}>{'}'}</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"token_type"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.primary }}>"{XRPL_RECEIPT.token_type}"</span><span style={{ color: COLOR.muted }}>,</span>{'\n'}
          {'  '}<span style={{ color: COLOR.carbon }}>"chain"</span><span style={{ color: COLOR.muted }}>:</span> <span style={{ color: COLOR.primary }}>"{XRPL_RECEIPT.chain}"</span>{'\n'}
          <span style={{ color: COLOR.muted }}>{'}'}</span>
        </div>
      </div>
    </div>
  );
}
