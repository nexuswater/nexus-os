/**
 * Feedback Lab — Product Intelligence Dashboard.
 * Simulated feedback loop engine: persona journeys, value hotspots, feature analytics.
 */
import { useState } from 'react';
import {
  Brain, Users, Grid3x3, Flame, Lightbulb, Rocket,
  Home, Leaf, Zap, Building2, Sun, Coins, Image, Briefcase,
  ChevronDown, ChevronUp, BarChart3, Target, Share2, AlertTriangle,
  Shield, Eye, TrendingUp, Star, ArrowRight, Sparkles,
  MousePointerClick, RotateCcw, Lock as LockIcon, Megaphone,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface Persona {
  name: string;
  icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  description: string;
  firstValue: string;
  biggestConfusion: string;
  returnDriver: string;
  shareTrigger: string;
  engagementScore: number;
  trustScore: number;
}

interface FeatureRow {
  name: string;
  userValue: 'high' | 'med' | 'low';
  enterpriseValue: 'high' | 'med' | 'low';
  agentValue: 'high' | 'med' | 'low';
  frictionLevel: 'low' | 'med' | 'high';
  trustRequired: 'low' | 'med' | 'high';
  engagementScore: number;
  shareabilityScore: number;
  verdict: 'Front & Center' | 'Simplify First' | 'Hide Until Later' | 'Deprioritize';
}

interface Recommendation {
  title: string;
  body: string;
  color: string;
}

interface WedgeItem {
  label: string;
  stars: number;
}

// ─── Mock Data ──────────────────────────────────────────────

const PERSONAS: Persona[] = [
  {
    name: 'Homeowner',
    icon: Home,
    color: '#25D695',
    description: 'Residential user tracking water & energy savings',
    firstValue: 'Seeing their first monthly savings estimate',
    biggestConfusion: '"What do tokens have to do with my water bill?"',
    returnDriver: 'Streak rewards + rising impact score',
    shareTrigger: 'Sharing their savings total on social media',
    engagementScore: 82,
    trustScore: 71,
  },
  {
    name: 'ESG Consumer',
    icon: Leaf,
    color: '#4ADE80',
    description: 'Eco-conscious buyer who wants proof of impact',
    firstValue: 'Verified proof that their actions matter',
    biggestConfusion: '"How is my impact actually measured?"',
    returnDriver: 'Impact score improvements + badges',
    shareTrigger: 'Sharing verified impact certificates',
    engagementScore: 74,
    trustScore: 85,
  },
  {
    name: 'Utility Operator',
    icon: Zap,
    color: '#F59E0B',
    description: 'Water/energy utility managing infrastructure',
    firstValue: 'Real-time consumption analytics dashboard',
    biggestConfusion: '"How does this integrate with our SCADA system?"',
    returnDriver: 'Operational cost savings reports',
    shareTrigger: 'Board-level ESG compliance reports',
    engagementScore: 68,
    trustScore: 79,
  },
  {
    name: 'Commercial Owner',
    icon: Building2,
    color: '#3B82F6',
    description: 'Building owner optimizing resource efficiency',
    firstValue: 'ROI projection on water/energy optimization',
    biggestConfusion: '"What is the payback period?"',
    returnDriver: 'Monthly savings dashboards + tax incentives',
    shareTrigger: 'Case study results shared with peers',
    engagementScore: 72,
    trustScore: 76,
  },
  {
    name: 'Off-Grid User',
    icon: Sun,
    color: '#FB923C',
    description: 'Self-sufficient user managing own resources',
    firstValue: 'Monitoring their rainwater & solar production',
    biggestConfusion: '"Do I need internet connectivity for this?"',
    returnDriver: 'Self-sufficiency metrics + community rankings',
    shareTrigger: 'Off-grid independence milestones',
    engagementScore: 65,
    trustScore: 63,
  },
  {
    name: 'Crypto-Native',
    icon: Coins,
    color: '#A78BFA',
    description: 'DeFi user seeking yield on environmental assets',
    firstValue: 'First token swap or liquidity position',
    biggestConfusion: '"Where is the DEX? Why can\'t I just trade?"',
    returnDriver: 'Yield opportunities + new token listings',
    shareTrigger: 'Profit screenshots & APY flex',
    engagementScore: 78,
    trustScore: 52,
  },
  {
    name: 'NFT Collector',
    icon: Image,
    color: '#EC4899',
    description: 'Collector interested in impact-backed NFTs',
    firstValue: 'Minting their first free impact NFT',
    biggestConfusion: '"Are these NFTs worth anything?"',
    returnDriver: 'New drops + rarity reveals + community',
    shareTrigger: 'Showcasing rare NFTs on social profiles',
    engagementScore: 71,
    trustScore: 48,
  },
  {
    name: 'Enterprise ESG',
    icon: Briefcase,
    color: '#06B6D4',
    description: 'Corporate team managing ESG reporting & compliance',
    firstValue: 'Automated ESG report generation',
    biggestConfusion: '"How does this map to GRI/SASB frameworks?"',
    returnDriver: 'Quarterly reporting automation + audit trails',
    shareTrigger: 'Publishing sustainability reports with verified data',
    engagementScore: 61,
    trustScore: 88,
  },
];

const FEATURES: FeatureRow[] = [
  {
    name: 'Impact Score Dashboard',
    userValue: 'high',
    enterpriseValue: 'high',
    agentValue: 'med',
    frictionLevel: 'low',
    trustRequired: 'low',
    engagementScore: 94,
    shareabilityScore: 82,
    verdict: 'Front & Center',
  },
  {
    name: 'Water & Energy Savings Calculator',
    userValue: 'high',
    enterpriseValue: 'high',
    agentValue: 'low',
    frictionLevel: 'low',
    trustRequired: 'low',
    engagementScore: 91,
    shareabilityScore: 78,
    verdict: 'Front & Center',
  },
  {
    name: 'Rewards & Redemption',
    userValue: 'high',
    enterpriseValue: 'med',
    agentValue: 'med',
    frictionLevel: 'low',
    trustRequired: 'med',
    engagementScore: 88,
    shareabilityScore: 71,
    verdict: 'Front & Center',
  },
  {
    name: 'Proof / Verification Vault',
    userValue: 'high',
    enterpriseValue: 'high',
    agentValue: 'high',
    frictionLevel: 'med',
    trustRequired: 'high',
    engagementScore: 76,
    shareabilityScore: 65,
    verdict: 'Front & Center',
  },
  {
    name: 'NFT Giveaways',
    userValue: 'med',
    enterpriseValue: 'low',
    agentValue: 'low',
    frictionLevel: 'low',
    trustRequired: 'low',
    engagementScore: 83,
    shareabilityScore: 95,
    verdict: 'Front & Center',
  },
  {
    name: 'Infrastructure Map',
    userValue: 'med',
    enterpriseValue: 'high',
    agentValue: 'med',
    frictionLevel: 'low',
    trustRequired: 'low',
    engagementScore: 79,
    shareabilityScore: 72,
    verdict: 'Simplify First',
  },
  {
    name: 'AI Agent Skills Market',
    userValue: 'low',
    enterpriseValue: 'high',
    agentValue: 'high',
    frictionLevel: 'high',
    trustRequired: 'high',
    engagementScore: 62,
    shareabilityScore: 45,
    verdict: 'Hide Until Later',
  },
  {
    name: 'Governance / Voting',
    userValue: 'med',
    enterpriseValue: 'med',
    agentValue: 'med',
    frictionLevel: 'med',
    trustRequired: 'med',
    engagementScore: 58,
    shareabilityScore: 42,
    verdict: 'Hide Until Later',
  },
  {
    name: 'Token Trading / Swap',
    userValue: 'med',
    enterpriseValue: 'low',
    agentValue: 'med',
    frictionLevel: 'high',
    trustRequired: 'high',
    engagementScore: 64,
    shareabilityScore: 55,
    verdict: 'Hide Until Later',
  },
  {
    name: 'Water Market / Trading',
    userValue: 'low',
    enterpriseValue: 'high',
    agentValue: 'high',
    frictionLevel: 'high',
    trustRequired: 'high',
    engagementScore: 48,
    shareabilityScore: 38,
    verdict: 'Simplify First',
  },
  {
    name: 'Logistics Tracking',
    userValue: 'low',
    enterpriseValue: 'high',
    agentValue: 'high',
    frictionLevel: 'med',
    trustRequired: 'med',
    engagementScore: 52,
    shareabilityScore: 31,
    verdict: 'Hide Until Later',
  },
  {
    name: 'Carbon Credit Dashboard',
    userValue: 'low',
    enterpriseValue: 'high',
    agentValue: 'med',
    frictionLevel: 'high',
    trustRequired: 'high',
    engagementScore: 46,
    shareabilityScore: 35,
    verdict: 'Simplify First',
  },
  {
    name: 'Elementalz Game',
    userValue: 'med',
    enterpriseValue: 'low',
    agentValue: 'low',
    frictionLevel: 'med',
    trustRequired: 'low',
    engagementScore: 74,
    shareabilityScore: 68,
    verdict: 'Deprioritize',
  },
];

const RECOMMENDATIONS: Recommendation[] = [
  {
    title: 'Lead with savings, not tokens',
    body: 'Hero the Impact Dashboard as the landing experience. Users care about dollars saved and gallons conserved, not token mechanics. Show savings first, explain the system later.',
    color: '#25D695',
  },
  {
    title: 'Water-as-a-Service = killer wedge',
    body: 'A free tier that monitors water usage and suggests savings is the lowest-friction entry point. No wallet, no tokens, no blockchain jargon needed to start.',
    color: '#3B82F6',
  },
  {
    title: 'Hide complexity, surface benefits',
    body: 'Rename tokens as "credits" in the UX. Users see "earn credits" not "mint tokens." The crypto rail powers it, but the user never needs to know.',
    color: '#F59E0B',
  },
  {
    title: 'NFTs must be useful, not collectible',
    body: 'Impact NFTs should unlock real benefits: utility discounts, priority access, verification badges. Pure collectibility without utility leads to churn.',
    color: '#EC4899',
  },
  {
    title: 'Agents should be invisible',
    body: 'Users see results, not agents. "Your bill was optimized" beats "Agent BillingBot-v3 executed skill optimize_tariff." Surface outcomes, hide orchestration.',
    color: '#A78BFA',
  },
];

const WEDGES: WedgeItem[] = [
  { label: 'Home / Business Savings Dashboard', stars: 5 },
  { label: 'Water-as-a-Service Free Tier', stars: 5 },
  { label: 'Verified Impact + Proof Vault', stars: 4 },
  { label: 'NFT-Powered Onboarding', stars: 4 },
  { label: 'Enterprise ESG Dashboard', stars: 3 },
  { label: 'AI Agent Marketplace', stars: 3 },
  { label: 'Environmental Asset Trading', stars: 2 },
  { label: 'Tokenized Logistics', stars: 2 },
  { label: 'Micro Carbon Credits', stars: 2 },
];

const HEATMAP_DATA = {
  mostClicked: [
    { label: 'Today Dashboard', pct: 34, color: '#25D695' },
    { label: 'Rewards', pct: 22, color: '#F59E0B' },
    { label: 'Scores', pct: 18, color: '#3B82F6' },
    { label: 'Map', pct: 12, color: '#A78BFA' },
    { label: 'Other', pct: 14, color: '#475569' },
  ],
  mostReturned: [
    { label: 'Today', pct: 41, color: '#25D695' },
    { label: 'Rewards', pct: 28, color: '#F59E0B' },
    { label: 'Improve', pct: 15, color: '#3B82F6' },
    { label: 'Other', pct: 16, color: '#475569' },
  ],
  highestTrust: [
    { label: 'Verification Vault', score: 92, color: '#25D695' },
    { label: 'Receipts', score: 88, color: '#4ADE80' },
    { label: 'Impact Score', score: 84, color: '#3B82F6' },
    { label: 'Proof System', score: 81, color: '#06B6D4' },
  ],
  mostViral: [
    { label: 'NFT Giveaways', pct: 23, color: '#EC4899' },
    { label: 'Impact Score', pct: 18, color: '#25D695' },
    { label: 'Map', pct: 15, color: '#A78BFA' },
    { label: 'Rewards', pct: 11, color: '#F59E0B' },
  ],
  bottlenecks: [
    { label: 'Wallet Connection', pct: 47, color: '#EF4444' },
    { label: 'Token Concepts', pct: 31, color: '#F97316' },
    { label: 'KYC Flow', pct: 24, color: '#FBBF24' },
    { label: 'Agent Config', pct: 19, color: '#FB923C' },
  ],
};

// ─── Helper Components ──────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.FC<{ size?: number; className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
        <Icon size={16} className="text-[#25D695]" />
      </div>
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
        {label}
      </h2>
    </div>
  );
}

function ValueBadge({ level }: { level: 'high' | 'med' | 'low' }) {
  const config = {
    high: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    med: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    low: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  };
  return (
    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${config[level]}`}>
      {level}
    </span>
  );
}

function FrictionBadge({ level }: { level: 'low' | 'med' | 'high' }) {
  const config = {
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    med: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  return (
    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${config[level]}`}>
      {level}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: FeatureRow['verdict'] }) {
  const config: Record<FeatureRow['verdict'], string> = {
    'Front & Center': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'Simplify First': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'Hide Until Later': 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    'Deprioritize': 'text-gray-500 bg-gray-500/10 border-gray-500/30',
  };
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${config[verdict]}`}>
      {verdict}
    </span>
  );
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-[#1C2432] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-7 text-right">{value}</span>
    </div>
  );
}

function HorizontalBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#1C2432] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function TrustBar({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-[#1C2432] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < count ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#1C2432]'}
        />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function FeedbackLab() {
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const visibleFeatures = showAllFeatures ? FEATURES : FEATURES.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#25D695]/10 flex items-center justify-center">
            <Brain size={20} className="text-[#25D695]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Product Intelligence</h1>
            <p className="text-xs text-[#64748B]">Feedback Lab &mdash; Simulated user behavior &amp; feature analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#475569]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
            SIMULATION ACTIVE
          </div>
          <span className="text-[10px] font-mono text-[#475569]">8 Personas &middot; 13 Features &middot; 5 Wedges</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          A. PERSONA SIMULATION PANEL
          ════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Users} label="Persona Simulation Panel" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isExpanded = expandedPersona === persona.name;

            return (
              <div
                key={persona.name}
                onClick={() => setExpandedPersona(isExpanded ? null : persona.name)}
                className="bg-[#111820] rounded-lg border border-[#1C2432] p-4 cursor-pointer transition-all hover:border-[#25D695]/30 hover:shadow-[0_0_20px_rgba(37,214,149,0.04)] group"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${persona.color}15` }}
                  >
                    <Icon size={18} style={{ color: persona.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#25D695] transition-colors">
                      {persona.name}
                    </h3>
                    <p className="text-[10px] text-[#64748B] truncate">{persona.description}</p>
                  </div>
                  <div className="shrink-0 text-[#475569]">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Scores */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569]">Engagement</span>
                    </div>
                    <ScoreBar value={persona.engagementScore} color={persona.color} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569]">Trust</span>
                    </div>
                    <ScoreBar value={persona.trustScore} color="#3B82F6" />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-[#1C2432] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={10} className="text-[#25D695]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#25D695]">First Value Moment</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{persona.firstValue}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={10} className="text-[#F59E0B]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#F59E0B]">Biggest Confusion</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed italic">{persona.biggestConfusion}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <RotateCcw size={10} className="text-[#3B82F6]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#3B82F6]">Return Driver</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{persona.returnDriver}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Share2 size={10} className="text-[#EC4899]" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#EC4899]">Share Trigger</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{persona.shareTrigger}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          B. FEATURE VALUE MATRIX
          ════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Grid3x3} label="Feature Value Matrix" />
        <div className="bg-[#111820] rounded-lg border border-[#1C2432] overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(180px,2fr)_repeat(5,minmax(60px,1fr))_repeat(2,minmax(50px,0.8fr))_minmax(120px,1.2fr)] gap-2 px-4 py-3 border-b border-[#1C2432] bg-[#0B0F14]">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569]">Feature</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">User</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Enterprise</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Agent</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Friction</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Trust Req</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Engage</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-center">Share</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#475569] text-right">Verdict</span>
          </div>

          {/* Desktop Rows */}
          <div className="hidden lg:block divide-y divide-[#1C2432]">
            {visibleFeatures.map((feature, i) => (
              <div
                key={feature.name}
                className="grid grid-cols-[minmax(180px,2fr)_repeat(5,minmax(60px,1fr))_repeat(2,minmax(50px,0.8fr))_minmax(120px,1.2fr)] gap-2 px-4 py-3 items-center hover:bg-[#1C2432]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#475569] w-5">{i + 1}.</span>
                  <span className="text-sm text-white truncate">{feature.name}</span>
                </div>
                <div className="text-center"><ValueBadge level={feature.userValue} /></div>
                <div className="text-center"><ValueBadge level={feature.enterpriseValue} /></div>
                <div className="text-center"><ValueBadge level={feature.agentValue} /></div>
                <div className="text-center"><FrictionBadge level={feature.frictionLevel} /></div>
                <div className="text-center"><FrictionBadge level={feature.trustRequired} /></div>
                <div className="text-center text-xs font-mono text-gray-300">{feature.engagementScore}</div>
                <div className="text-center text-xs font-mono text-gray-300">{feature.shareabilityScore}</div>
                <div className="text-right"><VerdictBadge verdict={feature.verdict} /></div>
              </div>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-[#1C2432]">
            {visibleFeatures.map((feature, i) => (
              <div key={feature.name} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#475569]">{i + 1}.</span>
                    <span className="text-sm font-medium text-white">{feature.name}</span>
                  </div>
                  <VerdictBadge verdict={feature.verdict} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">User</div>
                    <ValueBadge level={feature.userValue} />
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">Enterprise</div>
                    <ValueBadge level={feature.enterpriseValue} />
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">Agent</div>
                    <ValueBadge level={feature.agentValue} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">Friction</div>
                    <FrictionBadge level={feature.frictionLevel} />
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">Trust Req</div>
                    <FrictionBadge level={feature.trustRequired} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[#475569]">Engage: <span className="text-gray-300 font-mono">{feature.engagementScore}</span></span>
                    <span className="text-[#475569]">Share: <span className="text-gray-300 font-mono">{feature.shareabilityScore}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More / Less */}
          {FEATURES.length > 8 && (
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-mono text-[#25D695] hover:text-[#25D695]/80 border-t border-[#1C2432] transition-colors"
            >
              {showAllFeatures ? (
                <>Show Less <ChevronUp size={12} /></>
              ) : (
                <>Show All {FEATURES.length} Features <ChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          C. ENGAGEMENT HEATMAP
          ════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Flame} label="Engagement Heatmap" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Most Clicked */}
          <div className="bg-[#111820] rounded-lg border border-[#1C2432] p-4">
            <div className="flex items-center gap-2 mb-4">
              <MousePointerClick size={14} className="text-[#25D695]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Most Clicked</span>
            </div>
            <div className="space-y-3">
              {HEATMAP_DATA.mostClicked.map((item) => (
                <HorizontalBar key={item.label} label={item.label} pct={item.pct} color={item.color} />
              ))}
            </div>
          </div>

          {/* Most Returned-To */}
          <div className="bg-[#111820] rounded-lg border border-[#1C2432] p-4">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw size={14} className="text-[#3B82F6]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Most Returned-To</span>
            </div>
            <div className="space-y-3">
              {HEATMAP_DATA.mostReturned.map((item) => (
                <HorizontalBar key={item.label} label={item.label} pct={item.pct} color={item.color} />
              ))}
            </div>
          </div>

          {/* Highest Trust */}
          <div className="bg-[#111820] rounded-lg border border-[#1C2432] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-[#06B6D4]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Highest Trust</span>
            </div>
            <div className="space-y-3">
              {HEATMAP_DATA.highestTrust.map((item) => (
                <TrustBar key={item.label} label={item.label} score={item.score} color={item.color} />
              ))}
            </div>
          </div>

          {/* Most Viral */}
          <div className="bg-[#111820] rounded-lg border border-[#1C2432] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={14} className="text-[#EC4899]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Most Viral (Share Rate)</span>
            </div>
            <div className="space-y-3">
              {HEATMAP_DATA.mostViral.map((item) => (
                <HorizontalBar key={item.label} label={item.label} pct={item.pct} color={item.color} />
              ))}
            </div>
          </div>

          {/* Biggest Bottlenecks */}
          <div className="bg-[#111820] rounded-lg border border-[#1C2432] p-4 md:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-[#EF4444]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Biggest Bottlenecks (Dropoff %)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {HEATMAP_DATA.bottlenecks.map((item) => (
                <HorizontalBar key={item.label} label={item.label} pct={item.pct} color={item.color} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          D. RECOMMENDATION ENGINE SUMMARY
          ════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Lightbulb} label="Recommendation Engine Summary" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {RECOMMENDATIONS.map((rec, i) => (
            <div
              key={rec.title}
              className="bg-[#111820] rounded-lg border border-[#1C2432] p-4 hover:border-[#25D695]/20 transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                  style={{ backgroundColor: `${rec.color}15`, color: rec.color }}
                >
                  {i + 1}
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: rec.color }}
                />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-[#25D695] transition-colors">
                {rec.title}
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {rec.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          E. GO-TO-MARKET WEDGE RANKING
          ════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader icon={Rocket} label="Go-To-Market Wedge Ranking" />
        <div className="bg-[#111820] rounded-lg border border-[#1C2432] overflow-hidden">
          <div className="divide-y divide-[#1C2432]">
            {WEDGES.map((wedge, i) => (
              <div
                key={wedge.label}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[#1C2432]/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0B0F14] border border-[#1C2432] flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold text-[#64748B]">{i + 1}</span>
                </div>
                <span className="text-sm text-white flex-1">{wedge.label}</span>
                <StarRating count={wedge.stars} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer summary */}
      <div className="p-5 rounded-lg bg-gradient-to-r from-[#25D695]/[0.06] to-transparent border border-[#25D695]/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#25D695]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Target size={16} className="text-[#25D695]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Primary GTM Recommendation</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Launch with the Home/Business Savings Dashboard as the hero experience. Gate advanced features
              behind engagement milestones. Use NFT drops for viral onboarding, then convert attention into
              verified impact participation. Enterprise ESG follows as a B2B upsell once consumer trust
              is established.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
