/**
 * NFT Giveaway Engine — Strategic NFT drops that reward real environmental impact.
 * Drives organic engagement by rewarding actions, not speculation.
 */
import { useState } from 'react';
import {
  Gift, Zap, Droplets, Shield, Users, Clock,
  Trophy, ChevronDown, ChevronUp, Sparkles, Target,
  TrendingUp, Share2, UserPlus, CheckCircle2, Award,
  Sun, Hexagon, Star,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

type TierName = 'COMMON' | 'RARE' | 'GENESIS' | 'LEGENDARY';
type CampaignStatus = 'ACTIVE' | 'CLOSING SOON' | 'ALWAYS OPEN';

interface Campaign {
  id: string;
  title: string;
  tier: TierName;
  requirement: string;
  prize: string;
  participants: number;
  maxParticipants: number | null;
  timeRemaining: string | null;
  impactValue: string;
  impactLabel: string;
  status: CampaignStatus;
}

interface UpcomingDrop {
  title: string;
  description: string;
  timing: string;
}

interface RecentWinner {
  address: string;
  campaign: string;
  nftName: string;
  timeAgo: string;
}

/* ─── Tier Styling ───────────────────────────────────────── */

const TIER_COLORS: Record<TierName, { text: string; bg: string; border: string }> = {
  COMMON:    { text: 'text-[#94A3B8]', bg: 'bg-[#94A3B8]/10', border: 'border-[#94A3B8]/30' },
  RARE:      { text: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30' },
  GENESIS:   { text: 'text-[#25D695]', bg: 'bg-[#25D695]/10', border: 'border-[#25D695]/30' },
  LEGENDARY: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/30' },
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  'ACTIVE':       'bg-[#25D695]/10 text-[#25D695] border-[#25D695]/30',
  'CLOSING SOON': 'bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30',
  'ALWAYS OPEN':  'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
};

/* ─── Mock Data ──────────────────────────────────────────── */

const CAMPAIGNS: Campaign[] = [
  {
    id: 'water-saver',
    title: 'Water Saver Challenge',
    tier: 'GENESIS',
    requirement: 'Reduce water usage by 15% for 30 days',
    prize: 'Aqua Guardian NFT + 500 WTR tokens',
    participants: 1247,
    maxParticipants: 2000,
    timeRemaining: '12 days',
    impactValue: '45,200 L',
    impactLabel: 'water saved',
    status: 'ACTIVE',
  },
  {
    id: 'solar-pioneer',
    title: 'Solar Pioneer Drop',
    tier: 'LEGENDARY',
    requirement: 'Connect a solar-powered AWG installation',
    prize: 'Solar Phoenix NFT + 2,000 ENG tokens + Carbon Certificate',
    participants: 89,
    maxParticipants: 100,
    timeRemaining: '5 days',
    impactValue: '8,940 kg',
    impactLabel: 'CO₂ prevented',
    status: 'CLOSING SOON',
  },
  {
    id: 'community-verifier',
    title: 'Community Verifier',
    tier: 'RARE',
    requirement: 'Successfully verify 10 water production proofs',
    prize: 'Proof Guardian NFT + 200 NXS tokens',
    participants: 456,
    maxParticipants: 1000,
    timeRemaining: '21 days',
    impactValue: '2,340',
    impactLabel: 'proofs verified',
    status: 'ACTIVE',
  },
  {
    id: 'first-drop',
    title: 'First Drop \u2014 Welcome to Nexus',
    tier: 'COMMON',
    requirement: 'Connect wallet + complete Today dashboard tour',
    prize: 'Nexus Origin NFT (commemorative, no token value)',
    participants: 5621,
    maxParticipants: null,
    timeRemaining: null,
    impactValue: '5,621',
    impactLabel: 'new users onboarded',
    status: 'ALWAYS OPEN',
  },
];

const UPCOMING_DROPS: UpcomingDrop[] = [
  { title: 'DAO Voter Airdrop', description: 'Vote in 3 governance proposals', timing: 'Starts in 7 days' },
  { title: 'Impact Milestone: 1M Liters', description: 'Network-wide milestone', timing: 'Starts when milestone hit' },
  { title: 'Elementalz Fusion Event', description: 'Own 2+ Elementalz NFTs', timing: 'Coming Q2 2026' },
];

const RECENT_WINNERS: RecentWinner[] = [
  { address: 'rHb9...kPQ3', campaign: 'Water Saver Challenge', nftName: 'Aqua Guardian #412', timeAgo: '2 hours ago' },
  { address: 'rN7t...xM4L', campaign: 'First Drop', nftName: 'Nexus Origin #5601', timeAgo: '3 hours ago' },
  { address: 'rPk2...dW8R', campaign: 'Community Verifier', nftName: 'Proof Guardian #88', timeAgo: '5 hours ago' },
  { address: 'rQm5...vJ1K', campaign: 'Solar Pioneer Drop', nftName: 'Solar Phoenix #67', timeAgo: 'yesterday' },
  { address: 'rSv8...hN3T', campaign: 'Water Saver Challenge', nftName: 'Aqua Guardian #398', timeAgo: 'yesterday' },
  { address: 'rTz1...bY9P', campaign: 'First Drop', nftName: 'Nexus Origin #5589', timeAgo: '2 days ago' },
];

const TIER_INFO = [
  { name: 'COMMON' as TierName, level: 1, multiplier: '1x', example: 'Commemorative NFTs for onboarding', desc: 'Easy entry, commemorative NFTs, no token value' },
  { name: 'RARE' as TierName, level: 2, multiplier: '3x', example: 'Utility NFTs for proof verification', desc: 'Moderate effort, utility NFTs + small token reward' },
  { name: 'GENESIS' as TierName, level: 3, multiplier: '8x', example: 'Premium NFTs for sustained impact', desc: 'Significant impact required, premium NFTs + large token reward' },
  { name: 'LEGENDARY' as TierName, level: 4, multiplier: '20x', example: 'Unique 1/1 NFTs for elite achievers', desc: 'Elite achievement, unique 1/1 NFTs + massive rewards + carbon certificates' },
];

const ENGAGEMENT_STATS = [
  { label: 'Organic questions generated', value: '847', sub: 'from giveaway participants asking about features', icon: Target },
  { label: 'Feature discovery rate', value: '62%', sub: 'of participants explored 3+ features after entering', icon: TrendingUp },
  { label: 'Retention', value: '78%', sub: 'of giveaway winners remain active after 30 days', icon: CheckCircle2 },
  { label: 'Social shares', value: '1,204', sub: 'organic social posts about campaigns', icon: Share2 },
  { label: 'Referral conversions', value: '342', sub: 'new users from participant referrals', icon: UserPlus },
];

/* ─── Component ──────────────────────────────────────────── */

export default function NFTGiveaway() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-5xl mx-auto">
      {/* ──── 1. Page Header ──────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">NFT Giveaway Engine</h1>
        <p className="text-xs font-mono text-[#475569] mt-1">
          // strategic_nft_drops &middot; organic_engagement &middot; reward_real_impact
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] font-mono font-semibold text-[#25D695] uppercase tracking-wide">
            Active Drops
          </span>
        </div>
      </div>

      {/* ──── 2. KPI Stats Bar ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Active Campaigns" value="4" sub="active" icon={<Gift size={14} className="text-[#25D695]" />} accent="#25D695" />
        <KpiCard label="Total NFTs Distributed" value="2,847" icon={<Hexagon size={14} className="text-[#3B82F6]" />} accent="#3B82F6" />
        <KpiCard label="Engagement Rate" value="34.2%" sub="+8% vs last month" icon={<TrendingUp size={14} className="text-[#F59E0B]" />} accent="#F59E0B" />
        <KpiCard label="Avg Impact Per Drop" value="12.4 kg" sub="CO₂ prevented" icon={<Zap size={14} className="text-[#A78BFA]" />} accent="#A78BFA" />
      </div>

      {/* ──── 3. Active Giveaway Campaigns ────────────────── */}
      <SectionHeader title="Active Giveaway Campaigns" />
      <div className="space-y-3 mb-8">
        {CAMPAIGNS.map((c) => {
          const isExpanded = expandedId === c.id;
          const tier = TIER_COLORS[c.tier];
          const fillPct = c.maxParticipants
            ? Math.round((c.participants / c.maxParticipants) * 100)
            : 100;

          return (
            <div
              key={c.id}
              className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 lg:p-5 transition-colors hover:border-[#2A3444]"
            >
              {/* Top row — always visible */}
              <button
                onClick={() => toggle(c.id)}
                className="w-full text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${tier.bg} ${tier.text} ${tier.border}`}>
                      {c.tier}
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide border ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-[#475569]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#475569]" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-[#1C2432] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor:
                          c.status === 'CLOSING SOON'
                            ? '#F43F5E'
                            : c.tier === 'LEGENDARY'
                              ? '#F59E0B'
                              : '#25D695',
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                    {c.participants.toLocaleString()}
                    {c.maxParticipants ? ` / ${c.maxParticipants.toLocaleString()}` : ''} participants
                  </span>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#1C2432] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#475569] block mb-1">Requirement</span>
                    <span className="text-white/90">{c.requirement}</span>
                  </div>
                  <div>
                    <span className="text-[#475569] block mb-1">Prize</span>
                    <span className="text-[#25D695] font-medium">{c.prize}</span>
                  </div>
                  <div>
                    <span className="text-[#475569] block mb-1">Time Remaining</span>
                    <span className="text-white/90 flex items-center gap-1">
                      <Clock size={12} className="text-[#64748B]" />
                      {c.timeRemaining ?? 'No time limit'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#475569] block mb-1">Impact Generated</span>
                    <span className="text-white/90 font-mono">
                      {c.impactValue} <span className="text-[#64748B] font-sans">{c.impactLabel}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──── 4. Upcoming Drops ────────────────────────────── */}
      <SectionHeader title="Upcoming Drops" />
      <div className="bg-[#111820] border border-[#1C2432] rounded-lg divide-y divide-[#1C2432] mb-8">
        {UPCOMING_DROPS.map((d) => (
          <div key={d.title} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles size={14} className="text-[#475569] shrink-0" />
              <div className="min-w-0">
                <span className="text-sm text-white font-medium block truncate">{d.title}</span>
                <span className="text-[10px] text-[#64748B]">{d.description}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#475569] shrink-0 ml-3">{d.timing}</span>
          </div>
        ))}
      </div>

      {/* ──── 5. Giveaway Tiers Explainer ─────────────────── */}
      <SectionHeader title="Giveaway Tiers" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {TIER_INFO.map((t) => {
          const c = TIER_COLORS[t.name];
          return (
            <div
              key={t.name}
              className={`bg-[#111820] border border-[#1C2432] rounded-lg p-4 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{t.name}</span>
                <span className={`text-[10px] font-mono font-semibold ${c.text}`}>{t.multiplier}</span>
              </div>

              {/* Requirement level bars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      backgroundColor: bar <= t.level
                        ? TIER_COLORS[t.name].text.replace('text-[', '').replace(']', '')
                        : '#1C2432',
                    }}
                  />
                ))}
              </div>

              <p className="text-[10px] text-[#64748B] leading-relaxed">{t.desc}</p>
              <p className="text-[10px] text-[#475569] italic">{t.example}</p>
            </div>
          );
        })}
      </div>

      {/* ──── 6. Engagement Analytics Panel ───────────────── */}
      <SectionHeader title="Engagement Analytics" />
      <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 lg:p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENGAGEMENT_STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#25D695]/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[#25D695]" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold font-mono text-white">{s.value}</div>
                  <div className="text-[11px] text-white/70 font-medium">{s.label}</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── 7. Recent Winners Feed ──────────────────────── */}
      <SectionHeader title="Recent Winners" />
      <div className="bg-[#111820] border border-[#1C2432] rounded-lg divide-y divide-[#1C2432] mb-8">
        {RECENT_WINNERS.map((w, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#25D695]/10 flex items-center justify-center shrink-0">
                <Trophy size={12} className="text-[#25D695]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white">{w.address}</span>
                  <span className="text-[9px] text-[#475569]">&middot;</span>
                  <span className="text-[10px] text-[#64748B]">{w.timeAgo}</span>
                </div>
                <div className="text-[10px] text-[#475569] truncate">
                  Won <span className="text-[#25D695]">{w.nftName}</span> from {w.campaign}
                </div>
              </div>
            </div>
            <Star size={12} className="text-[#F59E0B]/50 shrink-0" />
          </div>
        ))}
      </div>

      {/* ──── 8. Footer ───────────────────────────────────── */}
      <footer className="text-center py-6 border-t border-[#1C2432]">
        <p className="text-[10px] font-mono text-[#475569]">
          nft_giveaway_engine v1.0 // nexus_protocol
        </p>
        <p className="text-[9px] font-mono text-[#334155] mt-1">
          {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
        </p>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em]">
        {title}
      </span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-[#475569] font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono text-white">{value}</div>
      {sub && (
        <div className="text-[10px] font-mono mt-0.5" style={{ color: accent }}>
          {sub}
        </div>
      )}
    </div>
  );
}
