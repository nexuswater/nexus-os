import { useState } from 'react';
import { Card } from '@/components/common';
import {
  Eye, Users, FileText, Landmark, Vote,
  CheckCircle, Shield, Droplets, Zap,
  Hash, Calendar, ExternalLink, ChevronDown, ChevronUp,
  Activity, Globe, Lock,
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────

const KEY_METRICS = {
  daoMembers: 847,
  activeProposals: 5,
  treasuryBalance: 2_400_000,
  governanceParticipation: 34,
};

const RECENT_PROPOSALS = [
  {
    id: 'NXP-042',
    title: 'Increase Coordination Pool to 25%',
    type: 'Parameter',
    status: 'Passed',
    votesFor: 612,
    votesAgainst: 118,
    outcome: 'Executed',
  },
  {
    id: 'NXP-041',
    title: 'Onboard Solar Verification Oracle',
    type: 'Integration',
    status: 'Passed',
    votesFor: 734,
    votesAgainst: 45,
    outcome: 'Executed',
  },
  {
    id: 'NXP-040',
    title: 'Treasury Diversification into RLUSD',
    type: 'Treasury',
    status: 'Active',
    votesFor: 389,
    votesAgainst: 201,
    outcome: 'Pending',
  },
  {
    id: 'NXP-039',
    title: 'Amend Constitution Section 4.2',
    type: 'Constitutional',
    status: 'Passed',
    votesFor: 801,
    votesAgainst: 12,
    outcome: 'Executed',
  },
  {
    id: 'NXP-038',
    title: 'Reduce Quorum Threshold to 20%',
    type: 'Parameter',
    status: 'Rejected',
    votesFor: 156,
    votesAgainst: 547,
    outcome: 'Failed',
  },
];

const TREASURY_ALLOCATIONS = [
  { label: 'Operations', pct: 40, color: '#25D695' },
  { label: 'Treasury Reserve', pct: 25, color: '#3B82F6' },
  { label: 'Coordination Pool', pct: 20, color: '#A855F7' },
  { label: 'Infrastructure', pct: 15, color: '#F59E0B' },
];

const EPOCH_HISTORY = [
  { epoch: 12, totalRevenue: 184_200, poolDistributed: 36_840, participants: 312 },
  { epoch: 11, totalRevenue: 167_500, poolDistributed: 33_500, participants: 298 },
  { epoch: 10, totalRevenue: 152_800, poolDistributed: 30_560, participants: 276 },
  { epoch: 9,  totalRevenue: 141_400, poolDistributed: 28_280, participants: 251 },
];

const CONSTITUTION = {
  hash: '0x7a3f...c92e1d4b',
  fullHash: '0x7a3f8b2e91d04c6a5f1e8d3b7c2a9f0e4d6b8a1c3e5f7d9b2a4c6e8f0d2b4a6c92e1d4b',
  lastAmendment: '2026-01-15',
  status: 'Verified',
  version: '3.2',
};

const IMPACT_METRICS = {
  totalWtrMinted: 2_847_000,
  totalEngMinted: 1_923_000,
  totalRetired: 847_000,
  activeSites: 124,
};

const COMPLIANCE_INFO = {
  jurisdictions: ['United States', 'European Union', 'United Kingdom', 'Singapore'],
  lastAudit: '2026-02-15',
  auditor: 'ChainSecurity AG',
  kycProvider: 'Fractal ID',
  sanctionsScreening: 'Active',
  reportingFrequency: 'Quarterly',
  dataRetention: '7 years',
  regulatoryFramework: 'MiCA Compliant',
};

// ─── Helpers ────────────────────────────────────────────────

function fmtUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

function statusColor(status: string): string {
  switch (status) {
    case 'Passed': return 'text-[#25D695] bg-[#25D695]/10';
    case 'Active': return 'text-[#3B82F6] bg-[#3B82F6]/10';
    case 'Rejected': return 'text-[#EF4444] bg-[#EF4444]/10';
    default: return 'text-[#64748B] bg-[#64748B]/10';
  }
}

function outcomeColor(outcome: string): string {
  switch (outcome) {
    case 'Executed': return 'text-[#25D695]';
    case 'Pending': return 'text-[#F59E0B]';
    case 'Failed': return 'text-[#EF4444]';
    default: return 'text-[#64748B]';
  }
}

// ─── Component ──────────────────────────────────────────────

export default function Transparency() {
  const [showRegulator, setShowRegulator] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[#25D695]/10 border border-[#25D695]/20">
            <Eye size={20} className="text-[#25D695]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Nexus Protocol Transparency Portal
            </h1>
            <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">
              // public governance metrics and protocol health
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] text-[#475569] font-mono">
            PUBLIC ACCESS -- NO AUTHENTICATION REQUIRED
          </span>
        </div>
      </div>

      {/* ── Key Metrics Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest">
              DAO Members
            </span>
            <Users size={16} className="text-[#25D695]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {KEY_METRICS.daoMembers.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Verified participants</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest">
              Active Proposals
            </span>
            <FileText size={16} className="text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {KEY_METRICS.activeProposals}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Currently in voting</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest">
              Treasury Balance
            </span>
            <Landmark size={16} className="text-[#A855F7]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {fmtUSD(KEY_METRICS.treasuryBalance)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Multi-sig controlled</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-widest">
              Participation
            </span>
            <Vote size={16} className="text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {KEY_METRICS.governanceParticipation}%
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Avg. governance turnout</div>
        </Card>
      </div>

      {/* ── Recent Proposals ───────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-[#475569]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Recent Proposals
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1C2432]">
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">ID</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Title</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Type</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Status</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider text-right">For</th>
                <th className="pb-2 pr-4 text-[10px] font-semibold text-[#475569] uppercase tracking-wider text-right">Against</th>
                <th className="pb-2 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_PROPOSALS.map((p) => (
                <tr key={p.id} className="border-b border-[#1C2432]/50 hover:bg-[#1C2432]/30 transition-colors">
                  <td className="py-3 pr-4 text-xs font-mono text-[#64748B]">{p.id}</td>
                  <td className="py-3 pr-4 text-[13px] text-white font-medium">{p.title}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-[#94A3B8] bg-[#1C2432] px-2 py-0.5 rounded">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-[#25D695] font-medium tabular-nums text-right">
                    {p.votesFor}
                  </td>
                  <td className="py-3 pr-4 text-sm text-[#EF4444] font-medium tabular-nums text-right">
                    {p.votesAgainst}
                  </td>
                  <td className={`py-3 text-xs font-medium ${outcomeColor(p.outcome)}`}>
                    {p.outcome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Treasury + Epoch History Row ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Treasury Summary */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Landmark size={16} className="text-[#475569]" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Treasury Allocation
            </h2>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {TREASURY_ALLOCATIONS.map((a) => (
              <div
                key={a.label}
                style={{ width: `${a.pct}%`, backgroundColor: a.color }}
                className="first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          <div className="space-y-3">
            {TREASURY_ALLOCATIONS.map((a) => (
              <div key={a.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="text-sm text-[#94A3B8]">{a.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white font-medium tabular-nums">
                    {fmtUSD(KEY_METRICS.treasuryBalance * (a.pct / 100))}
                  </span>
                  <span className="text-xs text-[#475569] tabular-nums w-8 text-right">
                    {a.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue Distribution History */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#475569]" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Revenue Distribution History
            </h2>
          </div>
          <div className="space-y-3">
            {EPOCH_HISTORY.map((e) => (
              <div
                key={e.epoch}
                className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432] hover:border-[#25D695]/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#25D695]">
                    Epoch {e.epoch}
                  </span>
                  <span className="text-xs text-[#475569]">
                    {e.participants} participants
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-0.5">
                      Total Revenue
                    </div>
                    <div className="text-sm font-semibold text-white tabular-nums">
                      {fmtUSD(e.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-0.5">
                      Pool Distributed
                    </div>
                    <div className="text-sm font-semibold text-[#A855F7] tabular-nums">
                      {fmtUSD(e.poolDistributed)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Constitutional Integrity ───────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#475569]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Constitutional Integrity
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} className="text-[#64748B]" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Constitution Hash
              </span>
            </div>
            <div className="text-sm font-mono text-[#94A3B8] break-all" title={CONSTITUTION.fullHash}>
              {CONSTITUTION.hash}
            </div>
            <div className="text-[10px] text-[#475569] mt-1">
              Version {CONSTITUTION.version}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-[#64748B]" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Last Amendment
              </span>
            </div>
            <div className="text-sm text-white font-medium">
              {new Date(CONSTITUTION.lastAmendment).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="text-[10px] text-[#475569] mt-1">
              NXP-039: Section 4.2
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-[#25D695]" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Verification Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
              <span className="text-sm text-[#25D695] font-medium">
                {CONSTITUTION.status}
              </span>
            </div>
            <div className="text-[10px] text-[#475569] mt-1">
              On-chain hash matches
            </div>
          </div>
        </div>
      </Card>

      {/* ── Impact Metrics ─────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-[#475569]" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Impact Metrics
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Total WTR Minted
              </span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {fmtCompact(IMPACT_METRICS.totalWtrMinted)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Total ENG Minted
              </span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {fmtCompact(IMPACT_METRICS.totalEngMinted)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-[#64748B]" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Total Retired
              </span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {fmtCompact(IMPACT_METRICS.totalRetired)}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#25D695]" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">
                Active Sites
              </span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {IMPACT_METRICS.activeSites}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="border-t border-[#1C2432] pt-5 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#475569]" />
            <span className="text-xs text-[#475569]">
              This data is publicly verifiable. No private user data is exposed.
            </span>
          </div>
          <button
            onClick={() => setShowRegulator(!showRegulator)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#64748B] bg-[#0D1117] border border-[#1C2432] rounded-lg hover:border-[#25D695]/30 hover:text-[#94A3B8] transition-all"
          >
            <Shield size={12} />
            Regulator View
            {showRegulator ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Regulator Compliance Panel */}
        {showRegulator && (
          <div className="mt-4 p-4 rounded-lg bg-[#0D1117] border border-[#1C2432] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-[#3B82F6]" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Compliance Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Regulatory Framework
                </div>
                <div className="text-sm text-white">{COMPLIANCE_INFO.regulatoryFramework}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Last Audit
                </div>
                <div className="text-sm text-white">
                  {new Date(COMPLIANCE_INFO.lastAudit).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Auditor
                </div>
                <div className="text-sm text-white">{COMPLIANCE_INFO.auditor}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  KYC Provider
                </div>
                <div className="text-sm text-white">{COMPLIANCE_INFO.kycProvider}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Sanctions Screening
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D695]" />
                  <span className="text-sm text-[#25D695]">{COMPLIANCE_INFO.sanctionsScreening}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Reporting Frequency
                </div>
                <div className="text-sm text-white">{COMPLIANCE_INFO.reportingFrequency}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Data Retention
                </div>
                <div className="text-sm text-white">{COMPLIANCE_INFO.dataRetention}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1 font-semibold">
                  Jurisdictions
                </div>
                <div className="text-sm text-white">
                  {COMPLIANCE_INFO.jurisdictions.join(', ')}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1C2432]">
              <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                <ExternalLink size={10} />
                <span>
                  Full audit reports available upon request via governance portal
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
