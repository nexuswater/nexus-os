import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, TrendingUp, Database, Radio, ArrowRight, ArrowLeft,
  Check, Shield, Zap, Globe, Plus, ChevronRight, Sparkles,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AGENT_TYPES = [
  {
    type: 'USER',
    label: 'Custom Agent',
    description: 'General-purpose agent with configurable skills and permissions',
    icon: Bot,
    color: 'blue',
  },
  {
    type: 'TRADING',
    label: 'Trading Bot',
    description: 'Specialized for XRPL DEX trading with market making and arbitrage strategies',
    icon: TrendingUp,
    color: 'amber',
  },
  {
    type: 'DATA',
    label: 'Data Agent',
    description: 'Data aggregation, analysis, and ESG compliance reporting',
    icon: Database,
    color: 'cyan',
  },
  {
    type: 'ORACLE',
    label: 'Oracle Agent',
    description: 'IoT data collection, verification, and on-chain publication',
    icon: Radio,
    color: 'rose',
  },
];

const RAIL_OPTIONS = [
  { value: 'xrpl', label: 'XRPL', desc: 'XRP Ledger native operations' },
  { value: 'evm', label: 'EVM', desc: 'Base, Arbitrum, XRPL EVM, HyperEVM' },
  { value: 'both', label: 'Multi-Rail', desc: 'Cross-chain operations across XRPL + EVM' },
];

const PERMISSION_DEFS = [
  { id: 'perm_trade', label: 'DEX Trading', desc: 'Execute trades on XRPL DEX and EVM DEXs', risk: 'high' as const },
  { id: 'perm_bridge', label: 'Bridge Execution', desc: 'Execute cross-chain asset bridges', risk: 'high' as const },
  { id: 'perm_gov_vote', label: 'Governance Voting', desc: 'Cast votes on DAO proposals', risk: 'medium' as const },
  { id: 'perm_delegate', label: 'Delegation Mgmt', desc: 'Accept and manage vote delegations', risk: 'medium' as const },
  { id: 'perm_iot_read', label: 'IoT Data Access', desc: 'Read IoT device telemetry data', risk: 'low' as const },
  { id: 'perm_data_read', label: 'Data Access', desc: 'Read installation and impact data', risk: 'low' as const },
  { id: 'perm_oracle_publish', label: 'Oracle Publishing', desc: 'Publish verified data on-chain', risk: 'medium' as const },
  { id: 'perm_report_gen', label: 'Report Generation', desc: 'Generate compliance reports', risk: 'low' as const },
];

const RISK_STYLES = {
  low: { bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  medium: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  high: { bg: 'bg-red-400/10', text: 'text-red-400' },
};

export default function CreateAgent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // Form state
  const [agentType, setAgentType] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rail, setRail] = useState('evm');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [revShareBps, setRevShareBps] = useState(250);

  useEffect(() => {
    fetch(`${API}/agents/skills/list`)
      .then(r => r.json())
      .then(d => setSkills(d.skills || []))
      .catch(() => {});
  }, []);

  const togglePerm = (id: string) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await fetch(`${API}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: agentType,
          description,
          rail,
          permissions: [...selectedPerms],
          skills: [...selectedSkills],
          revenueShareBps: revShareBps,
        }),
      });
      navigate('/agents');
    } catch {
      setCreating(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!agentType;
    if (step === 1) return name.length >= 3 && description.length >= 10;
    if (step === 2) return true;
    return true;
  };

  const STEPS = ['Type', 'Configure', 'Skills', 'Review'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Create Agent</h1>
        <p className="text-sm text-gray-500 mt-1">Configure and deploy a new autonomous agent</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < step
                  ? 'bg-nexus-400 text-gray-950'
                  : i === step
                  ? 'bg-nexus-400/20 text-nexus-400 border border-nexus-400/40'
                  : 'bg-gray-900/60 text-gray-600'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'text-white' : 'text-gray-600'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-700 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0: Type Selection */}
      {step === 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {AGENT_TYPES.map(at => {
            const Icon = at.icon;
            const selected = agentType === at.type;
            return (
              <button
                key={at.type}
                onClick={() => setAgentType(at.type)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  selected
                    ? 'bg-nexus-400/5 border-nexus-400/30 shadow-lg shadow-nexus-400/10'
                    : 'bg-gray-900/50 border-gray-800/60 hover:border-gray-700/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  selected ? 'bg-nexus-400/20' : 'bg-gray-800/60'
                }`}>
                  <Icon size={20} className={selected ? 'text-nexus-400' : 'text-gray-500'} />
                </div>
                <h3 className={`text-sm font-semibold mb-1 ${selected ? 'text-white' : 'text-gray-300'}`}>
                  {at.label}
                </h3>
                <p className="text-xs text-gray-500">{at.description}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. My Trading Bot"
              className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800/60 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-nexus-400/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what your agent does..."
              className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800/60 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-nexus-400/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Rail</label>
            <div className="grid grid-cols-3 gap-2">
              {RAIL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRail(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    rail === opt.value
                      ? 'bg-nexus-400/5 border-nexus-400/30'
                      : 'bg-gray-900/50 border-gray-800/60 hover:border-gray-700/50'
                  }`}
                >
                  <span className={`text-xs font-semibold ${rail === opt.value ? 'text-white' : 'text-gray-400'}`}>
                    {opt.label}
                  </span>
                  <p className="text-[10px] text-gray-600 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Permissions</label>
            <div className="space-y-2">
              {PERMISSION_DEFS.map(perm => {
                const risk = RISK_STYLES[perm.risk];
                return (
                  <button
                    key={perm.id}
                    onClick={() => togglePerm(perm.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedPerms.has(perm.id)
                        ? 'bg-white/[0.03] border-nexus-400/20'
                        : 'bg-gray-900/30 border-gray-800/40 hover:border-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        selectedPerms.has(perm.id) ? 'bg-nexus-400 text-gray-950' : 'bg-gray-800/60'
                      }`}>
                        {selectedPerms.has(perm.id) && <Check size={12} />}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-300">{perm.label}</span>
                        <p className="text-[10px] text-gray-600">{perm.desc}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${risk.bg} ${risk.text} uppercase`}>
                      {perm.risk}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Treasury Revenue Share: <span className="text-white">{(revShareBps / 100).toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={revShareBps}
              onChange={e => setRevShareBps(Number(e.target.value))}
              className="w-full accent-nexus-400"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Skills */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Select skills to install on your agent. You can add more later from the marketplace.</p>
          {skills.map((skill: any) => (
            <button
              key={skill.id}
              onClick={() => toggleSkill(skill.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                selectedSkills.has(skill.id)
                  ? 'bg-nexus-400/5 border-nexus-400/20'
                  : 'bg-gray-900/40 border-gray-800/40 hover:border-gray-700/40'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${
                  selectedSkills.has(skill.id) ? 'bg-nexus-400 text-gray-950' : 'bg-gray-800/60'
                }`}>
                  {selectedSkills.has(skill.id) && <Check size={12} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">{skill.name}</span>
                    {skill.pricingModel === 'free' && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-nexus-400/10 text-nexus-400">FREE</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 truncate">{skill.description}</p>
                </div>
              </div>
              {skill.pricingModel !== 'free' && (
                <span className="text-xs font-medium text-gray-400 ml-3 flex-shrink-0">{skill.price} NXS</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{name || 'Unnamed Agent'}</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-400/10 text-blue-400">
                {AGENT_TYPES.find(t => t.type === agentType)?.label || agentType}
              </span>
            </div>
            <p className="text-xs text-gray-500">{description}</p>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800/40">
              <div>
                <span className="text-[10px] text-gray-600">Rail</span>
                <p className="text-xs text-white font-medium uppercase">{rail}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-600">Revenue Share</span>
                <p className="text-xs text-white font-medium">{(revShareBps / 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/40">
              <span className="text-[10px] text-gray-600">Permissions ({selectedPerms.size})</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[...selectedPerms].map(id => {
                  const perm = PERMISSION_DEFS.find(p => p.id === id);
                  return (
                    <span key={id} className="text-[10px] px-2 py-0.5 rounded bg-gray-800/60 text-gray-400">
                      {perm?.label || id}
                    </span>
                  );
                })}
                {selectedPerms.size === 0 && <span className="text-[10px] text-gray-600">None selected</span>}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/40">
              <span className="text-[10px] text-gray-600">Skills ({selectedSkills.size})</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[...selectedSkills].map(id => {
                  const skill = skills.find((s: any) => s.id === id);
                  return (
                    <span key={id} className="text-[10px] px-2 py-0.5 rounded bg-nexus-400/10 text-nexus-400">
                      {skill?.name || id}
                    </span>
                  );
                })}
                {selectedSkills.size === 0 && <span className="text-[10px] text-gray-600">None selected</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800/40">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/agents')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          {step > 0 ? 'Back' : 'Cancel'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2 bg-nexus-400 text-gray-950 text-sm font-semibold rounded-xl hover:bg-nexus-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2 bg-nexus-400 text-gray-950 text-sm font-semibold rounded-xl hover:bg-nexus-300 transition-colors disabled:opacity-50"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {creating ? 'Creating...' : 'Create Agent'}
          </button>
        )}
      </div>
    </div>
  );
}
