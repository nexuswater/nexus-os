import { Link } from 'react-router-dom';
import {
  Sparkles, Droplets, Vote, Flame, Users, Trophy, Star, Shield,
  Award, Lock, Crown, Zap, Heart, Target, ChevronRight,
} from 'lucide-react';
import { TerminalCard } from '@/components/terminal';

/* ================================================================== */
/*  CONSTANTS & MOCK DATA                                              */
/* ================================================================== */

/* ─── Current Season ──────────────────────────────────────────────── */

const SEASON = {
  name: 'Genesis Awakening',
  number: 1,
  totalDays: 90,
  daysElapsed: 22,
  startDate: '2026-02-07',
  endDate: '2026-05-08',
};

/* ─── Competition Types ───────────────────────────────────────────── */

interface Competition {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  metric: string;
  topPrize: string;
}

const COMPETITIONS: Competition[] = [
  {
    id: 'impact',
    name: 'Impact Score Leaderboard',
    description: 'Accumulate the highest Impact Points through feeding, evolving, and governance participation.',
    icon: Droplets,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    metric: 'Impact Points',
    topPrize: '5,000 NXS + Mythic Egg',
  },
  {
    id: 'governance',
    name: 'Governance Streak',
    description: 'Maintain the longest consecutive DAO voting streak without missing a single proposal.',
    icon: Vote,
    color: 'text-[#25D695]',
    bgColor: 'bg-[#25D695]/15',
    borderColor: 'border-[#25D695]/30',
    metric: 'Consecutive Votes',
    topPrize: '2,500 NXS + Soulbound Badge',
  },
  {
    id: 'evolution',
    name: 'Evolution Race',
    description: 'Be the first to evolve your Elemental to the Legendary stage. Speed matters.',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    metric: 'Evolution Stage',
    topPrize: '10,000 NXS + Primal Elemental',
  },
  {
    id: 'burn',
    name: 'Burn Contribution',
    description: 'Contribute the most tokens to the burn mechanism through feeding and evolution cycles.',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30',
    metric: 'Tokens Burned',
    topPrize: '3,000 NXS + Fire Trail NFT',
  },
  {
    id: 'federation',
    name: 'Federation Alliance',
    description: 'Form the highest-scoring federation group. Collective impact determines rank.',
    icon: Users,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30',
    metric: 'Federation Score',
    topPrize: '15,000 NXS (split) + Federation Crest',
  },
];

/* ─── Mock Leaderboard ────────────────────────────────────────────── */

interface LeaderboardEntry {
  rank: number;
  name: string;
  element: string;
  elementColor: string;
  score: number;
  breakdown: { impact: number; governance: number; burns: number };
}

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  name: 'Pyralith Rex',       element: 'Pyra',   elementColor: 'text-red-400',      score: 24_850, breakdown: { impact: 12_400, governance: 5_200, burns: 7_250 } },
  { rank: 2,  name: 'Aquaflux Prime',      element: 'Aqua',   elementColor: 'text-blue-400',     score: 22_100, breakdown: { impact: 11_000, governance: 4_800, burns: 6_300 } },
  { rank: 3,  name: 'Voltshade Echo',      element: 'Volt',   elementColor: 'text-yellow-400',   score: 19_750, breakdown: { impact: 9_500,  governance: 4_250, burns: 6_000 } },
  { rank: 4,  name: 'Terraveil Sentinel',  element: 'Terra',  elementColor: 'text-emerald-400',  score: 18_200, breakdown: { impact: 8_900,  governance: 4_100, burns: 5_200 } },
  { rank: 5,  name: 'Cryo Phantom',        element: 'Cryo',   elementColor: 'text-sky-300',      score: 16_400, breakdown: { impact: 8_200,  governance: 3_700, burns: 4_500 } },
  { rank: 6,  name: 'Helion Blaze',        element: 'Helio',  elementColor: 'text-amber-400',    score: 15_100, breakdown: { impact: 7_500,  governance: 3_400, burns: 4_200 } },
  { rank: 7,  name: 'Aerostrike Gale',     element: 'Aero',   elementColor: 'text-cyan-400',     score: 13_800, breakdown: { impact: 6_900,  governance: 3_100, burns: 3_800 } },
  { rank: 8,  name: 'Umbral Wraith',       element: 'Umbra',  elementColor: 'text-violet-400',   score: 12_500, breakdown: { impact: 6_200,  governance: 2_900, burns: 3_400 } },
  { rank: 9,  name: 'Lumaveil Sage',       element: 'Luma',   elementColor: 'text-purple-400',   score: 11_200, breakdown: { impact: 5_600,  governance: 2_700, burns: 2_900 } },
  { rank: 10, name: 'Hydroxian Tide',      element: 'Hydrox', elementColor: 'text-teal-400',     score: 10_000, breakdown: { impact: 5_000,  governance: 2_500, burns: 2_500 } },
];

/* ─── Achievement Badges ──────────────────────────────────────────── */

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const BADGES: AchievementBadge[] = [
  {
    id: 'first-evo',
    name: 'First Evolution',
    description: 'Successfully evolved an Elemental from Egg to Hatchling stage.',
    icon: Sparkles,
    color: 'text-[#25D695]',
    bgColor: 'bg-[#25D695]/15',
    borderColor: 'border-[#25D695]/30',
  },
  {
    id: 'gov-guardian',
    name: 'Governance Guardian',
    description: 'Voted on 10 consecutive DAO proposals without missing one.',
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    description: 'Fed your Elemental every day for 30 consecutive days.',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/30',
  },
  {
    id: 'impact-champ',
    name: 'Impact Champion',
    description: 'Reached top 10 on the seasonal Impact Score leaderboard.',
    icon: Trophy,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'lock-master',
    name: 'Lock Master',
    description: 'Locked NXS tokens for the maximum 12-month governance period.',
    icon: Lock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'fed-founder',
    name: 'Federation Founder',
    description: 'Created a Federation alliance with 5 or more active members.',
    icon: Users,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 'genesis-holder',
    name: 'Genesis Holder',
    description: 'Minted during the Genesis Core Phase 1 allowlist window.',
    icon: Star,
    color: 'text-[#25D695]',
    bgColor: 'bg-[#25D695]/15',
    borderColor: 'border-[#25D695]/30',
  },
  {
    id: 'legendary-bond',
    name: 'Legendary Bond',
    description: 'Evolved an Elemental to Legendary stage and maintained max happiness.',
    icon: Heart,
    color: 'text-red-400',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/30',
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */

export default function ElementalzTournaments() {
  const seasonProgress = Math.round((SEASON.daysElapsed / SEASON.totalDays) * 100);

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
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1C2432] text-gray-400 hover:text-white transition-colors"
        >
          Genesis Mint
        </Link>
        <Link
          to="/elementalz/tournaments"
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#25D695] text-[#0B0F14] transition-colors"
        >
          Tournaments
        </Link>
      </div>

      {/* ============================================================ */}
      {/*  CURRENT SEASON BANNER                                        */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-xl mb-8"
        style={{
          background: 'linear-gradient(135deg, #0B0F14 0%, #111820 40%, #1A0F2E 70%, #111820 100%)',
          border: '1px solid #A855F730',
        }}
      >
        {/* Decorative grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#A855F7 1px, transparent 1px), linear-gradient(90deg, #A855F7 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 px-8 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-amber-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-mono">Active Season</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">
            <span className="text-white">Season {SEASON.number}: </span>
            <span className="text-purple-400">{SEASON.name}</span>
          </h1>

          <p className="text-sm text-gray-400 mb-6">
            {SEASON.totalDays}-day competitive season &middot; {SEASON.startDate} to {SEASON.endDate}
          </p>

          {/* Season progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-mono">Day {SEASON.daysElapsed} of {SEASON.totalDays}</span>
              <span className="text-[10px] text-purple-400 font-mono tabular-nums">{seasonProgress}% complete</span>
            </div>
            <div className="h-3 bg-[#1C2432] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${seasonProgress}%`,
                  background: 'linear-gradient(90deg, #A855F7, #7C3AED)',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[9px] text-gray-600 font-mono">{SEASON.daysElapsed} days elapsed</span>
              <span className="text-[9px] text-gray-600 font-mono">{SEASON.totalDays - SEASON.daysElapsed} days remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  COMPETITION TYPES                                            */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-semibold">Competition Types</span>
          <ChevronRight size={12} className="text-gray-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {COMPETITIONS.map((comp) => {
            const CompIcon = comp.icon;
            return (
              <TerminalCard key={comp.id} glow>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${comp.bgColor}`}>
                  <CompIcon size={20} className={comp.color} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{comp.name}</h3>
                <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">{comp.description}</p>
                <div className="space-y-2 pt-3 border-t border-[#1C2432]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-600 uppercase font-mono">Metric</span>
                    <span className={`text-[10px] font-medium ${comp.color}`}>{comp.metric}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-600 uppercase font-mono">Top Prize</span>
                    <span className="text-[10px] font-medium text-amber-400">{comp.topPrize}</span>
                  </div>
                </div>
              </TerminalCard>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  LEADERBOARD                                                  */}
      {/* ============================================================ */}
      <TerminalCard title="Impact Score Leaderboard" className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1C2432]">
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium w-12">Rank</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium">Elemental</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium">Element</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right">Score</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right hidden md:table-cell">Impact</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right hidden md:table-cell">Gov</th>
                <th className="pb-2 text-[9px] uppercase tracking-widest text-gray-600 font-medium text-right hidden md:table-cell">Burns</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((entry) => {
                const isTop3 = entry.rank <= 3;
                return (
                  <tr
                    key={entry.rank}
                    className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/20 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3">
                      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold tabular-nums ${
                        entry.rank === 1 ? 'bg-amber-500/15 text-amber-400'
                        : entry.rank === 2 ? 'bg-gray-400/15 text-gray-300'
                        : entry.rank === 3 ? 'bg-orange-500/15 text-orange-400'
                        : 'bg-[#1C2432] text-gray-500'
                      }`}>
                        {entry.rank === 1 && <Crown size={14} className="text-amber-400" />}
                        {entry.rank === 2 && <Trophy size={14} className="text-gray-300" />}
                        {entry.rank === 3 && <Award size={14} className="text-orange-400" />}
                        {entry.rank > 3 && entry.rank}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3">
                      <span className={`text-sm font-medium ${isTop3 ? 'text-white' : 'text-gray-300'}`}>{entry.name}</span>
                    </td>

                    {/* Element badge */}
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium ${entry.elementColor} bg-white/5 border border-white/10`}>
                        {entry.element}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3 text-right">
                      <span className={`text-sm font-bold tabular-nums ${isTop3 ? 'text-[#25D695]' : 'text-white'}`}>
                        {formatCompact(entry.score)}
                      </span>
                    </td>

                    {/* Breakdown columns (hidden on mobile) */}
                    <td className="py-3 text-right hidden md:table-cell">
                      <span className="text-xs tabular-nums text-blue-400 font-mono">{formatCompact(entry.breakdown.impact)}</span>
                    </td>
                    <td className="py-3 text-right hidden md:table-cell">
                      <span className="text-xs tabular-nums text-[#25D695] font-mono">{formatCompact(entry.breakdown.governance)}</span>
                    </td>
                    <td className="py-3 text-right hidden md:table-cell">
                      <span className="text-xs tabular-nums text-orange-400 font-mono">{formatCompact(entry.breakdown.burns)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-3 border-t border-[#1C2432] flex items-center justify-between">
          <p className="text-[9px] text-gray-600 font-mono">
            * Leaderboard refreshed every 6 hours. Score = Impact + Governance + Burn contributions.
          </p>
          <span className="text-[9px] text-gray-600 font-mono">
            Showing top 10 of 5,555
          </span>
        </div>
      </TerminalCard>

      {/* ============================================================ */}
      {/*  ACHIEVEMENT BADGES GALLERY                                   */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-semibold">Achievement Badges</span>
          <span className="text-[9px] text-gray-600 font-mono">Soulbound tokens (non-transferable)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BADGES.map((badge) => {
            const BadgeIcon = badge.icon;
            return (
              <div
                key={badge.id}
                className="rounded-xl p-4 transition-all duration-200 hover:border-[#25D695]/30"
                style={{ backgroundColor: '#111820', border: '1px solid #1C2432' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${badge.bgColor}`}>
                    <BadgeIcon size={20} className={badge.color} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Lock size={8} />
                    Soulbound
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{badge.name}</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Timestamp ────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-between py-3 border-t border-[#1C2432]">
        <span className="text-[9px] font-mono text-gray-700">
          tournaments_engine v1.0 // nexus protocol
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
