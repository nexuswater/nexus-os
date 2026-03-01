import { useState, useEffect } from 'react';
import {
  Search, Star, Users, Zap, Tag, TrendingUp,
  Shield, Database, BarChart3, Cpu, CheckCircle,
  ArrowRight, Sparkles, Globe, Bot,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'trading', label: 'Trading', icon: TrendingUp },
  { key: 'data', label: 'Data', icon: Database },
  { key: 'governance', label: 'Governance', icon: Shield },
  { key: 'defi', label: 'DeFi', icon: Zap },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'automation', label: 'Automation', icon: Cpu },
  { key: 'verification', label: 'Verification', icon: CheckCircle },
  { key: 'bridge', label: 'Bridge', icon: Globe },
] as const;

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  trading: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  data: { bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  governance: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
  defi: { bg: 'bg-nexus-400/10', text: 'text-nexus-400' },
  analytics: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
  automation: { bg: 'bg-orange-400/10', text: 'text-orange-400' },
  verification: { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  bridge: { bg: 'bg-rose-400/10', text: 'text-rose-400' },
};

const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  flat: 'Flat Fee',
  per_execution: 'Per Execution',
  revenue_share: 'Revenue Share',
};

export default function SkillMarketplace() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/agents/skills/list`)
      .then(r => r.json())
      .then(d => { setSkills(d.skills || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = skills.filter(s => {
    if (category !== 'all' && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Skill Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          {skills.length} skills available · License skills to enhance your agents
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          placeholder="Search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-800/60 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-nexus-400/40"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === cat.key
                  ? 'bg-nexus-400/10 text-nexus-400 border border-nexus-400/20'
                  : 'bg-gray-900/40 text-gray-500 border border-gray-800/40 hover:text-gray-300'
              }`}
            >
              <CatIcon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-nexus-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Skills Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((skill: any) => {
            const catStyle = CATEGORY_STYLES[skill.category] || CATEGORY_STYLES.data;
            const isFree = skill.pricingModel === 'free';

            return (
              <div
                key={skill.id}
                className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700/50 hover:shadow-lg hover:shadow-nexus-400/5 transition-all group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">{skill.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${catStyle.bg} ${catStyle.text}`}>
                        {skill.category}
                      </span>
                      <span className="text-[10px] text-gray-600">v{skill.version}</span>
                    </div>
                  </div>
                  {isFree ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-nexus-400/10 text-nexus-400">
                      FREE
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="text-sm font-bold text-white tabular-nums">{skill.price}</span>
                      <span className="text-[10px] text-gray-500 ml-1">NXS</span>
                      <div className="text-[9px] text-gray-600">{PRICING_LABELS[skill.pricingModel]}</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{skill.description}</p>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={12} className="text-gray-600" />
                  <span className="text-[10px] text-gray-500">by <span className="text-gray-400">{skill.authorName}</span></span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-amber-400" />
                    <span className="text-xs font-medium text-white tabular-nums">{skill.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-600">({skill.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-gray-500" />
                    <span className="text-xs text-gray-400 tabular-nums">{skill.licensees}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-gray-500" />
                    <span className="text-xs text-gray-400 tabular-nums">{(skill.totalExecutions || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Rails */}
                <div className="flex items-center gap-1.5 mb-4">
                  {(skill.supportedRails || []).map((rail: string) => (
                    <span
                      key={rail}
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-500 uppercase"
                    >
                      {rail}
                    </span>
                  ))}
                </div>

                {/* License button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-nexus-400/10 text-gray-400 hover:text-nexus-400 text-xs font-medium rounded-xl transition-colors group-hover:border-nexus-400/20">
                  <Tag size={12} />
                  {isFree ? 'Install Skill' : 'License Skill'}
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-900/60 flex items-center justify-center mb-4">
            <Search size={28} className="text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">No skills found</h3>
          <p className="text-xs text-gray-600">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
}
