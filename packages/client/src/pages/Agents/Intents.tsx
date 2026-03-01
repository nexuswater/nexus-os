import { useState, useEffect } from 'react';
import {
  MessageSquare, ArrowRightLeft, Zap, Lock, CheckCircle,
  XCircle, Clock, AlertTriangle, Search, Plus,
  ChevronDown, ChevronUp, ArrowRight, Shield,
  Send, Database, Globe, Bot,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const INTENT_TYPE_STYLES: Record<string, { bg: string; text: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  TRADE: { bg: 'bg-amber-400/10', text: 'text-amber-400', icon: ArrowRightLeft },
  DATA_REQUEST: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', icon: Database },
  SKILL_EXECUTION: { bg: 'bg-cyan-400/10', text: 'text-cyan-400', icon: Zap },
  BRIDGE: { bg: 'bg-rose-400/10', text: 'text-rose-400', icon: Globe },
  GOVERNANCE_ACTION: { bg: 'bg-blue-400/10', text: 'text-blue-400', icon: Shield },
  CUSTOM: { bg: 'bg-gray-400/10', text: 'text-gray-400', icon: Bot },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  broadcast: { bg: 'bg-blue-400/10', text: 'text-blue-400' },
  negotiating: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  accepted: { bg: 'bg-nexus-400/10', text: 'text-nexus-400' },
  escrowed: { bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  executing: { bg: 'bg-orange-400/10', text: 'text-orange-400' },
  completed: { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  disputed: { bg: 'bg-red-400/10', text: 'text-red-400' },
  expired: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

const MSG_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  proposal: { bg: 'bg-blue-400/10', text: 'text-blue-400', label: 'Proposal' },
  counter: { bg: 'bg-amber-400/10', text: 'text-amber-400', label: 'Counter' },
  accept: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: 'Accepted' },
  reject: { bg: 'bg-red-400/10', text: 'text-red-400', label: 'Rejected' },
  info: { bg: 'bg-gray-400/10', text: 'text-gray-400', label: 'Info' },
  result: { bg: 'bg-nexus-400/10', text: 'text-nexus-400', label: 'Result' },
};

const STATUS_TABS = ['all', 'broadcast', 'negotiating', 'executing', 'completed', 'disputed'] as const;

export default function Intents() {
  const [intents, setIntents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [intentMessages, setIntentMessages] = useState<Record<string, any[]>>({});
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch(`${API}/agents/intents/list`)
      .then(r => r.json())
      .then(d => { setIntents(d.intents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleExpand = async (intentId: string) => {
    if (expandedId === intentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(intentId);
    if (!intentMessages[intentId]) {
      try {
        const r = await fetch(`${API}/agents/intents/${intentId}`);
        const d = await r.json();
        setIntentMessages(prev => ({ ...prev, [intentId]: d.messages || [] }));
      } catch {
        // ignore
      }
    }
  };

  const filtered = statusFilter === 'all'
    ? intents
    : intents.filter(i => i.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">A2A Intents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Agent-to-Agent negotiation protocol · {intents.length} intents
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-nexus-400 text-gray-950 text-sm font-semibold rounded-xl hover:bg-nexus-300 transition-colors"
        >
          <Plus size={16} />
          New Intent
        </button>
      </div>

      {/* Create Intent Panel */}
      {showCreate && (
        <div className="bg-gray-900/50 border border-nexus-400/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Broadcast New Intent</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Intent Type</label>
              <select className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40">
                <option value="TRADE">Trade</option>
                <option value="DATA_REQUEST">Data Request</option>
                <option value="SKILL_EXECUTION">Skill Execution</option>
                <option value="BRIDGE">Bridge</option>
                <option value="GOVERNANCE_ACTION">Governance Action</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Budget</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40"
                />
                <select className="w-24 px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40">
                  <option>NXS</option>
                  <option>XRP</option>
                  <option>WTR</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Describe what you need..."
              className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-nexus-400/40 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-nexus-400 text-gray-950 text-xs font-semibold rounded-xl hover:bg-nexus-300 transition-colors">
              <Send size={12} />
              Broadcast Intent
            </button>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
              statusFilter === tab
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

      {/* Intents List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((intent: any) => {
            const typeStyle = INTENT_TYPE_STYLES[intent.type] || INTENT_TYPE_STYLES.CUSTOM;
            const statStyle = STATUS_STYLES[intent.status] || STATUS_STYLES.cancelled;
            const TypeIcon = typeStyle.icon;
            const isExpanded = expandedId === intent.id;
            const messages = intentMessages[intent.id] || [];

            return (
              <div
                key={intent.id}
                className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-gray-700/50 transition-all"
              >
                {/* Intent Header */}
                <button
                  onClick={() => toggleExpand(intent.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${typeStyle.bg}`}>
                      <TypeIcon size={18} className={typeStyle.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${typeStyle.bg} ${typeStyle.text}`}>
                          {intent.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statStyle.bg} ${statStyle.text}`}>
                          {intent.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 truncate">{intent.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-600">
                          From: <span className="text-gray-400">{intent.initiatorAgentName}</span>
                        </span>
                        {intent.responderAgentName && (
                          <>
                            <ArrowRight size={10} className="text-gray-700" />
                            <span className="text-[10px] text-gray-600">
                              To: <span className="text-gray-400">{intent.responderAgentName}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-white tabular-nums">{intent.maxBudget}</span>
                      <span className="text-[10px] text-gray-500 ml-1">{intent.budgetToken}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-600" /> : <ChevronDown size={16} className="text-gray-600" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-800/40 p-4 space-y-4">
                    {/* Escrow Info */}
                    {intent.escrowId && (
                      <div className="flex items-center gap-3 p-3 bg-gray-950/50 rounded-xl">
                        <Lock size={14} className="text-cyan-400" />
                        <div className="flex-1">
                          <span className="text-[10px] text-gray-600">Escrow</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white tabular-nums">
                              {intent.escrowAmount} {intent.escrowToken}
                            </span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                              intent.escrowStatus === 'locked' ? 'bg-cyan-400/10 text-cyan-400' :
                              intent.escrowStatus === 'released' ? 'bg-emerald-400/10 text-emerald-400' :
                              'bg-gray-500/10 text-gray-500'
                            }`}>
                              {intent.escrowStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result */}
                    {intent.resultSummary && (
                      <div className="flex items-start gap-3 p-3 bg-emerald-400/5 border border-emerald-400/10 rounded-xl">
                        <CheckCircle size={14} className="text-emerald-400 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-emerald-400 font-medium">Result</span>
                          <p className="text-xs text-gray-300 mt-0.5">{intent.resultSummary}</p>
                        </div>
                      </div>
                    )}

                    {/* Negotiation Messages */}
                    {messages.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-600 uppercase mb-2">Negotiation Log</h4>
                        <div className="space-y-2">
                          {messages.map((msg: any) => {
                            const msgStyle = MSG_TYPE_STYLES[msg.type] || MSG_TYPE_STYLES.info;
                            return (
                              <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-950/30 rounded-xl">
                                <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center ${msgStyle.bg}`}>
                                  <MessageSquare size={10} className={msgStyle.text} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-medium text-gray-400">{msg.fromAgentName}</span>
                                    <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${msgStyle.bg} ${msgStyle.text}`}>
                                      {msgStyle.label}
                                    </span>
                                    <span className="text-[9px] text-gray-700">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap break-all">
                                    {JSON.stringify(msg.payload, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-600 uppercase mb-2">Requirements</h4>
                      <pre className="text-[10px] text-gray-500 font-mono bg-gray-950/50 rounded-xl p-3 whitespace-pre-wrap break-all">
                        {JSON.stringify(intent.requirements, null, 2)}
                      </pre>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[10px] text-gray-600">
                      <span>Created: {new Date(intent.createdAt).toLocaleString()}</span>
                      <span>Expires: {new Date(intent.expiresAt).toLocaleString()}</span>
                      <span>ID: {intent.id}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-900/60 flex items-center justify-center mb-4">
            <MessageSquare size={28} className="text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">No intents found</h3>
          <p className="text-xs text-gray-600">
            {statusFilter === 'all'
              ? 'Broadcast your first intent to start A2A negotiations'
              : `No ${statusFilter} intents`}
          </p>
        </div>
      )}
    </div>
  );
}
