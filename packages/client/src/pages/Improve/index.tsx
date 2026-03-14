/**
 * Improve — Full recommendations page.
 * "I can improve my score with clear actions."
 */
import { useState } from 'react';
import { RecommendationList } from '@/components/health';
import type { Recommendation } from '@/components/health';
import { generateRecommendations } from '@/mock/generators/health';
import { Filter, Droplets, Zap, Leaf } from 'lucide-react';

const allRecommendations = generateRecommendations();

type CategoryFilter = 'all' | 'water' | 'energy' | 'both';

const filters: { key: CategoryFilter; label: string; icon: typeof Droplets; color: string }[] = [
  { key: 'all',    label: 'All',    icon: Filter,   color: '#94A3B8' },
  { key: 'water',  label: 'Water',  icon: Droplets, color: '#00b8f0' },
  { key: 'energy', label: 'Energy', icon: Zap,      color: '#f99d07' },
  { key: 'both',   label: 'Both',   icon: Leaf,     color: '#25D695' },
];

export default function Improve() {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const filtered = filter === 'all'
    ? allRecommendations
    : allRecommendations.filter(r => r.category === filter);

  // Summary stats
  const totalPotentialPts = allRecommendations.reduce((sum, r) => {
    const pts = parseInt(r.impact.replace(/[^0-9]/g, ''));
    return sum + pts;
  }, 0);
  const totalPotentialSaving = allRecommendations.reduce((sum, r) => {
    if (!r.estimatedSaving) return sum;
    const val = parseInt(r.estimatedSaving.replace(/[^0-9]/g, ''));
    return sum + val;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Improve Your Score</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Actions you can take to save money and boost your impact
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#25D695]/[0.08] to-transparent border border-[#25D695]/10">
          <div className="text-2xl font-bold text-[#25D695]">+{totalPotentialPts} pts</div>
          <div className="text-xs text-[#64748B] mt-0.5">Potential score increase</div>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00b8f0]/[0.08] to-transparent border border-[#00b8f0]/10">
          <div className="text-2xl font-bold text-[#00b8f0]">${totalPotentialSaving}/mo</div>
          <div className="text-xs text-[#64748B] mt-0.5">Potential monthly savings</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {filters.map(f => {
          const Icon = f.icon;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                active
                  ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                  : 'bg-white/[0.03] text-[#64748B] border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={13} style={{ color: active ? f.color : undefined }} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Recommendations */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <RecommendationList
          recommendations={filtered}
          limit={20}
          title={`${filtered.length} Recommendations`}
        />
      </div>
    </div>
  );
}
