/**
 * Landing — Savings-first homepage (redesigned via feedback simulation).
 * Lead with savings, not tokens. Show real value before crypto.
 * Hero → Live Network → Savings Calculator → Value Cards → Score → How It Works → Free Tier → Trust → CTA
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '@/components/health';
import {
  Droplets, Zap, Shield, Award, ArrowRight, CheckCircle2,
  FileText, Lock, Wifi, Sparkles, ChevronRight, DollarSign,
  Users, Globe, Leaf, BarChart3, Gift,
  Activity, Bot,
} from 'lucide-react';

/* ─── Live network activity simulation ────────────────────── */
const LIVE_EVENTS = [
  { text: 'Phoenix, AZ saved 1,200 gallons this week', icon: Droplets, color: '#00b8f0' },
  { text: 'Austin household reduced energy 18%', icon: Zap, color: '#f99d07' },
  { text: 'Maui AWG prevented 4.2 kg CO₂', icon: Leaf, color: '#A78BFA' },
  { text: 'New user earned first 50 credits', icon: Award, color: '#25D695' },
  { text: 'Lagos community accessed clean water', icon: Globe, color: '#00b8f0' },
  { text: 'Dubai cluster verified 2,100L production', icon: CheckCircle2, color: '#25D695' },
  { text: 'AI agent optimized delivery route', icon: Bot, color: '#A78BFA' },
  { text: 'Solar pioneer connected new installation', icon: Zap, color: '#f99d07' },
];

const NETWORK_STATS = [
  { label: 'Active Users', value: '12,847', icon: Users, color: '#25D695' },
  { label: 'Water Saved', value: '2.4M gal', icon: Droplets, color: '#00b8f0' },
  { label: 'CO₂ Prevented', value: '127.4 tons', icon: Leaf, color: '#A78BFA' },
  { label: 'Avg Monthly Savings', value: '$47/mo', icon: DollarSign, color: '#f99d07' },
];

export default function Landing() {
  const [calcBill, setCalcBill] = useState(150);
  const monthlySave = Math.round(calcBill * 0.22);
  const yearlySave = monthlySave * 12;
  const creditsEarned = Math.round(monthlySave * 3.2);

  return (
    <div className="max-w-4xl mx-auto">
      {/* ═══════════════ LIVE NETWORK STRIP ═══════════════ */}
      <div className="mb-6 overflow-hidden rounded-lg bg-[#111820] border border-[#1C2432]">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#25D695]" />
          </span>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider shrink-0">Live Network</span>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-6 animate-marquee">
              {[...LIVE_EVENTS, ...LIVE_EVENTS].map((evt, i) => {
                const Icon = evt.icon;
                return (
                  <span key={i} className="flex items-center gap-1.5 shrink-0 text-xs text-[#94A3B8]">
                    <Icon size={11} style={{ color: evt.color }} />
                    {evt.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 40s linear infinite; display: flex; width: max-content; }
        `}</style>
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="text-center py-6 sm:py-10 mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#25D695]/10 border border-[#25D695]/20 text-[11px] font-medium text-[#25D695] mb-4">
          <DollarSign size={12} /> Average users save $47/month on utility bills
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4">
          Cut Your Bills.{' '}
          <span className="text-[#25D695]">Earn Rewards.</span>
        </h1>
        <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
          NexusOS tracks your water and energy usage, finds savings automatically,
          and turns verified reductions into real rewards — free to start.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/vault/data"
            className="px-7 py-3.5 rounded-xl bg-[#25D695] text-white font-semibold text-sm hover:bg-[#1FBF84] transition-colors inline-flex items-center gap-2 shadow-[0_0_20px_rgba(37,214,149,0.15)]"
          >
            <Wifi size={16} /> Start Saving — Free
          </Link>
          <Link
            to="/today"
            className="px-7 py-3.5 rounded-xl bg-white/[0.06] text-white/90 font-medium text-sm hover:bg-white/[0.1] transition-colors border border-white/[0.08] inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> Try Demo
          </Link>
        </div>
      </section>

      {/* ═══════════════ NETWORK STATS BAR ═══════════════ */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {NETWORK_STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
              <Icon size={16} className="mx-auto mb-1.5" style={{ color: stat.color }} />
              <div className="text-lg sm:text-xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </section>

      {/* ═══════════════ SAVINGS CALCULATOR ═══════════════ */}
      <section className="p-5 sm:p-8 rounded-2xl bg-gradient-to-br from-[#25D695]/[0.06] to-transparent border border-[#25D695]/10 mb-8 sm:mb-10">
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Your Potential Savings</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">Drag the slider to see how much you could save</p>
        </div>
        <div className="max-w-md mx-auto mb-6">
          <label className="block text-xs text-[#64748B] mb-2 text-center">
            Current Monthly Utility Bill: <span className="text-white font-semibold">${calcBill}</span>
          </label>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={calcBill}
            onChange={(e) => setCalcBill(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-[#1C2432] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#25D695] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(37,214,149,0.4)]"
          />
          <div className="flex justify-between text-[10px] text-[#475569] mt-1 font-mono">
            <span>$50</span><span>$500</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <div className="text-xl sm:text-2xl font-bold text-[#25D695] tabular-nums">${monthlySave}</div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Saved / Month</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <div className="text-xl sm:text-2xl font-bold text-[#00b8f0] tabular-nums">${yearlySave}</div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Saved / Year</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <div className="text-xl sm:text-2xl font-bold text-[#f99d07] tabular-nums">{creditsEarned}</div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Credits Earned</div>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#475569] mt-3 font-mono">
          * Based on average 22% reduction for verified NexusOS users · 3.2 credits per $1 saved
        </p>
      </section>

      {/* ═══════════════ 3 VALUE CARDS ═══════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
        <ValueCard
          icon={<Droplets size={24} className="text-[#00b8f0]" />}
          color="#00b8f0"
          title="Save Money"
          description="Understand your water and energy usage. Get personalized tips to reduce waste and lower your bills."
        />
        <ValueCard
          icon={<Shield size={24} className="text-[#A78BFA]" />}
          color="#A78BFA"
          title="Prove Impact"
          description="Every saving is verified and recorded. Download certificates that anyone can trust."
        />
        <ValueCard
          icon={<Award size={24} className="text-[#25D695]" />}
          color="#25D695"
          title="Earn Rewards"
          description="Turn verified savings into credits you can redeem. No crypto knowledge needed."
        />
      </section>

      {/* ═══════════════ SCORE PREVIEW ═══════════════ */}
      <section className="p-5 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8 sm:mb-12">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Your Impact at a Glance</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">Three scores that tell you everything</p>
        </div>
        {/* Desktop */}
        <div className="hidden sm:flex items-center justify-center gap-14">
          <ScoreRing score={74} label="Water" color="#00b8f0" size={110} subtitle="Good" />
          <ScoreRing score={71} label="Impact" color="#25D695" size={130} strokeWidth={12} subtitle="Good" />
          <ScoreRing score={68} label="Energy" color="#f99d07" size={110} subtitle="Fair" />
        </div>
        {/* Mobile */}
        <div className="flex sm:hidden items-center justify-center gap-3">
          <ScoreRing score={74} label="Water" color="#00b8f0" size={80} strokeWidth={7} subtitle="Good" />
          <ScoreRing score={71} label="Impact" color="#25D695" size={95} strokeWidth={9} subtitle="Good" />
          <ScoreRing score={68} label="Energy" color="#f99d07" size={80} strokeWidth={7} subtitle="Fair" />
        </div>
        <div className="text-center mt-6">
          <Link
            to="/scores"
            className="text-sm text-[#25D695] hover:text-[#1FBF84] inline-flex items-center gap-1 transition-colors"
          >
            See your full score breakdown <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">How It Works</h2>
          <p className="text-sm text-[#64748B]">Three simple steps to start earning</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StepCard
            step={1}
            title="Connect"
            description="Link your utility provider or upload a bill. Optionally connect a smart meter for real-time data."
            icon={<Wifi size={20} className="text-[#00b8f0]" />}
          />
          <StepCard
            step={2}
            title="Verify"
            description="Our system automatically checks your bills, detects fraud, and verifies your actual savings."
            icon={<CheckCircle2 size={20} className="text-[#A78BFA]" />}
          />
          <StepCard
            step={3}
            title="Reward"
            description="Verified savings become credits. Redeem them to your wallet, gift cards, or bank account."
            icon={<Award size={20} className="text-[#25D695]" />}
          />
        </div>
      </section>

      {/* ═══════════════ TRUST SECTION ═══════════════ */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-[#A78BFA]/[0.06] to-transparent border border-[#A78BFA]/10 mb-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center">
            <Lock size={20} className="text-[#A78BFA]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Built on Trust</h2>
            <p className="text-sm text-[#64748B]">Your privacy and data security are non-negotiable</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TrustItem
            icon={<Lock size={14} className="text-[#A78BFA]" />}
            label="Private by default"
            detail="We never share your personal data. You control what's visible."
          />
          <TrustItem
            icon={<FileText size={14} className="text-[#00b8f0]" />}
            label="Auditable receipts"
            detail="Every verification creates a permanent, tamper-proof receipt."
          />
          <TrustItem
            icon={<Shield size={14} className="text-[#25D695]" />}
            label="Fraud protection"
            detail="Multi-layer fraud detection keeps the system honest."
          />
        </div>
        <div className="text-center mt-4">
          <Link
            to="/vault/trust"
            className="text-sm text-[#A78BFA] hover:text-[#C4B5FD] inline-flex items-center gap-1 transition-colors"
          >
            Visit Trust Center <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ═══════════════ WATER-AS-A-SERVICE FREE TIER ═══════════════ */}
      <section className="mb-8 sm:mb-12">
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Free Forever Plan</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">Water-as-a-Service · No credit card · No crypto needed</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FreeTierCard
            title="Track & Save"
            features={['Unlimited utility connections', 'Real-time usage monitoring', 'AI savings recommendations', 'Monthly impact reports']}
            price="Free"
            color="#25D695"
          />
          <FreeTierCard
            title="Verify & Earn"
            features={['Automated bill verification', 'Credits for verified savings', 'Redeem to gift cards or bank', 'Impact certificates']}
            price="Free"
            color="#00b8f0"
            highlighted
          />
          <FreeTierCard
            title="Trade & Grow"
            features={['Environmental asset exchange', 'Token rewards (WTR/ENG)', 'DAO governance voting', 'AI agent marketplace']}
            price="Free*"
            footnote="*0.3% fee on trades"
            color="#A78BFA"
          />
        </div>
      </section>

      {/* ═══════════════ EXPLORE FEATURES ═══════════════ */}
      <section className="mb-8 sm:mb-12">
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Explore the Platform</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">More ways to save, earn, and impact the world</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/water-market" className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#00b8f0]/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-[#00b8f0]" />
              <h3 className="text-sm font-semibold text-white">Water Market</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-2">Bloomberg-style water commodity and carbon offset market data.</p>
            <span className="text-xs text-[#00b8f0] group-hover:text-[#00b8f0]/80 inline-flex items-center gap-1 transition-colors">
              Explore Market <ArrowRight size={10} />
            </span>
          </Link>
          <Link to="/nex" className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#25D695]/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-[#25D695]" />
              <h3 className="text-sm font-semibold text-white">NEX Exchange</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-2">Trade environmental assets on the first decentralized green exchange.</p>
            <span className="text-xs text-[#25D695] group-hover:text-[#25D695]/80 inline-flex items-center gap-1 transition-colors">
              View Exchange <ArrowRight size={10} />
            </span>
          </Link>
          <Link to="/giveaways" className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#f99d07]/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-[#f99d07]" />
              <h3 className="text-sm font-semibold text-white">NFT Drops</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-2">Earn unique NFTs by saving water, reducing emissions, and verifying impact.</p>
            <span className="text-xs text-[#f99d07] group-hover:text-[#f99d07]/80 inline-flex items-center gap-1 transition-colors">
              View Campaigns <ArrowRight size={10} />
            </span>
          </Link>
        </div>
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <section className="text-center py-10 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Start saving today — it's free</h2>
        <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
          Join 12,847 people already tracking their impact and earning rewards for real-world savings.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/vault/data"
            className="px-7 py-3.5 rounded-xl bg-[#25D695] text-white font-semibold text-sm hover:bg-[#1FBF84] transition-colors shadow-[0_0_20px_rgba(37,214,149,0.15)]"
          >
            Connect Utilities — Free
          </Link>
          <Link
            to="/today"
            className="px-7 py-3.5 rounded-xl bg-white/[0.06] text-white/90 font-medium text-sm border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function ValueCard({ icon, color, title, description }: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}12` }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ step, title, description, icon }: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] relative">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#25D695]/15 text-[#25D695] flex items-center justify-center text-sm font-bold">
          {step}
        </div>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}

function TrustItem({ icon, label, detail }: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.03]">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-sm font-medium text-white/90">{label}</span>
      </div>
      <p className="text-xs text-[#64748B] leading-relaxed">{detail}</p>
    </div>
  );
}

function FreeTierCard({ title, features, price, footnote, color, highlighted }: {
  title: string;
  features: string[];
  price: string;
  footnote?: string;
  color: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl transition-all ${
      highlighted
        ? 'bg-white/[0.04] border-2 border-[#00b8f0]/30 shadow-[0_0_24px_rgba(0,184,240,0.06)]'
        : 'bg-white/[0.02] border border-white/[0.06]'
    }`}>
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <div className="text-2xl font-bold" style={{ color }}>{price}</div>
        {footnote && <div className="text-[10px] text-[#475569] mt-0.5">{footnote}</div>}
      </div>
      <ul className="space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-[#94A3B8]">
            <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
