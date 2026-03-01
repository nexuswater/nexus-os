import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Zap, Shield, Heart, Sparkles, Droplets, Wind,
  Sun, Moon, Snowflake, TrendingUp, Trophy, Star,
} from 'lucide-react';
import { TerminalCard } from '@/components/terminal';
import { generateElementalzEconomy, type MockElemental } from '@/mock/generators/elementalz';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

/* ─── Element type color mapping ──────────────────────────────────── */

const ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Aqua:   { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  Volt:   { bg: 'bg-yellow-500/15',   text: 'text-yellow-400',  border: 'border-yellow-500/30' },
  Terra:  { bg: 'bg-emerald-500/15',  text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Aero:   { bg: 'bg-cyan-500/15',     text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  Pyra:   { bg: 'bg-red-500/15',      text: 'text-red-400',     border: 'border-red-500/30' },
  Helio:  { bg: 'bg-orange-500/15',   text: 'text-orange-400',  border: 'border-orange-500/30' },
  Cryo:   { bg: 'bg-sky-500/15',      text: 'text-sky-300',     border: 'border-sky-500/30' },
  Hydrox: { bg: 'bg-teal-500/15',     text: 'text-teal-400',    border: 'border-teal-500/30' },
  Luma:   { bg: 'bg-amber-500/15',    text: 'text-amber-300',   border: 'border-amber-500/30' },
  Umbra:  { bg: 'bg-purple-500/15',   text: 'text-purple-400',  border: 'border-purple-500/30' },
};

const ELEMENT_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Aqua: Droplets, Volt: Zap, Terra: Shield, Aero: Wind,
  Pyra: Flame, Helio: Sun, Cryo: Snowflake, Hydrox: Droplets,
  Luma: Sun, Umbra: Moon,
};

/* ─── Rarity tier styling ─────────────────────────────────────────── */

const RARITY_STYLES: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  Common: { bg: 'bg-gray-500/15',    text: 'text-gray-400',    border: 'border-gray-500/30' },
  Rare:   { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30' },
  Epic:   { bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  Mythic: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  Primal: { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/40', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]' },
};

/* ─── Evolution stages ────────────────────────────────────────────── */

const EVOLUTION_ORDER = ['Egg', 'Hatchling', 'Guardian', 'Ascended', 'Legendary'] as const;

const EVOLUTION_COSTS = [
  { stage: 'Egg',       wtr: 0,      eng: 0,     nxs: 0 },
  { stage: 'Hatchling', wtr: 500,    eng: 300,   nxs: 50 },
  { stage: 'Guardian',  wtr: 2000,   eng: 1200,  nxs: 200 },
  { stage: 'Ascended',  wtr: 8000,   eng: 5000,  nxs: 800 },
  { stage: 'Legendary', wtr: 25000,  eng: 15000, nxs: 2500 },
];

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */

export default function Elementalz() {
  const economy = useMemo(() => generateElementalzEconomy(), []);
  const { elementalz, totalWtrBurned, totalEngBurned, totalTreasuryReinforcement } = economy;

  // Scarcity index: ratio of total burned to total fed, 0-100
  const totalFed = elementalz.reduce((s, e) => s + e.totalWtrFed + e.totalEngFed, 0);
  const totalBurned = elementalz.reduce((s, e) => s + e.totalBurned, 0);
  const scarcityIndex = totalFed > 0 ? Math.min(100, Math.round((totalBurned / totalFed) * 100)) : 0;

  // Burn vs Issuance mock rates
  const burnRate = totalBurned;
  const issuanceRate = Math.round(totalFed * 0.4);
  const burnHealth = burnRate > issuanceRate ? 'Deflationary' : burnRate === issuanceRate ? 'Neutral' : 'Inflationary';
  const burnHealthColor = burnRate > issuanceRate ? 'text-[#25D695]' : burnRate === issuanceRate ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Sparkles size={22} className="text-[#25D695]" />
            Elementalz Companions
          </h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mt-1 font-mono">
            {'// protocol > hybrid_deflationary_nft_engine'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D695]" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Live</span>
        </div>
      </div>

      {/* ─── Sub-Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/elementalz"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#25D695] text-[#0B0F14] transition-colors"
        >
          Dashboard
        </Link>
        <Link
          to="/elementalz/genesis"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C2432] text-gray-400 hover:text-white transition-colors"
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
      {/*  ECONOMY STATS BAR                                           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {/* WTR Burned */}
        <TerminalCard title="WTR Burned" padding="sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-red-500/10">
              <Flame size={16} className="text-red-400" />
            </div>
            <span className="text-xl font-semibold tabular-nums text-orange-400">
              {formatNumber(Math.round(totalWtrBurned))}
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mt-1 font-mono">WTR tokens permanently removed</p>
        </TerminalCard>

        {/* ENG Burned */}
        <TerminalCard title="ENG Burned" padding="sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-500/10">
              <Flame size={16} className="text-orange-400" />
            </div>
            <span className="text-xl font-semibold tabular-nums text-orange-400">
              {formatNumber(Math.round(totalEngBurned))}
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mt-1 font-mono">ENG tokens permanently removed</p>
        </TerminalCard>

        {/* Treasury Reinforcement */}
        <TerminalCard title="Treasury Reinforcement" padding="sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#25D695]/10">
              <TrendingUp size={16} className="text-[#25D695]" />
            </div>
            <span className="text-xl font-semibold tabular-nums text-[#25D695]">
              {formatNumber(Math.round(totalTreasuryReinforcement))}
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mt-1 font-mono">Tokens routed to protocol treasury</p>
        </TerminalCard>

        {/* Scarcity Index */}
        <TerminalCard title="Scarcity Index" padding="sm">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1C2432"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={scarcityIndex >= 60 ? '#25D695' : scarcityIndex >= 40 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="3"
                  strokeDasharray={`${scarcityIndex}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-white">
                {scarcityIndex}
              </span>
            </div>
            <div>
              <span className="text-lg font-semibold tabular-nums text-white">{scarcityIndex}/100</span>
              <p className="text-[9px] text-gray-600 font-mono">burn-to-feed ratio</p>
            </div>
          </div>
        </TerminalCard>
      </div>

      {/* ============================================================ */}
      {/*  BURN VS ISSUANCE CHART                                      */}
      {/* ============================================================ */}
      <TerminalCard title="Burn vs Issuance Rate" className="mb-5">
        <div className="space-y-4">
          {/* Burn bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Flame size={12} className="text-orange-400" />
                Total Burned
              </span>
              <span className="text-xs tabular-nums text-orange-400 font-mono">{formatCompact(burnRate)}</span>
            </div>
            <div className="h-3 bg-[#1C2432] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (burnRate / Math.max(burnRate, issuanceRate)) * 100)}%`,
                  background: 'linear-gradient(90deg, #F97316, #EF4444)',
                }}
              />
            </div>
          </div>

          {/* Issuance bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-400" />
                Total Issuance (est.)
              </span>
              <span className="text-xs tabular-nums text-blue-400 font-mono">{formatCompact(issuanceRate)}</span>
            </div>
            <div className="h-3 bg-[#1C2432] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (issuanceRate / Math.max(burnRate, issuanceRate)) * 100)}%`,
                  background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
                }}
              />
            </div>
          </div>

          {/* Health indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1C2432]">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">Protocol Health</span>
            <span className={`text-xs font-semibold ${burnHealthColor} flex items-center gap-1`}>
              {burnHealth === 'Deflationary' && <TrendingUp size={12} />}
              {burnHealth}
            </span>
          </div>
        </div>
      </TerminalCard>

      {/* ============================================================ */}
      {/*  COLLECTION GRID                                             */}
      {/* ============================================================ */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-semibold">
            Collection ({elementalz.length} Elementalz)
          </span>
          <span className="text-[9px] text-gray-600 font-mono">
            sorted by impact points
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...elementalz]
            .sort((a, b) => b.stats.impactPoints - a.stats.impactPoints)
            .map((el) => (
              <ElementalCard key={el.id} elemental={el} />
            ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  EVOLUTION COST TABLE                                        */}
      {/* ============================================================ */}
      <TerminalCard title="Evolution Cost Curve" className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1C2432]">
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium">Stage</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right">WTR Cost</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right">ENG Cost</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right">NXS Cost</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {EVOLUTION_COSTS.map((row, idx) => {
                const cumWtr = EVOLUTION_COSTS.slice(0, idx + 1).reduce((s, r) => s + r.wtr, 0);
                const cumEng = EVOLUTION_COSTS.slice(0, idx + 1).reduce((s, r) => s + r.eng, 0);
                const cumNxs = EVOLUTION_COSTS.slice(0, idx + 1).reduce((s, r) => s + r.nxs, 0);
                return (
                  <tr key={row.stage} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/20 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{row.stage}</span>
                        {idx > 0 && (
                          <span className="text-[9px] text-gray-600 font-mono">Lv.{idx}</span>
                        )}
                      </div>
                      {/* Progress indicator */}
                      <div className="flex gap-0.5 mt-1">
                        {EVOLUTION_ORDER.map((_, si) => (
                          <div
                            key={si}
                            className={`h-1 w-5 rounded-full ${
                              si <= idx ? 'bg-[#25D695]' : 'bg-[#1C2432]'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-blue-400 font-mono">
                      {row.wtr === 0 ? '--' : formatNumber(row.wtr)}
                    </td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-amber-400 font-mono">
                      {row.eng === 0 ? '--' : formatNumber(row.eng)}
                    </td>
                    <td className="py-2.5 text-right text-xs tabular-nums text-[#25D695] font-mono">
                      {row.nxs === 0 ? '--' : formatNumber(row.nxs)}
                    </td>
                    <td className="py-2.5 text-right text-[10px] text-gray-500 font-mono">
                      {cumWtr + cumEng + cumNxs === 0
                        ? '--'
                        : `${formatCompact(cumWtr)} / ${formatCompact(cumEng)} / ${formatCompact(cumNxs)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-gray-600 mt-3 font-mono">
          * Evolution burns 70% of fed tokens; 30% routes to treasury. Costs increase exponentially per stage.
        </p>
      </TerminalCard>

      {/* ---- Bottom timestamp ---- */}
      <div className="mt-5 flex items-center justify-between py-3 border-t border-[#1C2432]">
        <span className="text-[9px] font-mono text-gray-700">
          elementalz_engine v1.0 // nexus protocol
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ELEMENTAL CARD                                                     */
/* ================================================================== */

function ElementalCard({ elemental }: { elemental: MockElemental }) {
  const el = elemental;
  const elColor = ELEMENT_COLORS[el.elementType] ?? ELEMENT_COLORS.Aqua;
  const rarStyle = RARITY_STYLES[el.rarityTier] ?? RARITY_STYLES.Common;
  const ElIcon = ELEMENT_ICONS[el.elementType] ?? Sparkles;
  const stageIdx = EVOLUTION_ORDER.indexOf(el.evolutionStage as typeof EVOLUTION_ORDER[number]);

  return (
    <div
      className={`bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#25D695]/30 transition-all duration-200 ${rarStyle.glow ?? ''}`}
    >
      {/* Top: element badge + rarity badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium border ${elColor.bg} ${elColor.text} ${elColor.border}`}>
          <ElIcon size={10} />
          {el.elementType}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium border ${rarStyle.bg} ${rarStyle.text} ${rarStyle.border}`}>
          {el.rarityTier === 'Primal' && <Star size={9} className="text-red-400" />}
          {el.rarityTier === 'Mythic' && <Trophy size={9} className="text-amber-400" />}
          {el.rarityTier}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-white truncate mb-1">{el.name}</h3>

      {/* Evolution stage */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-gray-500 uppercase tracking-wide">{el.evolutionStage}</span>
          <span className="text-[9px] text-gray-600 font-mono">Stage {stageIdx + 1}/5</span>
        </div>
        <div className="flex gap-0.5">
          {EVOLUTION_ORDER.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= stageIdx ? 'bg-[#25D695]' : 'bg-[#1C2432]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <TrendingUp size={10} className="text-[#25D695]" />
          </div>
          <span className="text-xs font-semibold tabular-nums text-white">{formatCompact(el.stats.impactPoints)}</span>
          <p className="text-[8px] text-gray-600 uppercase">Impact</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Heart size={10} className="text-pink-400" />
          </div>
          <span className="text-xs font-semibold tabular-nums text-white">{el.stats.happiness}</span>
          <p className="text-[8px] text-gray-600 uppercase">Happy</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Sparkles size={10} className="text-amber-400" />
          </div>
          <span className="text-xs font-semibold tabular-nums text-white">{el.stats.auraIntensity}</span>
          <p className="text-[8px] text-gray-600 uppercase">Aura</p>
        </div>
      </div>

      {/* Burn indicator */}
      <div className="flex items-center justify-between py-2 border-t border-[#1C2432]">
        <div className="flex items-center gap-1">
          <Flame size={10} className="text-orange-400" />
          <span className="text-[10px] tabular-nums text-orange-400 font-mono">
            {formatCompact(el.totalBurned)} burned
          </span>
        </div>
        <span className="text-[9px] text-gray-600 font-mono">
          {el.feedCount} feeds
        </span>
      </div>

      {/* Feed button (disabled mock) */}
      <button
        disabled
        className="w-full mt-2 px-3 py-1.5 rounded-md text-[10px] font-medium bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/20 opacity-50 cursor-not-allowed"
      >
        Feed Elemental
      </button>
    </div>
  );
}
