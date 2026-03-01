/**
 * SubjectDetail — Full scoring breakdown for a single property/facility.
 * Shows: overall score ring, domain breakdowns with criteria, bill history,
 * IoT devices, fraud flags, certificate status, and recommended products.
 */

import { useParams, Link } from 'react-router-dom';
import { TerminalCard } from '@/components/terminal';
import {
  useNexusSubject,
  useNexusScore,
  useNexusSubjectBills,
  useNexusSubjectDevices,
  useNexusCertificates,
  useNexusScoringProducts,
  useNexusActions,
} from '@/mock/useNexusStore';
import { useToast } from '@/components/common';
import { TierBadge, ScoreRing, DomainIcon } from './index';
import {
  ArrowLeft, ArrowRight, Award, RefreshCw, FileCheck, AlertTriangle,
  Droplets, Zap, Shield, Heart, MapPin, Calendar,
  Building2, Home as HomeIcon, ShoppingBag,
} from 'lucide-react';
import type { ScoreDomain, CriterionResult } from '@nexus/shared';

const DOMAIN_BG: Record<ScoreDomain, string> = {
  WATER: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  ENERGY: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
  GOVERNANCE: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  RESILIENCE: 'from-rose-500/10 to-rose-500/5 border-rose-500/20',
};

function CriterionRow({ c }: { c: CriterionResult }) {
  const tierColor = c.tier === 'excellent' ? 'text-emerald-400'
    : c.tier === 'good' ? 'text-blue-400'
    : c.tier === 'fair' ? 'text-amber-400'
    : 'text-red-400';

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1C2432]/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white font-medium">{c.label}</div>
        <div className="text-[10px] text-[#475569] mt-0.5">{c.explanation}</div>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <span className={`text-xs font-semibold ${tierColor} uppercase`}>{c.tier}</span>
        <div className="w-12 text-right">
          <span className="text-sm font-bold text-white tabular-nums">{Math.round(c.normalizedScore)}</span>
          <span className="text-[10px] text-[#475569]">/100</span>
        </div>
      </div>
    </div>
  );
}

export default function SubjectDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const subject = useNexusSubject(subjectId ?? '');
  const score = useNexusScore(subjectId ?? '');
  const bills = useNexusSubjectBills(subjectId ?? '');
  const devices = useNexusSubjectDevices(subjectId ?? '');
  const certificates = useNexusCertificates();
  const products = useNexusScoringProducts();
  const actions = useNexusActions();
  const { toast } = useToast();

  if (!subject || !score) {
    return (
      <div className="text-center py-20">
        <p className="text-[#475569] text-sm">Subject not found.</p>
        <Link to="/scoring" className="text-[#25D695] text-xs mt-2 inline-block">
          &larr; Back to Scoring
        </Link>
      </div>
    );
  }

  const cert = certificates.find(c => c.subjectId === subject.id);
  const waterBills = bills.filter(b => b.type === 'WATER');
  const energyBills = bills.filter(b => b.type === 'ENERGY');

  // Products that could help low-scoring domains
  const weakDomains = score.domains
    .filter(d => d.score < 60)
    .map(d => d.domain);
  const recommendedProducts = products
    .filter(p => p.domains.some(d => weakDomains.includes(d)))
    .slice(0, 4);

  const handleRecalculate = () => {
    actions.recalculateScore(subject.id);
    toast('Score recalculated', 'success');
  };

  const handleCertify = () => {
    const result = actions.issueCertificate(subject.id);
    if (result) {
      toast(`Certificate issued: ${result.tier}`, 'success');
    } else {
      toast('Cannot issue certificate — score too low or already certified', 'warning');
    }
  };

  return (
    <div>
      {/* Header — stacks on mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/scoring" className="p-1.5 sm:p-2 rounded-lg bg-[#0D1117] border border-[#1C2432] hover:border-[#25D69530] transition-colors shrink-0">
            <ArrowLeft size={16} className="text-[#94A3B8]" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {subject.kind === 'RESIDENTIAL'
                ? <HomeIcon size={14} className="text-[#64748B] shrink-0" />
                : <Building2 size={14} className="text-[#64748B] shrink-0" />
              }
              <h1 className="text-base sm:text-xl font-semibold text-white tracking-tight truncate">{subject.name}</h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#475569] font-mono truncate">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{subject.address.city}, {subject.address.state} {subject.address.postalCode}</span>
            </div>
          </div>
        </div>
        {/* Action buttons — full width row on mobile */}
        <div className="flex items-center gap-2 ml-0 sm:ml-11">
          <button onClick={handleRecalculate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#0D1117] text-[#94A3B8] rounded-lg border border-[#1C2432] hover:border-[#25D69530] hover:text-white transition-all btn-press"
          >
            <RefreshCw size={12} /> Recalculate
          </button>
          {!cert && score.tier !== 'UNRATED' && (
            <button onClick={handleCertify}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#25D695]/10 text-[#25D695] rounded-lg border border-[#25D695]/20 hover:bg-[#25D695]/20 transition-all btn-press"
            >
              <FileCheck size={12} /> Certify
            </button>
          )}
        </div>
      </div>

      {/* Score Overview — horizontal on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5 mb-4 sm:mb-5">
        {/* Overall Score — compact horizontal on mobile */}
        <TerminalCard glow className="lg:col-span-1" padding="sm">
          <div className="flex items-center gap-4 sm:flex-col sm:text-center sm:py-4">
            <ScoreRing score={score.overallScore} size={80} tier={score.tier} />
            <div className="flex-1 sm:flex-none">
              <TierBadge tier={score.tier} size="md" />
              <div className="mt-1.5 text-[10px] text-[#475569]">
                {Math.round(score.dataCompleteness * 100)}% complete · Exp {new Date(score.expiresAt).toLocaleDateString()}
              </div>
              {/* Certificate Status inline */}
              {cert && (
                <div className="mt-2 flex items-center gap-2">
                  <Award size={12} className="text-violet-400" />
                  <Link
                    to={`/scoring/verify/${cert.verificationHash}`}
                    className="text-[10px] text-[#25D695] hover:text-[#1FBF84]"
                  >
                    Verify Certificate &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </TerminalCard>

        {/* Domain Breakdown */}
        <div className="lg:col-span-2 space-y-2 sm:space-y-3">
          {score.domains.map(d => (
            <div key={d.domain}
              className={`rounded-xl border bg-gradient-to-r ${DOMAIN_BG[d.domain]} p-3 sm:p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DomainIcon domain={d.domain} size={16} />
                  <span className="text-sm font-medium text-white">{d.domain}</span>
                  <span className="text-[10px] text-[#475569]">
                    ({Math.round(d.completeness * 100)}% data coverage)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tabular-nums">{Math.round(d.score)}</span>
                  <span className="text-xs text-[#475569]">/ 100</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-[#0B0F14]/50 mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.score}%`,
                    background: d.domain === 'WATER' ? '#38bdf8'
                      : d.domain === 'ENERGY' ? '#fbbf24'
                      : d.domain === 'GOVERNANCE' ? '#25D695'
                      : '#fb7185',
                  }}
                />
              </div>
              {/* Criteria */}
              <div className="space-y-0">
                {d.criteriaResults.map(c => (
                  <CriterionRow key={c.criterionId} c={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Fraud Flags + Bills + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* Fraud Flags */}
        <TerminalCard title="Fraud Flags" padding="md">
          {score.fraudFlags.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Shield size={14} /> No fraud flags detected
            </div>
          ) : (
            <div className="space-y-2">
              {score.fraudFlags.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className={
                      f.severity === 'CRITICAL' ? 'text-red-400'
                      : f.severity === 'HIGH' ? 'text-orange-400'
                      : f.severity === 'MEDIUM' ? 'text-amber-400'
                      : 'text-[#475569]'
                    } />
                    <span className="text-xs font-medium text-white">{f.code}</span>
                    <span className="text-[9px] text-[#475569] uppercase">{f.severity}</span>
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </TerminalCard>

        {/* Bill Summary */}
        <TerminalCard title="Bill History" padding="md">
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={12} className="text-blue-400" />
              <span className="text-[10px] text-[#475569]">{waterBills.length} water bills</span>
              <span className="mx-1">|</span>
              <Zap size={12} className="text-amber-400" />
              <span className="text-[10px] text-[#475569]">{energyBills.length} energy bills</span>
            </div>
            {bills.slice(0, 8).map(b => (
              <div key={b.billId} className="flex items-center justify-between py-1.5 border-b border-[#1C2432]/30 last:border-0">
                <div className="flex items-center gap-2">
                  {b.type === 'WATER'
                    ? <Droplets size={10} className="text-blue-400" />
                    : <Zap size={10} className="text-amber-400" />
                  }
                  <span className="text-[11px] text-white">
                    {b.usageValue.toLocaleString()} {b.usageUnit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {b.verified
                    ? <span className="text-[9px] text-emerald-400">Verified</span>
                    : <span className="text-[9px] text-[#475569]">Pending</span>
                  }
                  <span className="text-[10px] text-[#475569] tabular-nums">${b.amountUSD.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </TerminalCard>

        {/* Recommended Products */}
        <TerminalCard title="Improve Your Score" padding="md">
          {recommendedProducts.length === 0 ? (
            <p className="text-xs text-[#475569]">Your scores are strong! No urgent recommendations.</p>
          ) : (
            <div className="space-y-2">
              {recommendedProducts.map(p => (
                <div key={p.id} className="p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432]">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag size={10} className="text-[#25D695]" />
                    <span className="text-[11px] font-medium text-white truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#475569]">
                      +{p.estimatedScoreImpact} pts · {p.domains.map(d => d.slice(0, 3)).join(', ')}
                    </span>
                    <span className="text-[10px] text-[#25D695] font-medium">${p.priceUSD.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <Link to="/scoring/marketplace"
                className="flex items-center gap-1 text-[11px] text-[#25D695] hover:text-[#1FBF84] mt-2"
              >
                Browse all products <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </TerminalCard>
      </div>
    </div>
  );
}
