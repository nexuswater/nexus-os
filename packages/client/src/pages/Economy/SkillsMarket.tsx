/**
 * Skills Market — Browse, quote, and execute agent skills.
 * Apple-simple layout, Stripe-clean card design.
 */
import { useState, useMemo } from 'react';
import {
  Search, Star, X, CheckCircle2, ShieldCheck, ShieldOff,
  Tag, ArrowRight, FileText, Download, ChevronRight, Sparkles,
} from 'lucide-react';
import { generateEconAgents, generateEconSkills, generateFeeConfig } from '@/mock/generators/economy';

// ─── Types ─────────────────────────────────────────────────

type SkillCategory = 'VERIFICATION' | 'SETTLEMENT' | 'SCORING' | 'ORACLE' | 'COMPLIANCE' | 'UTILITY';
type VerificationLevel = 'PREMIUM' | 'VERIFIED' | 'UNVERIFIED';

// ─── Constants ─────────────────────────────────────────────

const CATEGORIES: SkillCategory[] = [
  'VERIFICATION', 'SETTLEMENT', 'SCORING', 'ORACLE', 'COMPLIANCE', 'UTILITY',
];

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  VERIFICATION: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  SETTLEMENT:   'text-[#25D695] bg-[#25D695]/10 border-[#25D695]/30',
  SCORING:      'text-sky-400 bg-sky-400/10 border-sky-400/30',
  ORACLE:       'text-amber-400 bg-amber-400/10 border-amber-400/30',
  COMPLIANCE:   'text-pink-400 bg-pink-400/10 border-pink-400/30',
  UTILITY:      'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

const TRUST_CONFIG: Record<VerificationLevel, { label: string; color: string; icon: typeof ShieldCheck }> = {
  PREMIUM:    { label: 'Premium',    color: 'text-amber-400',    icon: ShieldCheck },
  VERIFIED:   { label: 'Verified',   color: 'text-[#25D695]',    icon: ShieldCheck },
  UNVERIFIED: { label: 'Unverified', color: 'text-gray-500',     icon: ShieldOff },
};

const PRICING_LABELS: Record<string, string> = {
  PER_CALL:       'per call',
  PER_DOC:        'per doc',
  PER_1K_EVENTS:  'per 1K events',
  SUCCESS_FEE:    'success fee',
  SUBSCRIPTION:   'per month',
};

// ─── Main Component ────────────────────────────────────────

export default function SkillsMarket() {
  const agents = useMemo(() => generateEconAgents(), []);
  const skills = useMemo(() => generateEconSkills(), []);
  const feeConfig = useMemo(() => generateFeeConfig(), []);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'ALL'>('ALL');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<(typeof skills)[number] | null>(null);
  const [quoteResult, setQuoteResult] = useState<{
    total: number;
    platformFee: number;
    sellerPayout: number;
    receiptFee: number;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');

  // ── Filtered skills ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = skills.filter(s => s.enabled);
    if (activeCategory !== 'ALL') {
      list = list.filter(s => s.category === activeCategory);
    }
    if (featuredOnly) {
      list = list.filter(s => s.listing.featuredRank <= 6);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.listing.tags.some(t => t.includes(q))
      );
    }
    return list;
  }, [skills, activeCategory, featuredOnly, search]);

  // ── Helpers ──────────────────────────────────────────────

  const getAgent = (agentId: string) => agents.find(a => a.id === agentId);

  const formatPrice = (skill: (typeof skills)[number]) => {
    if (skill.pricingModel === 'SUCCESS_FEE') {
      return `${skill.successFeeBps / 100}%`;
    }
    return `$${skill.basePrice.toFixed(2)}`;
  };

  const computeQuote = (skill: (typeof skills)[number]) => {
    const base = skill.pricingModel === 'SUCCESS_FEE' ? 1.00 : skill.basePrice;
    const platformFee = +(base * feeConfig.platformTakeRateBps / 10000).toFixed(4);
    const receiptFee = feeConfig.receiptFlatFee;
    const sellerPayout = +(base - platformFee - receiptFee).toFixed(4);
    return {
      total: +base.toFixed(2),
      platformFee: +platformFee.toFixed(4),
      sellerPayout: Math.max(0, +sellerPayout.toFixed(4)),
      receiptFee,
    };
  };

  const handleGetQuote = (skill: (typeof skills)[number]) => {
    setSelectedSkill(skill);
    setQuoteResult(computeQuote(skill));
    setShowSuccess(false);
  };

  const handleBuyAndRun = () => {
    const id = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    setReceiptId(id);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setSelectedSkill(null);
    setQuoteResult(null);
    setShowSuccess(false);
    setReceiptId('');
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Top Bar: Search + Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search skills, agents, tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111820] border border-[#1C2432] rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 font-mono focus:outline-none focus:border-[#25D695]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category pills + Featured toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              activeCategory === 'ALL'
                ? 'bg-[#25D695]/10 text-[#25D695] border-[#25D695]/30'
                : 'text-gray-500 border-[#1C2432] hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'ALL' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : 'text-gray-500 border-[#1C2432] hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setFeaturedOnly(!featuredOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                featuredOnly
                  ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                  : 'text-gray-500 border-[#1C2432] hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Star size={12} />
              Featured
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(skill => {
          const agent = getAgent(skill.agentId);
          const trust = TRUST_CONFIG[agent?.verificationLevel as VerificationLevel] ?? TRUST_CONFIG.UNVERIFIED;
          const TrustIcon = trust.icon;

          return (
            <div
              key={skill.id}
              onClick={() => handleGetQuote(skill)}
              className="bg-[#111820] rounded-lg border border-[#1C2432] p-4 cursor-pointer transition-all hover:border-[#25D695]/30 hover:shadow-[0_0_20px_rgba(37,214,149,0.04)] group"
            >
              {/* Header: Name + Category */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#25D695] transition-colors">
                    {skill.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                    {agent?.name ?? 'Unknown Agent'}
                  </p>
                </div>
                <span className={`shrink-0 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[skill.category as SkillCategory]}`}>
                  {skill.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                {skill.description}
              </p>

              {/* Price + Trust */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-base font-bold font-mono text-white">
                    {formatPrice(skill)}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-1">
                    {PRICING_LABELS[skill.pricingModel] ?? skill.pricingModel.toLowerCase()}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono ${trust.color}`}>
                  <TrustIcon size={12} />
                  {trust.label}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {skill.listing.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[9px] font-mono text-gray-500 bg-[#1C2432]/60 px-2 py-0.5 rounded-full"
                  >
                    <Tag size={8} />
                    {tag}
                  </span>
                ))}
                {skill.listing.visibility === 'PARTNER_ONLY' && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Partner
                  </span>
                )}
              </div>

              {/* CTA */}
              <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium font-mono transition-all bg-[#1C2432] text-gray-400 group-hover:bg-[#25D695] group-hover:text-[#0B0F14]">
                <Sparkles size={12} />
                Get Quote
                <ChevronRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-mono text-gray-500">No skills match your filters</p>
          <p className="text-[10px] font-mono text-gray-700 mt-1">Try adjusting your search or category</p>
        </div>
      )}

      {/* ── Skill Detail / Quote Drawer ─────────────────────── */}
      {selectedSkill && !showSuccess && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Panel */}
          <div className="relative w-full max-w-lg mx-3 sm:mx-4 mb-0 sm:mb-0 bg-[#111820] border border-[#1C2432] rounded-t-2xl sm:rounded-xl shadow-2xl fade-in" style={{ maxHeight: '92vh', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-300 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-0">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            {/* Scrollable content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain">
              {/* Skill Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedSkill.category as SkillCategory]}`}>
                    {selectedSkill.category}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">v{selectedSkill.version}</span>
                </div>
                <h2 className="text-lg font-semibold text-white">{selectedSkill.name}</h2>
                <p className="text-sm text-gray-400 mt-1 leading-relaxed">{selectedSkill.description}</p>
              </div>

              {/* Seller Info */}
              {(() => {
                const agent = getAgent(selectedSkill.agentId);
                const trust = TRUST_CONFIG[agent?.verificationLevel as VerificationLevel] ?? TRUST_CONFIG.UNVERIFIED;
                const TrustIcon = trust.icon;
                return (
                  <div className="bg-[#0B0F14] rounded-lg border border-[#1C2432] p-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2">Seller</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{agent?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                          Trust Score: {agent?.reputationScore ?? 0}/100
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-mono ${trust.color}`}>
                        <TrustIcon size={14} />
                        {trust.label}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Policy Tags */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {selectedSkill.listing.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-[#1C2432]/60 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
                {Number(selectedSkill.policyTags.requiresKycTier ?? 0) > 0 && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-400/20">
                    KYC Tier {String(selectedSkill.policyTags.requiresKycTier)}
                  </span>
                )}
              </div>

              {/* Pricing Breakdown */}
              {quoteResult && (
                <div className="bg-[#0B0F14] rounded-lg border border-[#1C2432] p-3 sm:p-4 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2 sm:mb-3">
                    Quote Estimate
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Skill Cost</span>
                    <span className="font-mono text-white">${quoteResult.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee ({(feeConfig.platformTakeRateBps / 100).toFixed(0)}%)</span>
                    <span className="font-mono text-gray-400">${quoteResult.platformFee.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Receipt Fee</span>
                    <span className="font-mono text-gray-400">${quoteResult.receiptFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seller Payout</span>
                    <span className="font-mono text-[#25D695]">${quoteResult.sellerPayout.toFixed(4)}</span>
                  </div>
                  <div className="border-t border-[#1C2432] mt-2 pt-2 flex justify-between text-sm font-semibold">
                    <span className="text-white">Total</span>
                    <span className="font-mono text-white">${quoteResult.total.toFixed(2)} RLUSD</span>
                  </div>
                </div>
              )}

              {/* Sample Receipt Preview */}
              <div className="bg-[#0B0F14] rounded-lg border border-[#1C2432] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={12} className="text-gray-600" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-600">Receipt Preview</span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">
                  An immutable receipt will be generated with skill execution proof,
                  cost breakdown, and dual signatures (Nexus + Seller).
                </p>
              </div>
            </div>

            {/* Sticky CTA Footer */}
            <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[#1C2432] bg-[#111820]">
              <button
                onClick={handleBuyAndRun}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90 active:scale-[0.98]"
              >
                Buy & Run
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Screen ──────────────────────────────────── */}
      {showSuccess && quoteResult && selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Panel */}
          <div className="relative w-full max-w-md mx-3 sm:mx-4 mb-0 sm:mb-0 bg-[#111820] border border-[#1C2432] rounded-t-2xl sm:rounded-xl shadow-2xl fade-in" style={{ maxHeight: '92vh', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-300 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-0">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-center overflow-y-auto overscroll-contain">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D695]/10 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-[#25D695] sm:hidden" />
                  <CheckCircle2 size={32} className="text-[#25D695] hidden sm:block" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Skill Executed Successfully</h2>
                <p className="text-xs text-gray-500 font-mono mt-1">{selectedSkill.name}</p>
              </div>

              {/* Receipt ID */}
              <div className="bg-[#0B0F14] rounded-lg border border-[#1C2432] p-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-1">
                  Receipt ID
                </div>
                <p className="text-sm font-mono text-[#25D695] break-all">{receiptId}</p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-[#0B0F14] rounded-lg border border-[#1C2432] p-3 sm:p-4 text-left space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2">
                  Cost Breakdown
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Cost</span>
                  <span className="font-mono text-white">${quoteResult.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee</span>
                  <span className="font-mono text-gray-400">${quoteResult.platformFee.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Seller Payout</span>
                  <span className="font-mono text-[#25D695]">${quoteResult.sellerPayout.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Receipt Fee</span>
                  <span className="font-mono text-gray-400">${quoteResult.receiptFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Sticky Action Buttons */}
            <div className="shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[#1C2432] bg-[#111820]">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90 active:scale-[0.98]"
                >
                  <FileText size={14} />
                  View Receipt
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all bg-[#1C2432] text-gray-300 hover:bg-[#1C2432]/80 hover:text-white active:scale-[0.98]"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
