import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Shield, Clock, Zap, Flame, Droplets, Wind, Sun, Moon, Snowflake,
  Lock, Users, ChevronRight, Timer, AlertTriangle, Bot,
} from 'lucide-react';
import { TerminalCard } from '@/components/terminal';

/* ================================================================== */
/*  CONSTANTS & MOCK DATA                                              */
/* ================================================================== */

const PHASE_1_START = new Date('2026-04-01T00:00:00Z').getTime();

/* ─── Mint Phases ─────────────────────────────────────────────────── */

interface MintPhase {
  id: number;
  name: string;
  description: string;
  allocation: number;
  minted: number;
  price: number;
  maxPerWallet: number;
  bonus: string | null;
  status: 'upcoming' | 'active' | 'sold_out';
}

const MINT_PHASES: MintPhase[] = [
  {
    id: 1,
    name: 'Source Node Allowlist',
    description: 'Early access for verified Source Node operators and allowlisted wallets.',
    allocation: 2_000,
    minted: 0,
    price: 150,
    maxPerWallet: 3,
    bonus: 'Legendary holders: FREE MINT',
    status: 'upcoming',
  },
  {
    id: 2,
    name: 'DAO Member',
    description: 'Exclusive allocation for active DAO governance participants.',
    allocation: 1_555,
    minted: 0,
    price: 200,
    maxPerWallet: 2,
    bonus: null,
    status: 'upcoming',
  },
  {
    id: 3,
    name: 'Public Mint',
    description: 'Open mint for all connected wallets. First come, first served.',
    allocation: 2_000,
    minted: 0,
    price: 250,
    maxPerWallet: 5,
    bonus: null,
    status: 'upcoming',
  },
];

/* ─── Rarity Distribution ─────────────────────────────────────────── */

interface RarityTier {
  name: string;
  percentage: number;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  barGradient: string;
  glow: boolean;
  multiplier: string;
  evolutionCeiling: string;
}

const RARITY_TIERS: RarityTier[] = [
  {
    name: 'Common',
    percentage: 60,
    count: 3_333,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/15',
    borderColor: 'border-gray-500/30',
    barGradient: 'from-gray-600 to-gray-500',
    glow: false,
    multiplier: '1.0x',
    evolutionCeiling: 'Guardian',
  },
  {
    name: 'Rare',
    percentage: 25,
    count: 1_388,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    barGradient: 'from-blue-600 to-blue-400',
    glow: false,
    multiplier: '1.5x',
    evolutionCeiling: 'Ascended',
  },
  {
    name: 'Epic',
    percentage: 10,
    count: 555,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    barGradient: 'from-purple-600 to-purple-400',
    glow: false,
    multiplier: '2.0x',
    evolutionCeiling: 'Ascended',
  },
  {
    name: 'Mythic',
    percentage: 4,
    count: 222,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    barGradient: 'from-amber-500 to-yellow-400',
    glow: false,
    multiplier: '3.0x',
    evolutionCeiling: 'Legendary',
  },
  {
    name: 'Primal',
    percentage: 1,
    count: 56,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/40',
    barGradient: 'from-red-600 to-red-400',
    glow: true,
    multiplier: '5.0x',
    evolutionCeiling: 'Legendary+',
  },
];

/* ─── Element Types ───────────────────────────────────────────────── */

interface ElementType {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.FC<{ size?: number; className?: string }>;
  traits: [string, string, string];
}

const ELEMENT_TYPES: ElementType[] = [
  { name: 'Aqua',   color: 'text-blue-400',    bgColor: 'bg-blue-500/15',    borderColor: 'border-blue-500/30',    icon: Droplets,  traits: ['Tidal Surge', 'Deep Current', 'Mist Veil'] },
  { name: 'Volt',   color: 'text-yellow-400',   bgColor: 'bg-yellow-500/15',   borderColor: 'border-yellow-500/30',   icon: Zap,       traits: ['Arc Flash', 'Static Field', 'Thunderstrike'] },
  { name: 'Terra',  color: 'text-emerald-400',  bgColor: 'bg-emerald-500/15',  borderColor: 'border-emerald-500/30',  icon: Shield,    traits: ['Stone Wall', 'Root Network', 'Quake Pulse'] },
  { name: 'Aero',   color: 'text-cyan-400',     bgColor: 'bg-cyan-500/15',     borderColor: 'border-cyan-500/30',     icon: Wind,      traits: ['Gale Force', 'Jet Stream', 'Cyclone Eye'] },
  { name: 'Pyra',   color: 'text-red-400',      bgColor: 'bg-red-500/15',      borderColor: 'border-red-500/30',      icon: Flame,     traits: ['Inferno Core', 'Ember Trail', 'Solar Flare'] },
  { name: 'Helio',  color: 'text-amber-400',    bgColor: 'bg-amber-500/15',    borderColor: 'border-amber-500/30',    icon: Sun,       traits: ['Radiant Burst', 'Dawn Aura', 'Photon Lance'] },
  { name: 'Cryo',   color: 'text-sky-300',      bgColor: 'bg-sky-500/15',      borderColor: 'border-sky-500/30',      icon: Snowflake, traits: ['Frost Shard', 'Glacial Armor', 'Blizzard Veil'] },
  { name: 'Hydrox', color: 'text-teal-400',     bgColor: 'bg-teal-500/15',     borderColor: 'border-teal-500/30',     icon: Droplets,  traits: ['Vapor Wave', 'Prism Mist', 'Cascade Ring'] },
  { name: 'Luma',   color: 'text-purple-400',   bgColor: 'bg-purple-500/15',   borderColor: 'border-purple-500/30',   icon: Sparkles,  traits: ['Star Pulse', 'Nova Bloom', 'Ether Weave'] },
  { name: 'Umbra',  color: 'text-violet-400',   bgColor: 'bg-violet-500/15',   borderColor: 'border-violet-500/30',   icon: Moon,      traits: ['Shadow Step', 'Void Rift', 'Eclipse Shroud'] },
];

/* ─── Revenue Allocation ──────────────────────────────────────────── */

interface RevenueSlice {
  label: string;
  percentage: number;
  color: string;
  hex: string;
}

const REVENUE_ALLOCATION: RevenueSlice[] = [
  { label: 'Treasury',            percentage: 40, color: 'text-[#25D695]', hex: '#25D695' },
  { label: 'Development',         percentage: 30, color: 'text-blue-400',  hex: '#3B82F6' },
  { label: 'Liquidity Reserve',   percentage: 15, color: 'text-amber-400', hex: '#F59E0B' },
  { label: 'Seasonal Prize Pool', percentage: 15, color: 'text-purple-400', hex: '#A855F7' },
];

/* ================================================================== */
/*  COUNTDOWN HOOK                                                     */
/* ================================================================== */

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: diff === 0 };
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function ElementalzGenesis() {
  const countdown = useCountdown(PHASE_1_START);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* ─── Sub-Navigation ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/elementalz"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C2432] text-gray-400 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <Link
          to="/elementalz/genesis"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#25D695] text-[#0B0F14] transition-colors"
        >
          Genesis Mint
        </Link>
        <Link
          to="/elementalz/tournaments"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C2432] text-gray-400 hover:text-white transition-colors"
        >
          Tournaments
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  HERO BANNER                                                  */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-xl mb-8"
        style={{
          background: 'linear-gradient(135deg, #0B0F14 0%, #111820 40%, #0B2E1F 70%, #111820 100%)',
          border: '1px solid #25D69530',
        }}
      >
        {/* Decorative grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#25D695 1px, transparent 1px), linear-gradient(90deg, #25D695 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 px-8 py-12 md:py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#25D695]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#25D695] font-mono">XLS-46d Dynamic Collection</span>
            <Sparkles size={14} className="text-[#25D695]" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            <span className="text-white">Elementalz: </span>
            <span className="text-[#25D695]">Genesis Core</span>
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/20">
              5,555 Dynamic NFTs
            </span>
          </div>

          <p className="text-sm text-gray-400 max-w-lg mx-auto mb-8 leading-relaxed">
            The first XLS-46d deflationary companion collection on XRPL.
            Feed, evolve, and burn your way through a living economy.
          </p>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Timer size={14} className="text-[#25D695]" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-mono">Phase 1 Begins</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            {[
              { value: countdown.days, label: 'Days' },
              { value: countdown.hours, label: 'Hours' },
              { value: countdown.minutes, label: 'Min' },
              { value: countdown.seconds, label: 'Sec' },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold tabular-nums text-white"
                  style={{ backgroundColor: '#1C2432', border: '1px solid #25D69520' }}
                >
                  {String(unit.value).padStart(2, '0')}
                </div>
                <span className="text-[9px] uppercase tracking-widest text-gray-600 mt-1 block font-mono">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  MINT PHASE CARDS                                             */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-semibold">Mint Phases</span>
          <ChevronRight size={12} className="text-gray-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MINT_PHASES.map((phase) => (
            <TerminalCard key={phase.id} className="relative" glow>
              {/* Status badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-mono">
                  Phase {phase.id}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium border ${
                  phase.status === 'upcoming'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : phase.status === 'active'
                    ? 'bg-[#25D695]/10 text-[#25D695] border-[#25D695]/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  <Clock size={9} />
                  {phase.status}
                </span>
              </div>

              <h3 className="text-base font-semibold text-white mb-1">{phase.name}</h3>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{phase.description}</p>

              {/* Price */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1C2432]">
                <span className="text-xs text-gray-500">Price</span>
                <span className="text-lg font-bold tabular-nums text-white">{phase.price} <span className="text-xs text-gray-500">XRP</span></span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Allocation</span>
                  <span className="text-xs font-mono tabular-nums text-white">{phase.allocation.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Max per wallet</span>
                  <span className="text-xs font-mono tabular-nums text-white">{phase.maxPerWallet}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-gray-600 font-mono">Minted</span>
                  <span className="text-[9px] text-gray-600 font-mono">{phase.minted}/{phase.allocation.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[#1C2432] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#25D695] transition-all duration-500"
                    style={{ width: `${(phase.minted / phase.allocation) * 100}%` }}
                  />
                </div>
              </div>

              {/* Bonus callout */}
              {phase.bonus && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <span className="text-[10px] text-amber-400 font-medium">{phase.bonus}</span>
                </div>
              )}

              {/* Mint button */}
              <button
                disabled
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/20 opacity-50 cursor-not-allowed transition-all"
              >
                <Lock size={12} className="inline mr-1.5 -mt-0.5" />
                Mint — {phase.price} XRP
              </button>
            </TerminalCard>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  RARITY DISTRIBUTION                                          */}
      {/* ============================================================ */}
      <TerminalCard title="Rarity Distribution" className="mb-8">
        <div className="space-y-4">
          {RARITY_TIERS.map((tier) => (
            <div key={tier.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium border ${tier.bgColor} ${tier.color} ${tier.borderColor}`}>
                    {tier.name}
                  </span>
                  <span className="text-xs tabular-nums text-gray-400">{tier.count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-600 font-mono">Mult: {tier.multiplier}</span>
                  <span className="text-[9px] text-gray-600 font-mono">Ceil: {tier.evolutionCeiling}</span>
                  <span className={`text-xs font-semibold tabular-nums ${tier.color}`}>{tier.percentage}%</span>
                </div>
              </div>
              <div className="h-3 bg-[#1C2432] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-700`}
                  style={{
                    width: `${tier.percentage}%`,
                    boxShadow: tier.glow ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#1C2432]">
          <p className="text-[9px] text-gray-600 font-mono">
            * Stat multiplier scales Impact Points earned. Evolution ceiling determines max reachable stage per rarity tier.
          </p>
        </div>
      </TerminalCard>

      {/* ============================================================ */}
      {/*  ELEMENT TYPES GRID                                           */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-semibold">Element Types</span>
          <span className="text-[9px] text-gray-600 font-mono">10 primordial elements</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ELEMENT_TYPES.map((el) => {
            const ElIcon = el.icon;
            return (
              <div
                key={el.name}
                className={`rounded-xl p-4 text-center transition-all duration-200 hover:scale-[1.02] ${el.bgColor} border ${el.borderColor}`}
                style={{ backgroundColor: '#111820' }}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${el.bgColor}`}>
                  <ElIcon size={20} className={el.color} />
                </div>
                <h4 className={`text-sm font-semibold mb-2 ${el.color}`}>{el.name}</h4>
                <div className="space-y-1">
                  {el.traits.map((trait) => (
                    <span key={trait} className="block text-[9px] text-gray-500 font-mono">{trait}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  REVENUE ALLOCATION                                           */}
      {/* ============================================================ */}
      <TerminalCard title="Revenue Allocation" className="mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut chart */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
              {(() => {
                let cumulative = 0;
                return REVENUE_ALLOCATION.map((slice) => {
                  const dashArray = slice.percentage;
                  const dashOffset = 100 - cumulative;
                  cumulative += slice.percentage;
                  return (
                    <circle
                      key={slice.label}
                      cx="21" cy="21" r="15.9155"
                      fill="none"
                      stroke={slice.hex}
                      strokeWidth="4"
                      strokeDasharray={`${dashArray} ${100 - dashArray}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">100%</span>
              <span className="text-[9px] text-gray-600 font-mono">Allocated</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3 w-full">
            {REVENUE_ALLOCATION.map((slice) => (
              <div key={slice.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: slice.hex }} />
                  <span className="text-sm text-gray-300">{slice.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-[#1C2432] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${slice.percentage}%`, backgroundColor: slice.hex }} />
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${slice.color}`}>{slice.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TerminalCard>

      {/* ============================================================ */}
      {/*  ANTI-BOT PROTECTION                                          */}
      {/* ============================================================ */}
      <div className="mb-8 px-5 py-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0 mt-0.5">
            <Bot size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={12} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Anti-Bot Protection Active</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {[
                'Wallet signature required',
                '30s cooldown between mints',
                'Max 5 per wallet',
              ].map((rule) => (
                <span key={rule} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/15">
                  <AlertTriangle size={9} />
                  {rule}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Timestamp ────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-between py-3 border-t border-[#1C2432]">
        <span className="text-[9px] font-mono text-gray-700">
          genesis_mint v1.0 // nexus protocol
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
