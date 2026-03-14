/**
 * RecommendationList — "Improve my Score" action recommendations.
 * Shows clear, benefit-focused next-best-actions.
 */
import { ChevronRight, Zap, Droplets, Leaf, Shield, TrendingUp } from 'lucide-react';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;           // e.g. "+5 pts"
  category: 'water' | 'energy' | 'both';
  difficulty: 'easy' | 'moderate' | 'advanced';
  estimatedSaving?: string; // e.g. "$12/mo"
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  onSelect?: (rec: Recommendation) => void;
  limit?: number;
  title?: string;
}

const categoryConfig = {
  water:  { icon: Droplets,   color: '#00b8f0', bg: 'bg-[#00b8f0]/10' },
  energy: { icon: Zap,        color: '#f99d07', bg: 'bg-[#f99d07]/10' },
  both:   { icon: Leaf,       color: '#25D695', bg: 'bg-[#25D695]/10' },
};

const difficultyBadge = {
  easy:     { label: 'Quick win', class: 'bg-[#25D695]/15 text-[#25D695]' },
  moderate: { label: 'Moderate',  class: 'bg-[#00b8f0]/15 text-[#00b8f0]' },
  advanced: { label: 'Advanced',  class: 'bg-[#f99d07]/15 text-[#f99d07]' },
};

export function RecommendationList({
  recommendations,
  onSelect,
  limit = 5,
  title = 'Improve Your Score',
}: RecommendationListProps) {
  const items = recommendations.slice(0, limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp size={15} className="text-[#25D695]" />
          {title}
        </h3>
        <span className="text-xs text-[#64748B]">{items.length} actions</span>
      </div>

      <div className="space-y-2">
        {items.map((rec) => {
          const cfg = categoryConfig[rec.category];
          const Icon = cfg.icon;
          const badge = difficultyBadge[rec.difficulty];

          return (
            <button
              key={rec.id}
              onClick={() => onSelect?.(rec)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all text-left group"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}
              >
                <Icon size={18} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                  {rec.title}
                </div>
                <div className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                  {rec.description}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.class}`}>
                    {badge.label}
                  </span>
                  {rec.estimatedSaving && (
                    <span className="text-[10px] text-[#64748B]">
                      Save {rec.estimatedSaving}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-bold text-[#25D695]">{rec.impact}</span>
                <ChevronRight size={14} className="text-[#475569] group-hover:text-white/60 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
