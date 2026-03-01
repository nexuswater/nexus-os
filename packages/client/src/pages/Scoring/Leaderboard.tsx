/**
 * Leaderboard — Ranked list of all scored subjects with filtering
 * by region, kind, and tier.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TerminalCard } from '@/components/terminal';
import { Select } from '@/components/common';
import {
  useNexusLeaderboard,
  useNexusBenchmarks,
} from '@/mock/useNexusStore';
import { TierBadge, DomainIcon } from './index';
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import type { ScoreDomain, SubjectKind, ScoreTier } from '@nexus/shared';

const KIND_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
];

const TIER_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'PLATINUM', label: 'Platinum' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'BRONZE', label: 'Bronze' },
];

export default function Leaderboard() {
  const [regionFilter, setRegionFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const benchmarks = useNexusBenchmarks();

  const regionOptions = [
    { value: '', label: 'All Regions' },
    ...benchmarks.map(b => ({ value: b.regionCode, label: `${b.regionName} (${b.regionCode})` })),
  ];

  const leaderboard = useNexusLeaderboard({
    region: regionFilter || undefined,
    kind: (kindFilter as SubjectKind) || undefined,
    tier: (tierFilter as ScoreTier) || undefined,
    limit: 50,
  });

  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="sm:w-48">
          <Select
            value={regionFilter}
            onChange={setRegionFilter}
            options={regionOptions}
            placeholder="All Regions"
          />
        </div>
        <div className="sm:w-40">
          <Select
            value={kindFilter}
            onChange={setKindFilter}
            options={KIND_OPTIONS}
            placeholder="All Types"
          />
        </div>
        <div className="sm:w-36">
          <Select
            value={tierFilter}
            onChange={setTierFilter}
            options={TIER_OPTIONS}
            placeholder="All Tiers"
          />
        </div>
      </div>

      {/* Region Benchmarks */}
      {benchmarks.length > 0 && !regionFilter && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4 sm:mb-5">
          {benchmarks.slice(0, 6).map(b => (
            <button
              key={b.regionCode}
              onClick={() => setRegionFilter(b.regionCode)}
              className="p-3 rounded-lg bg-[#111820] border border-[#1C2432] hover:border-[#25D69530] transition-all text-left btn-press"
            >
              <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">{b.regionCode}</div>
              <div className="text-sm font-bold text-white tabular-nums">{Math.round(b.avgOverallScore)}</div>
              <div className="text-[9px] text-[#475569]">{b.totalSubjects} subjects</div>
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard Table */}
      <TerminalCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C2432]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-4 py-3 w-12">#</th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-4 py-3">Property</th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3">Score</th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3">Tier</th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <DomainIcon domain="WATER" size={10} /> WTR
                  </div>
                </th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <DomainIcon domain="ENERGY" size={10} /> ENG
                  </div>
                </th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <DomainIcon domain="GOVERNANCE" size={10} /> GOV
                  </div>
                </th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <DomainIcon domain="RESILIENCE" size={10} /> RES
                  </div>
                </th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#475569] px-2 py-3 w-16">30d</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr key={entry.subjectId}
                  className="border-b border-[#1C2432]/50 hover:bg-[#111820]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold tabular-nums ${
                      entry.rank <= 3 ? 'text-amber-400' : 'text-[#475569]'
                    }`}>
                      {entry.rank <= 3 ? <Trophy size={14} className="inline text-amber-400" /> : entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-white">{entry.subjectName}</div>
                    <div className="text-[10px] text-[#475569]">{entry.regionCode} · {entry.ownerName}</div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-sm font-bold text-white tabular-nums">{Math.round(entry.overallScore)}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <TierBadge tier={entry.tier} />
                  </td>
                  <td className="px-2 py-3 text-center text-xs text-white tabular-nums hidden lg:table-cell">
                    {Math.round(entry.waterScore)}
                  </td>
                  <td className="px-2 py-3 text-center text-xs text-white tabular-nums hidden lg:table-cell">
                    {Math.round(entry.energyScore)}
                  </td>
                  <td className="px-2 py-3 text-center text-xs text-white tabular-nums hidden lg:table-cell">
                    {Math.round(entry.governanceScore)}
                  </td>
                  <td className="px-2 py-3 text-center text-xs text-white tabular-nums hidden lg:table-cell">
                    {Math.round(entry.resilienceScore)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`text-[11px] font-medium flex items-center justify-center gap-0.5 ${
                      entry.change30d > 0 ? 'text-emerald-400'
                      : entry.change30d < 0 ? 'text-red-400'
                      : 'text-[#475569]'
                    }`}>
                      {entry.change30d > 0 ? <TrendingUp size={10} />
                        : entry.change30d < 0 ? <TrendingDown size={10} />
                        : <Minus size={10} />
                      }
                      {entry.change30d > 0 ? '+' : ''}{entry.change30d}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/scoring/${entry.subjectId}`}
                      className="text-[#25D695] hover:text-[#1FBF84]"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-sm text-[#475569]">
              No subjects match the current filters.
            </div>
          )}
        </div>
      </TerminalCard>
    </div>
  );
}
