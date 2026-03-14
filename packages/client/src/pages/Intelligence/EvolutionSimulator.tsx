import { useState } from 'react';
import {
  Users, Server, Bot, RotateCcw, Link2, TrendingUp,
  ChevronDown, ChevronRight, AlertTriangle, Target,
  Globe, DollarSign, Milestone, ArrowRight, Zap,
  Upload, Award, Flame, Vote, ShieldCheck, Gamepad2,
  Leaf, CircleDot,
} from 'lucide-react';

/* ─── Section Header ────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#1C2432]" />
    </div>
  );
}

/* ─── Score Bar ──────────────────────────────────────────── */

function ScoreBar({ value, max = 100, color = '#25D695' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-[#1C2432] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
      />
    </div>
  );
}

/* ─── Loop Flow ─────────────────────────────────────────── */

function LoopFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-[#94A3B8] bg-[#0B0F14] px-1.5 py-0.5 rounded border border-[#1C2432]">
            {step}
          </span>
          {i < steps.length - 1 && <ArrowRight size={10} className="text-[#475569]" />}
        </span>
      ))}
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────── */

const KPI_DATA = [
  { label: 'Simulated Users', value: '10,000', icon: Users, color: '#25D695' },
  { label: 'Infrastructure Nodes', value: '2,000', icon: Server, color: '#38BDF8' },
  { label: 'AI Agents', value: '3,000', icon: Bot, color: '#A78BFA' },
  { label: 'Sim Cycles Run', value: '10', icon: RotateCcw, color: '#F59E0B' },
  { label: 'Value Loops Found', value: '7', icon: Link2, color: '#EC4899' },
  { label: 'Convergence', value: '94.2%', icon: TrendingUp, color: '#25D695' },
];

const USER_SEGMENTS = [
  { segment: 'Homeowners', count: '3,200', engagement: 82, retention: '78%', topFeature: 'Savings Dashboard', revenue: '$47/mo saved', color: '#25D695' },
  { segment: 'Renters', count: '1,800', engagement: 64, retention: '52%', topFeature: 'Score Tracking', revenue: '$22/mo saved', color: '#38BDF8' },
  { segment: 'Eco Enthusiasts', count: '1,500', engagement: 91, retention: '88%', topFeature: 'Carbon Tracking', revenue: '$8/mo credits', color: '#34D399' },
  { segment: 'Utility Customers', count: '1,200', engagement: 71, retention: '65%', topFeature: 'Bill Upload', revenue: '$35/mo saved', color: '#F59E0B' },
  { segment: 'Crypto Traders', count: '1,400', engagement: 76, retention: '58%', topFeature: 'NEX Exchange', revenue: '$120/mo traded', color: '#A78BFA' },
  { segment: 'DAO Participants', count: '900', engagement: 85, retention: '82%', topFeature: 'Governance', revenue: '12 votes/mo', color: '#EC4899' },
];

const VALUE_LOOPS = [
  {
    id: 1, name: 'Utility Savings Loop', tag: 'strongest — 94% retention', color: '#25D695',
    steps: ['Upload Bill', 'Get Score', 'Follow Recommendations', 'Reduce Usage', 'Earn Credits', 'Redeem', 'Repeat'],
    metrics: [{ label: 'Users in loop', value: '6,400' }, { label: 'Avg cycle time', value: '7 days' }, { label: 'Revenue per cycle', value: '$12.40' }],
    icon: Upload,
  },
  {
    id: 2, name: 'Infrastructure Monetization', tag: 'highest revenue', color: '#38BDF8',
    steps: ['Connect AWG', 'Verify Production', 'Mint WTR Tokens', 'Sell on NEX', 'Reinvest', 'Expand'],
    metrics: [{ label: 'Users in loop', value: '890' }, { label: 'Avg cycle time', value: '14 days' }, { label: 'Revenue per cycle', value: '$340.00' }],
    icon: Server,
  },
  {
    id: 3, name: 'Agent Trading Flywheel', tag: 'fastest growing', color: '#A78BFA',
    steps: ['Deploy Agent', 'Agent Trades', 'Agent Profits', 'Buy More Skills', 'Compound', 'Reinvest'],
    metrics: [{ label: 'Agents in loop', value: '2,100' }, { label: 'Avg cycle time', value: '1 day' }, { label: 'Revenue per cycle', value: '$8.50' }],
    icon: Bot,
  },
  {
    id: 4, name: 'Environmental Gamification', tag: 'most viral', color: '#34D399',
    steps: ['Earn Score', 'Level Up', 'Share Achievement', 'Friend Joins', 'Both Earn Bonus', 'Repeat'],
    metrics: [{ label: 'Users in loop', value: '4,200' }, { label: 'Avg cycle time', value: '3 days' }, { label: 'Viral coefficient', value: '1.4x' }],
    icon: Award,
  },
  {
    id: 5, name: 'Carbon Credit Accumulation', tag: 'ESG revenue', color: '#F59E0B',
    steps: ['Produce Water', 'Calculate Carbon Prevented', 'Mint CARB', 'Sell to ESG Buyers', 'Premium Pricing'],
    metrics: [{ label: 'Users in loop', value: '1,200' }, { label: 'Avg cycle time', value: '30 days' }, { label: 'Revenue per cycle', value: '$85.00' }],
    icon: Leaf,
  },
  {
    id: 6, name: 'NFT Impact Loop', tag: 'engagement driver', color: '#EC4899',
    steps: ['Complete Challenge', 'Earn NFT', 'NFT Unlocks Feature', 'Feature Creates Value', 'New Challenge'],
    metrics: [{ label: 'Users in loop', value: '2,847' }, { label: 'Avg cycle time', value: '12 days' }, { label: 'Engagement boost', value: '+34%' }],
    icon: Gamepad2,
  },
  {
    id: 7, name: 'DAO Governance Flywheel', tag: 'network growth', color: '#6366F1',
    steps: ['Stake Tokens', 'Vote', 'Proposal Passes', 'Network Improves', 'Token Value Rises', 'Stake More'],
    metrics: [{ label: 'Users in loop', value: '900' }, { label: 'Avg cycle time', value: '21 days' }, { label: 'Treasury growth', value: '$42/day' }],
    icon: Vote,
  },
];

const FEATURE_RANKING = [
  { rank: 1, feature: 'Savings Dashboard', engagement: 94, revenue: 82, retention: 91, viral: 68, overall: 92 },
  { rank: 2, feature: 'Environmental Score', engagement: 89, revenue: 45, retention: 87, viral: 84, overall: 88 },
  { rank: 3, feature: 'NEX Exchange', engagement: 76, revenue: 95, retention: 58, viral: 42, overall: 81 },
  { rank: 4, feature: 'NFT Giveaways', engagement: 82, revenue: 38, retention: 72, viral: 91, overall: 79 },
  { rank: 5, feature: 'AI Agent Market', engagement: 71, revenue: 88, retention: 65, viral: 35, overall: 74 },
  { rank: 6, feature: 'Water Market', engagement: 68, revenue: 72, retention: 61, viral: 28, overall: 67 },
  { rank: 7, feature: 'Governance/DAO', engagement: 62, revenue: 52, retention: 82, viral: 22, overall: 62 },
  { rank: 8, feature: 'Infrastructure Map', engagement: 58, revenue: 25, retention: 48, viral: 45, overall: 51 },
  { rank: 9, feature: 'Elementalz NFTs', engagement: 54, revenue: 68, retention: 42, viral: 55, overall: 54 },
  { rank: 10, feature: 'Transparency', engagement: 45, revenue: 12, retention: 38, viral: 18, overall: 38 },
];

const FRICTION_POINTS = [
  {
    title: 'Wallet Requirement at Onboarding', severity: 34, unit: '% drop-off',
    desc: 'Users abandon when asked to connect crypto wallet before seeing value.',
    fix: 'Wallet-free mode with delayed wallet connection. Let users see scores first.',
    impact: '+4,200 users retained',
  },
  {
    title: 'Token Complexity', severity: 28, unit: '% confusion',
    desc: "Users don't understand WTR vs ENG vs NXS.",
    fix: 'Abstract tokens as "credits" in consumer UI. Show tokens only in advanced mode.',
    impact: '+2,800 users understanding',
  },
  {
    title: 'First Reward Delay', severity: 22, unit: '% churn',
    desc: "Users who don't earn first reward within 48 hours leave.",
    fix: 'Instant welcome credit (50 credits) + first-action bonus.',
    impact: '+2,200 users retained',
  },
  {
    title: 'Agent Market Complexity', severity: 18, unit: '% confusion',
    desc: "Non-crypto users don't understand AI agents.",
    fix: '"Set and forget" templates. One-click agent deployment.',
    impact: '+1,800 agents deployed',
  },
  {
    title: 'Map Loading Performance', severity: 12, unit: '% abandonment',
    desc: '3D globe loads slowly on mobile.',
    fix: 'Progressive loading, 2D fallback on mobile.',
    impact: '+1,200 users exploring',
  },
];

const CITIES = [
  { city: 'Phoenix, AZ', type: 'Water-scarce', rate: '4.2%', rateNum: 4.2, feature: 'Water Savings', mau: '8,400' },
  { city: 'Austin, TX', type: 'Tech hub', rate: '3.8%', rateNum: 3.8, feature: 'Agent Trading', mau: '12,200' },
  { city: 'Maui, HI', type: 'Island infra', rate: '5.1%', rateNum: 5.1, feature: 'AWG Production', mau: '2,100' },
  { city: 'Lagos, Nigeria', type: 'Developing', rate: '6.8%', rateNum: 6.8, feature: 'Free Water Access', mau: '34,000' },
  { city: 'Dubai, UAE', type: 'Desert + wealth', rate: '3.2%', rateNum: 3.2, feature: 'Carbon Credits', mau: '4,800' },
  { city: 'San Juan, PR', type: 'Grid fragile', rate: '4.5%', rateNum: 4.5, feature: 'Energy Independence', mau: '3,200' },
  { city: 'Copenhagen, DK', type: 'Green leader', rate: '2.8%', rateNum: 2.8, feature: 'ESG Reporting', mau: '5,600' },
  { city: 'Mumbai, India', type: 'High density', rate: '7.2%', rateNum: 7.2, feature: 'Bill Reduction', mau: '89,000' },
];

const REVENUE_ENGINES = [
  { engine: 'Transaction Fees', model: '0.3% per trade', monthly: '$4,248', yearly: '$50,976', growth: '+15%/mo' },
  { engine: 'Mint Fees', model: '$0.10 per token', monthly: '$84,720', yearly: '$1,016,640', growth: '+22%/mo' },
  { engine: 'Carbon Certificates', model: '$2.50 per cert', monthly: '$6,675', yearly: '$80,100', growth: '+18%/mo' },
  { engine: 'Agent Marketplace', model: '5% commission', monthly: '$1,350', yearly: '$16,200', growth: '+30%/mo' },
  { engine: 'Data & Analytics', model: 'Premium subscription', monthly: '$0 (launching)', yearly: '$0', growth: 'TBD' },
  { engine: 'Infrastructure Leasing', model: 'Revenue share', monthly: '$5,400', yearly: '$64,800', growth: '+12%/mo' },
  { engine: 'Elementalz Burns', model: '30% to treasury', monthly: 'Variable', yearly: 'Variable', growth: 'Deflationary' },
];

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1: The Wedge', months: 'Months 1-3', color: '#25D695',
    items: [
      'Wallet-free bill upload + instant score',
      'Free tier with no crypto required',
      'Social sharing for scores',
      'First 10,000 users target',
    ],
  },
  {
    phase: 'Phase 2: The Engine', months: 'Months 4-8', color: '#38BDF8',
    items: [
      'Token rewards for verified savings',
      'Agent marketplace launch',
      'NEX exchange beta',
      'Infrastructure partner onboarding',
      'First $100K monthly revenue',
    ],
  },
  {
    phase: 'Phase 3: The Network', months: 'Months 9-18', color: '#A78BFA',
    items: [
      'Global city expansion',
      'Institutional carbon credit buyers',
      'Agent-to-agent autonomous economy',
      'DAO governance fully live',
      'Target: 1M users, $1M+ monthly revenue',
    ],
  },
];

const FUNNEL_STEPS = [
  { label: 'Upload', pct: 100 },
  { label: 'Score view', pct: 92 },
  { label: 'First recommendation', pct: 78 },
  { label: 'First saving', pct: 45 },
  { label: 'First credit', pct: 34 },
  { label: 'First trade', pct: 12 },
];

/* ─── Helpers ───────────────────────────────────────────── */

function rateColor(rate: number) {
  if (rate >= 6) return '#25D695';
  if (rate >= 4) return '#F59E0B';
  return '#64748B';
}

function severityColor(sev: number) {
  if (sev >= 30) return '#EF4444';
  if (sev >= 20) return '#F59E0B';
  return '#FB923C';
}

/* ─── Main Component ────────────────────────────────────── */

export default function EvolutionSimulator() {
  const [expandedLoops, setExpandedLoops] = useState<Record<number, boolean>>({ 1: true });
  const [showFriction, setShowFriction] = useState(true);
  const [showWedge, setShowWedge] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(true);

  const toggleLoop = (id: number) =>
    setExpandedLoops((prev) => ({ ...prev, [id]: !prev[id] }));

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* ── 1. Page Header ── */}
        <header className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Evolution Simulator</h1>
              <p className="text-[13px] text-[#64748B]">NexusOS Behavioral &amp; Economic Simulation Engine</p>
              <p className="text-[10px] font-mono text-[#475569] mt-1">
                {'// 10K_users \u00b7 2K_infrastructure \u00b7 3K_agents \u00b7 10_cycles'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.6)]" />
                </span>
                <span className="text-[10px] font-mono text-[#25D695] uppercase tracking-wider">Simulation Active</span>
              </div>
              <span className="text-[10px] font-mono text-[#475569]">Cycle 10/10 &middot; Converged</span>
            </div>
          </div>
        </header>

        {/* ── 2. Simulation Overview KPIs ── */}
        <section>
          <SectionHeader label="Simulation Overview" />
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {KPI_DATA.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: k.color }} />
                    <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">{k.label}</span>
                  </div>
                  <p className="text-lg font-bold font-mono" style={{ color: k.color }}>{k.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. User Segment Breakdown ── */}
        <section>
          <SectionHeader label="User Segment Breakdown" />
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#1C2432]">
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Segment</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Count</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em] min-w-[140px]">Engagement</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Retention (30d)</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Top Feature</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Avg Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {USER_SEGMENTS.map((s) => (
                    <tr key={s.segment} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{s.segment}</td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{s.count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#94A3B8] w-8">{s.engagement}</span>
                          <div className="flex-1">
                            <ScoreBar value={s.engagement} color={s.color} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{s.retention}</td>
                      <td className="px-4 py-3 text-[#94A3B8]">{s.topFeature}</td>
                      <td className="px-4 py-3 font-mono text-[#25D695]">{s.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 4. Core Value Loops ── */}
        <section>
          <SectionHeader label="Core Value Loops Discovered" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {VALUE_LOOPS.map((loop) => {
              const Icon = loop.icon;
              const isOpen = expandedLoops[loop.id] ?? false;
              return (
                <div
                  key={loop.id}
                  className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden cursor-pointer hover:border-[#25D695]/30 transition-colors"
                  onClick={() => toggleLoop(loop.id)}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${loop.color}15` }}
                      >
                        <Icon size={16} style={{ color: loop.color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">
                          Loop {loop.id}: {loop.name}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: loop.color }}>
                          {loop.tag}
                        </p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown size={14} className="text-[#475569]" />
                    ) : (
                      <ChevronRight size={14} className="text-[#475569]" />
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#1C2432]">
                      <LoopFlow steps={loop.steps} />
                      <div className="flex flex-wrap gap-4 mt-3">
                        {loop.metrics.map((m) => (
                          <div key={m.label}>
                            <p className="text-[9px] text-[#475569] uppercase tracking-wider">{m.label}</p>
                            <p className="text-[13px] font-mono font-bold" style={{ color: loop.color }}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Feature Ranking Matrix ── */}
        <section>
          <SectionHeader label="Feature Ranking Matrix" />
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#1C2432]">
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em] w-10">#</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Feature</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Engage</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Revenue</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Retain</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Viral</th>
                    <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em] min-w-[160px]">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_RANKING.map((f) => (
                    <tr key={f.rank} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-[#475569]">{f.rank}</td>
                      <td className="px-4 py-3 font-medium text-white">{f.feature}</td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{f.engagement}</td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{f.revenue}</td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{f.retention}</td>
                      <td className="px-4 py-3 font-mono text-[#94A3B8]">{f.viral}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white w-8">{f.overall}</span>
                          <div className="flex-1">
                            <ScoreBar
                              value={f.overall}
                              color={f.overall >= 80 ? '#25D695' : f.overall >= 60 ? '#F59E0B' : '#64748B'}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 6. Friction Points ── */}
        <section>
          <div
            className="flex items-center gap-2 cursor-pointer mb-4"
            onClick={() => setShowFriction(!showFriction)}
          >
            <SectionHeader label="Friction Points Detected" />
            {showFriction ? <ChevronDown size={14} className="text-[#475569] -mt-4" /> : <ChevronRight size={14} className="text-[#475569] -mt-4" />}
          </div>
          {showFriction && (
            <div className="space-y-3">
              {FRICTION_POINTS.map((fp, i) => (
                <div
                  key={i}
                  className="bg-[#111820] border rounded-lg p-4"
                  style={{ borderColor: `${severityColor(fp.severity)}30` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} style={{ color: severityColor(fp.severity) }} />
                        <span className="text-[13px] font-semibold text-white">{fp.title}</span>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ color: severityColor(fp.severity), backgroundColor: `${severityColor(fp.severity)}15` }}
                        >
                          {fp.severity}{fp.unit}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B] mb-2">{fp.desc}</p>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold text-[#475569] uppercase mt-0.5">Fix:</span>
                        <p className="text-[12px] text-[#94A3B8]">{fp.fix}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-[#475569] uppercase tracking-wider">Impact if fixed</p>
                      <p className="text-[13px] font-mono font-bold text-[#25D695]">{fp.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 7. Strategic Wedge Analysis ── */}
        <section>
          <div
            className="flex items-center gap-2 cursor-pointer mb-4"
            onClick={() => setShowWedge(!showWedge)}
          >
            <SectionHeader label="Strategic Wedge Analysis" />
            {showWedge ? <ChevronDown size={14} className="text-[#475569] -mt-4" /> : <ChevronRight size={14} className="text-[#475569] -mt-4" />}
          </div>
          {showWedge && (
            <div className="bg-[#111820] border border-[#25D695]/30 rounded-lg p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
                  <Target size={20} className="text-[#25D695]" />
                </div>
                <div>
                  <p className="text-[10px] text-[#25D695] font-mono uppercase tracking-wider">Winner</p>
                  <h3 className="text-lg font-bold text-white">Utility Bill Upload + Instant Savings Score</h3>
                </div>
              </div>

              <div>
                <p className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Why It Wins</p>
                <p className="text-[12px] text-[#94A3B8] leading-relaxed">
                  Zero friction (everyone has a utility bill), instant value (see savings potential in 10 seconds),
                  no crypto needed, naturally leads to deeper features.
                </p>
              </div>

              <div>
                <p className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Adoption Model</p>
                <LoopFlow steps={['Bill Upload', 'Score', 'Recommendations', 'Savings', 'Credits', 'Trade']} />
                <p className="text-[10px] text-[#475569] mt-1 italic">Natural escalation from consumer to crypto</p>
              </div>

              <div>
                <p className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Comparable Wedges</p>
                <p className="text-[12px] text-[#64748B]">
                  Like how Uber started with black cars, Facebook with colleges, Stripe with 7 lines of code.
                </p>
              </div>

              <div>
                <p className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-2">Projected Path</p>
                <div className="flex flex-wrap gap-6">
                  {[
                    { label: '0 \u2192 10K users', time: '3 months' },
                    { label: '10K \u2192 100K', time: '6 months' },
                    { label: '100K \u2192 1M', time: '12 months' },
                  ].map((p) => (
                    <div key={p.label}>
                      <p className="text-[13px] font-mono font-bold text-[#25D695]">{p.label}</p>
                      <p className="text-[10px] text-[#475569]">{p.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] text-[#475569] uppercase tracking-wider font-semibold mb-3">Conversion Funnel</p>
                <div className="space-y-2">
                  {FUNNEL_STEPS.map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <span className="text-[11px] text-[#94A3B8] w-36 shrink-0">{step.label}</span>
                      <div className="flex-1 h-5 bg-[#0B0F14] rounded overflow-hidden">
                        <div
                          className="h-full rounded flex items-center px-2"
                          style={{
                            width: `${step.pct}%`,
                            background: `linear-gradient(90deg, #25D695${step.pct > 50 ? '' : '88'}, #25D695${step.pct > 50 ? '88' : '44'})`,
                          }}
                        >
                          <span className="text-[10px] font-mono font-bold text-white">{step.pct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── 8. Global Adoption Heatmap ── */}
        <section>
          <div
            className="flex items-center gap-2 cursor-pointer mb-4"
            onClick={() => setShowCities(!showCities)}
          >
            <SectionHeader label="Global Adoption Heatmap" />
            {showCities ? <ChevronDown size={14} className="text-[#475569] -mt-4" /> : <ChevronRight size={14} className="text-[#475569] -mt-4" />}
          </div>
          {showCities && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CITIES.map((c) => (
                <div
                  key={c.city}
                  className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#25D695]/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={12} className="text-[#475569]" />
                    <span className="text-[13px] font-semibold text-white">{c.city}</span>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#0B0F14] px-1.5 py-0.5 rounded border border-[#1C2432] font-mono">
                    {c.type}
                  </span>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#475569]">Adoption Rate</span>
                      <span className="text-[12px] font-mono font-bold" style={{ color: rateColor(c.rateNum) }}>
                        {c.rate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#475569]">Top Feature</span>
                      <span className="text-[11px] text-[#94A3B8]">{c.feature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#475569]">Monthly Active</span>
                      <span className="text-[12px] font-mono text-white">{c.mau}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <ScoreBar value={c.rateNum} max={10} color={rateColor(c.rateNum)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 9. Revenue Engine Projection ── */}
        <section>
          <div
            className="flex items-center gap-2 cursor-pointer mb-4"
            onClick={() => setShowRevenue(!showRevenue)}
          >
            <SectionHeader label="Revenue Engine Projection" />
            {showRevenue ? <ChevronDown size={14} className="text-[#475569] -mt-4" /> : <ChevronRight size={14} className="text-[#475569] -mt-4" />}
          </div>
          {showRevenue && (
            <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#1C2432]">
                      <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Engine</th>
                      <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Model</th>
                      <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Monthly</th>
                      <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Yearly</th>
                      <th className="px-4 py-3 text-[9px] font-semibold text-[#475569] uppercase tracking-[0.1em]">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REVENUE_ENGINES.map((r) => (
                      <tr key={r.engine} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{r.engine}</td>
                        <td className="px-4 py-3 text-[#64748B] font-mono text-[11px]">{r.model}</td>
                        <td className="px-4 py-3 font-mono text-[#94A3B8]">{r.monthly}</td>
                        <td className="px-4 py-3 font-mono text-[#25D695]">{r.yearly}</td>
                        <td className="px-4 py-3 font-mono text-[#38BDF8]">{r.growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-[#1C2432] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">Total Projected Year 1</span>
                <span className="text-lg font-mono font-bold text-[#25D695]">~$1.23M</span>
              </div>
            </div>
          )}
        </section>

        {/* ── 10. Recommended Roadmap ── */}
        <section>
          <div
            className="flex items-center gap-2 cursor-pointer mb-4"
            onClick={() => setShowRoadmap(!showRoadmap)}
          >
            <SectionHeader label="Recommended Roadmap" />
            {showRoadmap ? <ChevronDown size={14} className="text-[#475569] -mt-4" /> : <ChevronRight size={14} className="text-[#475569] -mt-4" />}
          </div>
          {showRoadmap && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROADMAP_PHASES.map((phase) => (
                <div
                  key={phase.phase}
                  className="bg-[#111820] border border-[#1C2432] rounded-lg p-5 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-0.5"
                    style={{ background: `linear-gradient(90deg, ${phase.color}, transparent)` }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <Milestone size={14} style={{ color: phase.color }} />
                    <span className="text-[13px] font-bold text-white">{phase.phase}</span>
                  </div>
                  <p className="text-[10px] font-mono mb-3" style={{ color: phase.color }}>{phase.months}</p>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CircleDot size={10} className="mt-1 shrink-0" style={{ color: phase.color }} />
                        <span className="text-[12px] text-[#94A3B8]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 11. Footer ── */}
        <footer className="border-t border-[#1C2432] pt-4 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <Zap size={12} className="text-[#475569]" />
              <span className="text-[10px] font-mono text-[#475569]">
                evolution_simulator v2.0 // nexus_protocol
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#475569]">{now}</span>
          </div>
          <p className="text-[10px] font-mono text-[#475569] mt-1">
            10,000 users &middot; 2,000 nodes &middot; 3,000 agents &middot; 10 cycles
          </p>
        </footer>
      </div>
    </div>
  );
}
