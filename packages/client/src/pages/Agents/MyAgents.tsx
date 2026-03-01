import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Plus, Activity, Zap, Clock, Wallet,
  Pause, Play, ChevronRight, TrendingUp, Shield,
  Database, Eye, Radio,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  NEXUS_CORE: { bg: 'bg-nexus-400/10', text: 'text-nexus-400', label: 'Core' },
  USER: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Custom' },
  INSTITUTION: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Institution' },
  TRADING: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'Trading' },
  DATA: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', label: 'Data' },
  ORACLE: { bg: 'bg-rose-400/10', text: 'text-rose-400', label: 'Oracle' },
};

const TYPE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  NEXUS_CORE: Shield,
  USER: Bot,
  INSTITUTION: Database,
  TRADING: TrendingUp,
  DATA: Database,
  ORACLE: Radio,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-amber-500',
  suspended: 'bg-red-500',
  draft: 'bg-gray-500',
};

const TABS = ['all', 'active', 'paused', 'draft'] as const;

export default function MyAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetch(`${API}/agents`)
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all'
    ? agents
    : agents.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">My Agents</h1>
          <p className="text-sm text-gray-500 mt-1">{agents.length} agents registered</p>
        </div>
        <Link
          to="/agents/create"
          className="flex items-center gap-2 px-4 py-2 bg-nexus-400 text-gray-950 text-sm font-semibold rounded-xl hover:bg-nexus-300 transition-colors"
        >
          <Plus size={16} />
          Create Agent
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-nexus-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Agent Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent: any) => {
            const typeStyle = TYPE_STYLES[agent.type] || TYPE_STYLES.USER;
            const TypeIcon = TYPE_ICONS[agent.type] || Bot;
            const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.draft;

            // Summarize wallet balances
            const balanceSummary = (agent.wallets || []).reduce((acc: Record<string, number>, w: any) => {
              Object.entries(w.balance || {}).forEach(([token, amt]) => {
                acc[token] = (acc[token] || 0) + (amt as number);
              });
              return acc;
            }, {} as Record<string, number>);

            return (
              <div
                key={agent.id}
                className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700/50 hover:shadow-lg hover:shadow-nexus-400/5 transition-all"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${typeStyle.bg} flex items-center justify-center`}>
                      <TypeIcon size={20} className={typeStyle.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-600">v{agent.version}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{agent.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                      <Activity size={10} />
                      Executions
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {(agent.stats?.executionsTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                      <Zap size={10} />
                      Success
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {((agent.stats?.successRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                      <Clock size={10} />
                      Uptime
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {((agent.stats?.uptime || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Wallet balances */}
                {Object.keys(balanceSummary).length > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-gray-950/50 rounded-lg">
                    <Wallet size={12} className="text-gray-600" />
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {Object.entries(balanceSummary).slice(0, 4).map(([token, amount]) => (
                        <span key={token} className="text-[10px] text-gray-400">
                          <span className="text-white font-medium tabular-nums">
                            {(amount as number).toLocaleString()}
                          </span>{' '}
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/agents/${agent.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Eye size={12} />
                    Details
                  </Link>
                  {agent.type === 'TRADING' && (
                    <Link
                      to={`/agents/${agent.id}/trading`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/15 text-amber-400 text-xs font-medium rounded-lg transition-colors"
                    >
                      <TrendingUp size={12} />
                      Trading
                    </Link>
                  )}
                  <button
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      agent.status === 'active'
                        ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/15'
                        : 'bg-nexus-400/10 text-nexus-400 hover:bg-nexus-400/15'
                    }`}
                  >
                    {agent.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-900/60 flex items-center justify-center mb-4">
            <Bot size={28} className="text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">No agents found</h3>
          <p className="text-xs text-gray-600 mb-4">
            {activeTab === 'all'
              ? 'Create your first agent to get started'
              : `No ${activeTab} agents`}
          </p>
          <Link
            to="/agents/create"
            className="flex items-center gap-2 px-4 py-2 bg-nexus-400/10 text-nexus-400 text-sm font-medium rounded-xl hover:bg-nexus-400/15 transition-colors"
          >
            <Plus size={14} />
            Create Agent
          </Link>
        </div>
      )}
    </div>
  );
}
