/**
 * Scoring Hub — Overview of all scored subjects, leaderboard,
 * and marketplace products for improving scores.
 */

import { useState, useMemo } from 'react';
import { TerminalCard } from '@/components/terminal';
import { TabGroup } from '@/components/common';
import {
  useNexusSubjects,
  useNexusLeaderboard,
  useNexusCertificates,
  useNexusBenchmarks,
} from '@/mock/useNexusStore';
import {
  Home, Award, Trophy,
  Droplets, Zap, Shield, Heart,
} from 'lucide-react';
import type { ScoreTier, ScoreDomain } from '@nexus/shared';
import SubjectsList from './SubjectsList';
import Leaderboard from './Leaderboard';
import ProductMarketplace from './ProductMarketplace';

// ─── Tier Badge ─────────────────────────────────────────

const TIER_COLORS: Record<ScoreTier, string> = {
  PLATINUM: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  GOLD: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  SILVER: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  BRONZE: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
  UNRATED: 'bg-[#1C2432] text-[#475569] border-[#1C2432]',
};

export function TierBadge({ tier, size = 'sm' }: { tier: ScoreTier; size?: 'sm' | 'md' }) {
  const cls = TIER_COLORS[tier];
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  return (
    <span className={`${cls} ${px} font-semibold uppercase tracking-wider rounded-md border inline-flex items-center gap-1`}>
      {tier !== 'UNRATED' && <Award size={size === 'sm' ? 10 : 12} />}
      {tier}
    </span>
  );
}

// ─── Domain Icon ────────────────────────────────────────

const DOMAIN_ICONS: Record<ScoreDomain, typeof Droplets> = {
  WATER: Droplets,
  ENERGY: Zap,
  GOVERNANCE: Shield,
  RESILIENCE: Heart,
};

const DOMAIN_COLORS: Record<ScoreDomain, string> = {
  WATER: 'text-blue-400',
  ENERGY: 'text-amber-400',
  GOVERNANCE: 'text-emerald-400',
  RESILIENCE: 'text-rose-400',
};

export function DomainIcon({ domain, size = 14 }: { domain: ScoreDomain; size?: number }) {
  const Icon = DOMAIN_ICONS[domain];
  return <Icon size={size} className={DOMAIN_COLORS[domain]} />;
}

// ─── Score Ring ──────────────────────────────────────────

export function ScoreRing({ score, size = 80, tier }: { score: number; size?: number; tier: ScoreTier }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const tierColor = tier === 'PLATINUM' ? '#a78bfa'
    : tier === 'GOLD' ? '#fbbf24'
    : tier === 'SILVER' ? '#94a3b8'
    : tier === 'BRONZE' ? '#f97316'
    : '#475569';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius}
          stroke="#1C2432" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius}
          stroke={tierColor} strokeWidth="4" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-white font-bold" style={{ fontSize: size * 0.22 }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

// ─── Main Hub ───────────────────────────────────────────

const TABS = ['Properties', 'Leaderboard', 'Market'] as const;

export default function ScoringHub() {
  const [activeTab, setActiveTab] = useState<string>('Properties');
  const subjects = useNexusSubjects();
  const certificates = useNexusCertificates();
  const benchmarks = useNexusBenchmarks();
  const leaderboard = useNexusLeaderboard({ limit: 5 });

  // Quick stats
  const totalSubjects = subjects.length;
  const certifiedCount = certificates.length;
  const avgScore = useMemo(() => {
    if (leaderboard.length === 0) return 0;
    return Math.round(leaderboard.reduce((s, e) => s + e.overallScore, 0) / leaderboard.length);
  }, [leaderboard]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Nexus Score</h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider hidden sm:inline">
            // home &amp; facility scoring
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] text-[#475569] font-mono hidden sm:inline">Scoring Engine v1.0</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5 stagger-children">
        <TerminalCard glow statusDot="active">
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">Properties</span>
            <Home size={14} className="text-[#25D695]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{totalSubjects}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Enrolled Subjects</div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">Certified</span>
            <Award size={14} className="text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{certifiedCount}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Active Certificates</div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">Avg Score</span>
            <Trophy size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{avgScore}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Network Average</div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">Regions</span>
            <Shield size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">{benchmarks.length}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Active Regions</div>
        </TerminalCard>
      </div>

      {/* Tab Navigation */}
      <div className="mb-5">
        <TabGroup
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'Properties' && <SubjectsList />}
      {activeTab === 'Leaderboard' && <Leaderboard />}
      {activeTab === 'Market' && <ProductMarketplace />}
    </div>
  );
}
