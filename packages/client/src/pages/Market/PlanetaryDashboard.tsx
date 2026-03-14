/**
 * PlanetaryDashboard — Live Planetary Dashboard.
 * Animated real-time view of global infrastructure output.
 * The operating system for Earth.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Droplets,
  Zap,
  Leaf,
  Heart,
  Radio,
  Activity,
  MapPin,
  Wifi,
  Share2,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

type EventType = 'water' | 'energy' | 'carbon' | 'mercy';

interface FeedEvent {
  id: string;
  type: EventType;
  message: string;
  location: string;
  timeAgo: string;
  createdAt: number;
}

interface InfraNode {
  id: string;
  location: string;
  type: string;
  status: 'Online' | 'Maintenance';
  dailyOutput: string;
  dailyUnit: string;
  lifetimeOutput: string;
  lifetimeUnit: string;
}

interface MercyTransfer {
  from: string;
  to: string;
  amount: string;
  type: string;
}

// ─── Constants ──────────────────────────────────────────

const EVENT_COLORS: Record<EventType, string> = {
  water: '#00b8f0',
  energy: '#f99d07',
  carbon: '#A78BFA',
  mercy: '#F472B6',
};

const EVENT_ICONS: Record<EventType, typeof Droplets> = {
  water: Droplets,
  energy: Zap,
  carbon: Leaf,
  mercy: Heart,
};

const NODES: InfraNode[] = [
  { id: 'AWG-118', location: 'Maui, HI', type: 'AWG', status: 'Online', dailyOutput: '1,200', dailyUnit: 'L/day', lifetimeOutput: '284,400', lifetimeUnit: 'L' },
  { id: 'SOL-042', location: 'Austin, TX', type: 'Solar', status: 'Online', dailyOutput: '48', dailyUnit: 'kWh/day', lifetimeOutput: '12,480', lifetimeUnit: 'kWh' },
  { id: 'AWG-073', location: 'Phoenix, AZ', type: 'AWG', status: 'Online', dailyOutput: '1,800', dailyUnit: 'L/day', lifetimeOutput: '412,200', lifetimeUnit: 'L' },
  { id: 'GRW-015', location: 'San Juan, PR', type: 'Greywater', status: 'Online', dailyOutput: '900', dailyUnit: 'L/day', lifetimeOutput: '198,000', lifetimeUnit: 'L' },
  { id: 'AWG-134', location: 'Flint, MI', type: 'AWG', status: 'Online', dailyOutput: '2,400', dailyUnit: 'L/day', lifetimeOutput: '576,000', lifetimeUnit: 'L' },
  { id: 'SOL-091', location: 'Denver, CO', type: 'Solar', status: 'Online', dailyOutput: '62', dailyUnit: 'kWh/day', lifetimeOutput: '15,500', lifetimeUnit: 'kWh' },
  { id: 'RNW-008', location: 'Miami, FL', type: 'Rainwater', status: 'Online', dailyOutput: '3,200', dailyUnit: 'L/day', lifetimeOutput: '640,000', lifetimeUnit: 'L' },
  { id: 'AWG-156', location: 'Portland, OR', type: 'AWG', status: 'Online', dailyOutput: '1,100', dailyUnit: 'L/day', lifetimeOutput: '253,000', lifetimeUnit: 'L' },
];

const MERCY_TRANSFERS: MercyTransfer[] = [
  { from: 'Maui, HI', to: 'Haiti', amount: '500L water', type: 'water' },
  { from: 'Austin, TX', to: 'Puerto Rico', amount: '200 kWh', type: 'energy' },
  { from: 'Phoenix, AZ', to: 'Flint, MI', amount: '1,000L water', type: 'water' },
  { from: 'Denver, CO', to: 'Kenya', amount: '150 kWh', type: 'energy' },
];

const LOCATIONS = ['Maui, HI', 'Austin, TX', 'Phoenix, AZ', 'San Juan, PR', 'Flint, MI', 'Denver, CO', 'Miami, FL', 'Portland, OR'];
const NODE_IDS_WATER = ['AWG-Node-118', 'AWG-Node-073', 'AWG-Node-134', 'AWG-Node-156', 'GRW-Node-015', 'RNW-Node-008'];
const NODE_IDS_SOLAR = ['SOL-Node-042', 'SOL-Node-091', 'SOL-Node-027'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// ─── Section Header ─────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] mb-3">
      {children}
    </h2>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function PlanetaryDashboard() {
  // ── Counters ──
  const [waterTotal, setWaterTotal] = useState(2_847_200);
  const [energyTotal, setEnergyTotal] = useState(1204.8);
  const [carbonTotal, setCarbonTotal] = useState(127_400);
  const [mercyTotal, setMercyTotal] = useState(847_200);

  // ── Rates (for "per second" display) ──
  const [waterRate, setWaterRate] = useState(28);
  const [energyRate, setEnergyRate] = useState(0.04);
  const [carbonRate, setCarbonRate] = useState(0.7);
  const [mercyRate, setMercyRate] = useState(12);

  // ── Glow pulse tracking ──
  const [glowStates, setGlowStates] = useState({ water: false, energy: false, carbon: false, mercy: false });

  // ── Activity Feed ──
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const feedIdCounter = useRef(0);

  // ── Sync timer ──
  const [lastSync, setLastSync] = useState(0);

  // Generate a random feed event
  const generateEvent = useCallback((): FeedEvent => {
    feedIdCounter.current += 1;
    const types: EventType[] = ['water', 'energy', 'carbon', 'mercy'];
    const type = types[randomInt(0, 3)];
    const location = LOCATIONS[randomInt(0, LOCATIONS.length - 1)];

    let message = '';
    switch (type) {
      case 'water': {
        const nodeId = NODE_IDS_WATER[randomInt(0, NODE_IDS_WATER.length - 1)];
        const amount = randomInt(18, 120);
        message = `${nodeId} produced ${amount}L of water`;
        break;
      }
      case 'energy': {
        const nodeId = NODE_IDS_SOLAR[randomInt(0, NODE_IDS_SOLAR.length - 1)];
        const amount = randomFloat(0.4, 3.8, 1);
        message = `Solar array generated ${amount} kWh`;
        break;
      }
      case 'carbon': {
        const amount = randomInt(4, 45);
        message = `${amount} kg CO\u2082 prevented`;
        break;
      }
      case 'mercy': {
        const destinations = ['Haiti', 'Puerto Rico', 'Flint, MI', 'Kenya', 'San Juan, PR'];
        const dest = destinations[randomInt(0, destinations.length - 1)];
        const amount = randomInt(50, 800);
        const nodeId = NODE_IDS_WATER[randomInt(0, NODE_IDS_WATER.length - 1)];
        message = `${amount}L mercy water delivered to ${dest} via ${nodeId}`;
        break;
      }
    }

    return {
      id: `evt-${feedIdCounter.current}`,
      type,
      message,
      location,
      timeAgo: 'just now',
      createdAt: Date.now(),
    };
  }, []);

  // ── Counter increment interval ──
  useEffect(() => {
    const interval = setInterval(() => {
      const wInc = randomInt(12, 47);
      const eInc = randomFloat(0.02, 0.08, 2);
      const cInc = randomFloat(0.3, 1.2, 1);
      const mInc = randomInt(5, 22);

      setWaterTotal((prev) => prev + wInc);
      setEnergyTotal((prev) => parseFloat((prev + eInc).toFixed(1)));
      setCarbonTotal((prev) => parseFloat((prev + cInc).toFixed(0)));
      setMercyTotal((prev) => prev + mInc);

      setWaterRate(wInc);
      setEnergyRate(eInc);
      setCarbonRate(cInc);
      setMercyRate(mInc);

      // Trigger glow
      setGlowStates({ water: true, energy: true, carbon: true, mercy: true });
      setTimeout(() => {
        setGlowStates({ water: false, energy: false, carbon: false, mercy: false });
      }, 600);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // ── Feed event generation interval ──
  useEffect(() => {
    // Seed initial events
    const initial: FeedEvent[] = [];
    for (let i = 0; i < 8; i++) {
      const evt = generateEvent();
      evt.createdAt = Date.now() - (8 - i) * 4000;
      initial.push(evt);
    }
    setFeedEvents(initial);

    const interval = setInterval(() => {
      setFeedEvents((prev) => {
        const newEvent = generateEvent();
        const updated = [newEvent, ...prev];
        return updated.slice(0, 20);
      });
    }, randomInt(3000, 5000));

    return () => clearInterval(interval);
  }, [generateEvent]);

  // ── Last sync timer ──
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync((prev) => (prev >= 10 ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ── Compute relative time for feed events ──
  const getRelativeTime = (createdAt: number): string => {
    const diff = Math.floor((Date.now() - createdAt) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const shareText = `\uD83C\uDF0D NexusOS Planetary Dashboard\n\n\uD83C\uDF0A ${formatLargeNumber(waterTotal)} L water produced\n\u26A1 ${energyTotal.toFixed(1)} MWh generated\n\uD83C\uDF31 ${formatLargeNumber(carbonTotal)} kg CO\u2082 prevented\n\uD83D\uDC97 ${formatLargeNumber(mercyTotal)} L mercy water delivered\n\nThe operating system for Earth infrastructure.\nnexus-os-sable.vercel.app`;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ═══ 1. Page Header ═══ */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#25D695]/10 flex items-center justify-center flex-shrink-0">
            <Globe size={20} className="text-[#25D695]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Planetary Dashboard
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D695]/10 border border-[#25D695]/20">
                <div className="w-2 h-2 rounded-full bg-[#25D695] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#25D695] uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
            <p className="text-sm text-[#64748B] mt-1 max-w-xl">
              Real-time global infrastructure output
            </p>
          </div>
        </div>

        {/* ═══ 2. Live Animated Counters ═══ */}
        <div>
          <SectionHeader>Live Infrastructure Output</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Water */}
            <CounterCard
              icon={<Droplets size={20} className="text-[#00b8f0]" />}
              label="Total Water Produced"
              value={waterTotal.toLocaleString()}
              unit="L"
              rate={`+${waterRate} L/tick`}
              color="#00b8f0"
              glowing={glowStates.water}
            />
            {/* Energy */}
            <CounterCard
              icon={<Zap size={20} className="text-[#f99d07]" />}
              label="Total Energy Generated"
              value={energyTotal.toFixed(1)}
              unit="MWh"
              rate={`+${energyRate} MWh/tick`}
              color="#f99d07"
              glowing={glowStates.energy}
            />
            {/* Carbon */}
            <CounterCard
              icon={<Leaf size={20} className="text-[#A78BFA]" />}
              label="Carbon Prevented"
              value={carbonTotal.toLocaleString()}
              unit="kg"
              rate={`+${carbonRate} kg/tick`}
              color="#A78BFA"
              glowing={glowStates.carbon}
            />
            {/* Mercy */}
            <CounterCard
              icon={<Heart size={20} className="text-[#F472B6]" />}
              label="Mercy Water Delivered"
              value={mercyTotal.toLocaleString()}
              unit="L"
              rate={`+${mercyRate} L/tick`}
              color="#F472B6"
              glowing={glowStates.mercy}
            />
          </div>
        </div>

        {/* ═══ 3. Global Activity Feed ═══ */}
        <div>
          <SectionHeader>Global Activity Feed</SectionHeader>
          <div className="bg-[#111820] border border-[#1C2432] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1C2432]">
              <Activity size={14} className="text-[#25D695]" />
              <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
                Live Events
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25D695] animate-pulse" />
                <span className="text-[10px] font-mono text-[#64748B]">
                  {feedEvents.length} events
                </span>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.03]">
              {feedEvents.map((evt) => {
                const Icon = EVENT_ICONS[evt.type];
                const color = EVENT_COLORS[evt.type];
                return (
                  <div
                    key={evt.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all animate-[fadeIn_0.3s_ease-in-out]"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-white/90">{evt.message}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
                        <MapPin size={9} className="text-[#475569]" />
                        {evt.location}
                      </span>
                      <span className="text-[10px] text-[#475569] font-mono">
                        {getRelativeTime(evt.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ 4. Infrastructure Network ═══ */}
        <div>
          <SectionHeader>Infrastructure Network</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NODES.map((node) => {
              const typeColors: Record<string, string> = {
                AWG: '#00b8f0',
                Solar: '#f99d07',
                Greywater: '#25D695',
                Rainwater: '#A78BFA',
              };
              const color = typeColors[node.type] ?? '#64748B';
              const TypeIcon = node.type === 'Solar' ? Zap : node.type === 'Greywater' ? RefreshCw : node.type === 'Rainwater' ? Activity : Droplets;

              return (
                <div
                  key={node.id}
                  className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <TypeIcon size={13} style={{ color }} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-semibold text-white">{node.id}</div>
                        <div className="text-[10px] text-[#64748B]">{node.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#25D695] animate-pulse" />
                      <span className="text-[9px] font-semibold text-[#25D695] uppercase tracking-wider">
                        {node.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin size={10} className="text-[#475569]" />
                    <span className="text-[10px] text-[#64748B]">{node.location}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider mb-0.5">Daily</div>
                      <div className="text-xs font-mono text-white tabular-nums">
                        {node.dailyOutput} <span className="text-[9px] text-[#64748B]">{node.dailyUnit}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider mb-0.5">Lifetime</div>
                      <div className="text-xs font-mono text-white tabular-nums">
                        {node.lifetimeOutput} <span className="text-[9px] text-[#64748B]">{node.lifetimeUnit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 5. Network Health ═══ */}
        <div>
          <SectionHeader>Network Health</SectionHeader>
          <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#25D695]/10 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-[#25D695]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider">Uptime</div>
                  <div className="text-lg font-mono font-semibold text-white tabular-nums">99.7%</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00b8f0]/10 flex items-center justify-center">
                  <Radio size={16} className="text-[#00b8f0]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider">Active Nodes</div>
                  <div className="text-lg font-mono font-semibold text-white tabular-nums">
                    127 <span className="text-xs text-[#64748B]">/ 134</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f99d07]/10 flex items-center justify-center">
                  <Clock size={16} className="text-[#f99d07]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider">Data Freshness</div>
                  <div className="text-sm font-mono text-white">
                    Last sync: <span className="text-[#25D695] tabular-nums">{lastSync}s ago</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center">
                  <Wifi size={16} className="text-[#A78BFA]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider">Throughput</div>
                  <div className="text-sm font-mono text-white tabular-nums">1.2 Gbps</div>
                </div>
              </div>
            </div>

            {/* Network throughput bar */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#475569] uppercase tracking-wider">Network Throughput</span>
                <span className="text-[10px] font-mono text-[#25D695]">94.8%</span>
              </div>
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#25D695] to-[#00b8f0] transition-all"
                  style={{ width: '94.8%', boxShadow: '0 0 12px rgba(37, 214, 149, 0.3)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 6. Mercy Transfer Visualization ═══ */}
        <div>
          <SectionHeader>Mercy Transfer Visualization</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MERCY_TRANSFERS.map((transfer, i) => {
              const isWater = transfer.type === 'water';
              const color = isWater ? '#00b8f0' : '#f99d07';
              const Icon = isWater ? Droplets : Zap;
              return (
                <div
                  key={i}
                  className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 relative overflow-hidden"
                >
                  {/* Animated pulse background */}
                  <div
                    className="absolute inset-0 opacity-[0.03] animate-[pulse_3s_ease-in-out_infinite]"
                    style={{ backgroundColor: color }}
                  />

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon size={13} style={{ color }} />
                        </div>
                        <span className="text-xs font-semibold text-white">{transfer.amount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} className="text-[#475569]" />
                          <span className="text-xs font-mono text-white/80">{transfer.from}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-px bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${color}, ${color}00)` }} />
                          <ArrowRight size={12} style={{ color }} className="animate-[pulse_2s_ease-in-out_infinite]" />
                          <div className="w-6 h-px bg-gradient-to-l" style={{ backgroundImage: `linear-gradient(to left, ${color}, ${color}00)` }} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={10} style={{ color }} />
                          <span className="text-xs font-mono font-semibold" style={{ color }}>{transfer.to}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ 7. Share Button ═══ */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigator.clipboard.writeText(shareText)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#111820] border border-[#1C2432] hover:border-[#25D695]/30 hover:bg-[#25D695]/[0.03] transition-all group"
          >
            <Share2 size={18} className="text-[#25D695] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-white group-hover:text-[#25D695] transition-colors">
              Share Planetary Stats on X
            </span>
          </button>
        </div>

      </div>

      {/* ── Global CSS for fade-in animation ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────

function CounterCard({
  icon,
  label,
  value,
  unit,
  rate,
  color,
  glowing,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  rate: string;
  color: string;
  glowing: boolean;
}) {
  return (
    <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-5 relative overflow-hidden">
      {/* Glow overlay */}
      {glowing && (
        <div
          className="absolute inset-0 opacity-[0.04] transition-opacity duration-600"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold leading-tight">
            {label}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl sm:text-3xl font-bold font-mono tabular-nums transition-all duration-300"
            style={{
              color,
              textShadow: glowing ? `0 0 20px ${color}40` : 'none',
            }}
          >
            {value}
          </span>
          <span className="text-xs font-mono text-[#64748B]">{unit}</span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Activity size={10} className="text-[#475569]" />
          <span className="text-[10px] font-mono text-[#64748B]">{rate}</span>
        </div>
      </div>
    </div>
  );
}
