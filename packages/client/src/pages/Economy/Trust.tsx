/**
 * Agent Economy — Trust
 * Combined Trust Dashboard + Agent Detail + Reputation Timeline + Disputes + Bots.
 */

import { useState, useMemo } from 'react';
import {
  Shield, ChevronDown, ChevronRight,
  Clock, CheckCircle2,
} from 'lucide-react';
import { TabGroup } from '@/components/common';
import {
  generateEconAgents,
  generateAgentReputations,
  generateAgentEvents,
  generateDisputes,
} from '@/mock/generators/economy';

// ─── Data ────────────────────────────────────────────────

const agents = generateEconAgents();
const reputations = generateAgentReputations();
const events = generateAgentEvents();
const disputes = generateDisputes();

const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

function agentName(id: string) {
  return agentMap[id]?.name ?? id;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Color Helpers ───────────────────────────────────────

const TIER_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  A: { text: 'text-[#25D695]', bg: 'bg-[#25D695]/15', ring: '#25D695' },
  B: { text: 'text-teal-400', bg: 'bg-teal-400/15', ring: '#2dd4bf' },
  C: { text: 'text-amber-400', bg: 'bg-amber-400/15', ring: '#fbbf24' },
  D: { text: 'text-red-400', bg: 'bg-red-400/15', ring: '#f87171' },
};

function trustColor(score: number): string {
  if (score >= 85) return 'text-[#25D695]';
  if (score >= 70) return 'text-teal-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-400/15 text-red-400 border-red-400/30',
  UNDER_REVIEW: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  RESOLVED: 'bg-[#25D695]/15 text-[#25D695] border-[#25D695]/30',
  REJECTED: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
};

const VERIFICATION_COLORS: Record<string, string> = {
  PREMIUM: 'bg-violet-500/15 text-violet-400',
  VERIFIED: 'bg-[#25D695]/15 text-[#25D695]',
  UNVERIFIED: 'bg-gray-500/15 text-gray-500',
};

// ─── Trust Score Ring ────────────────────────────────────

function TrustRing({
  score,
  tier,
  size = 96,
}: {
  score: number;
  tier: string;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = TIER_COLORS[tier]?.ring ?? '#64748B';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1C2432"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="text-white font-bold font-mono"
          style={{ fontSize: size * 0.24 }}
        >
          {score}
        </span>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">
          Tier {tier}
        </span>
      </div>
    </div>
  );
}

// ─── Sub-Score Bar ───────────────────────────────────────

function SubScoreBar({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct >= 85
      ? 'bg-[#25D695]'
      : pct >= 70
        ? 'bg-teal-400'
        : pct >= 50
          ? 'bg-amber-400'
          : 'bg-red-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{label}</span>
        <span className="text-[11px] font-mono text-white">{value}</span>
      </div>
      <div className="h-1.5 bg-[#1C2432] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────

const TABS = ['Trust Dashboard', 'Disputes'] as const;

// ─── Component ───────────────────────────────────────────

export default function Trust() {
  const [activeTab, setActiveTab] = useState<string>('Trust Dashboard');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // ─── Sorted reputations ──────────────────────────────

  const sortedReps = useMemo(() => {
    let list = [...reputations].sort((a, b) => b.trustScore - a.trustScore);
    if (tierFilter !== 'ALL') {
      list = list.filter(r => r.riskTier === tierFilter);
    }
    return list;
  }, [tierFilter]);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-5">
        <TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ═══ Trust Dashboard ═════════════════════════════ */}
      {activeTab === 'Trust Dashboard' && (
        <div className="space-y-5">
          {/* Header + Tier filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield size={16} className="text-[#25D695]" />
                Agent Credit Score
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                All agents ranked by composite Trust Score (0-100)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider mr-1">
                Tier
              </span>
              {['ALL', 'A', 'B', 'C', 'D'].map(t => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-colors ${
                    tierFilter === t
                      ? 'bg-[#25D695]/15 text-[#25D695] border border-[#25D695]/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Table */}
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1C2432]">
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Agent Name
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Trust Score
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Risk Tier
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Reliability
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Fraud Flags
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {sortedReps.map(rep => {
                    const agent = agentMap[rep.agentId];
                    if (!agent) return null;
                    const isExpanded = expandedAgentId === rep.agentId;
                    const agentEvents = events
                      .filter(e => e.agentId === rep.agentId)
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 5);

                    return (
                      <tr key={rep.agentId} className="group">
                        <td colSpan={9} className="p-0">
                          {/* Main row */}
                          <button
                            onClick={() =>
                              setExpandedAgentId(isExpanded ? null : rep.agentId)
                            }
                            className="w-full text-left flex items-center border-b border-[#1C2432]/50 hover:bg-white/[0.015] transition-colors"
                          >
                            <span className="px-4 py-3 text-xs font-medium text-white w-[160px] truncate">
                              {agent.name}
                            </span>
                            <span className="px-4 py-3 text-[10px] text-gray-400 font-mono w-[90px]">
                              {agent.type}
                            </span>
                            <span className="px-4 py-3 w-[110px]">
                              <span
                                className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                  VERIFICATION_COLORS[agent.verificationLevel] ?? ''
                                }`}
                              >
                                {agent.verificationLevel}
                              </span>
                            </span>
                            <span
                              className={`px-4 py-3 text-sm font-bold font-mono tabular-nums w-[100px] ${trustColor(
                                rep.trustScore,
                              )}`}
                            >
                              {rep.trustScore}
                            </span>
                            <span className="px-4 py-3 w-[80px]">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  TIER_COLORS[rep.riskTier]?.bg ?? ''
                                } ${TIER_COLORS[rep.riskTier]?.text ?? ''}`}
                              >
                                {rep.riskTier}
                              </span>
                            </span>
                            <span className="px-4 py-3 text-xs font-mono text-gray-300 tabular-nums w-[90px]">
                              {rep.reliabilityScore}
                            </span>
                            <span className="px-4 py-3 text-xs font-mono text-gray-300 tabular-nums w-[100px]">
                              {(rep.successRate30d * 100).toFixed(0)}%
                            </span>
                            <span className="px-4 py-3 text-xs font-mono tabular-nums w-[90px]">
                              <span
                                className={
                                  rep.fraudFlags30d > 0
                                    ? 'text-red-400'
                                    : 'text-gray-500'
                                }
                              >
                                {rep.fraudFlags30d}
                              </span>
                            </span>
                            <span className="px-2 py-3 w-8 text-gray-600">
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </span>
                          </button>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <div className="bg-[#0B0F14] border-b border-[#1C2432]/50 px-4 py-5">
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* Trust Ring */}
                                <div className="flex flex-col items-center gap-2">
                                  <TrustRing
                                    score={rep.trustScore}
                                    tier={rep.riskTier}
                                    size={112}
                                  />
                                  <span className="text-[10px] text-gray-500 font-mono">
                                    {rep.lastBreakdown?.deltaSummary}
                                  </span>
                                </div>

                                {/* Sub-score bars */}
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                  <SubScoreBar
                                    label="Reliability"
                                    value={rep.reliabilityScore}
                                  />
                                  <SubScoreBar
                                    label="Success"
                                    value={rep.successScore}
                                  />
                                  <SubScoreBar
                                    label="Speed"
                                    value={rep.executionSpeedScore}
                                  />
                                  <SubScoreBar
                                    label="Disputes"
                                    value={rep.disputeScore}
                                  />
                                  <SubScoreBar
                                    label="Fraud Risk"
                                    value={rep.fraudRiskScore}
                                  />
                                  <SubScoreBar
                                    label="Liquidity"
                                    value={rep.liquidityScore}
                                  />
                                </div>

                                {/* Recent Events */}
                                <div className="lg:w-64 shrink-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-2 block">
                                    Why this score?
                                  </span>
                                  <div className="space-y-2">
                                    {agentEvents.map(evt => (
                                      <div
                                        key={evt.id}
                                        className="flex items-start gap-2"
                                      >
                                        <span
                                          className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                            evt.severity === 'HIGH'
                                              ? 'bg-red-400'
                                              : evt.severity === 'MEDIUM'
                                                ? 'bg-amber-400'
                                                : 'bg-[#25D695]'
                                          }`}
                                        />
                                        <div className="min-w-0">
                                          <p className="text-[11px] text-gray-300 truncate">
                                            {evt.type.replace(/_/g, ' ')}
                                          </p>
                                          <span className="text-[10px] text-gray-600 font-mono">
                                            {fmtShortDate(evt.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {agentEvents.length === 0 && (
                                      <p className="text-[11px] text-gray-600">
                                        No recent events
                                      </p>
                                    )}
                                  </div>

                                  {/* Policy badges */}
                                  <div className="mt-3 flex flex-wrap gap-1">
                                    {agent.verificationLevel === 'PREMIUM' && (
                                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">
                                        Premium
                                      </span>
                                    )}
                                    {agent.status === 'ACTIVE' && (
                                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#25D695]/15 text-[#25D695]">
                                        Active
                                      </span>
                                    )}
                                    {agent.status === 'SUSPENDED' && (
                                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-400/15 text-red-400">
                                        Suspended
                                      </span>
                                    )}
                                    {rep.fraudFlags30d === 0 && (
                                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#25D695]/15 text-[#25D695]">
                                        Clean Record
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Disputes ════════════════════════════════════ */}
      {activeTab === 'Disputes' && (
        <div className="space-y-3">
          {disputes.map(disp => {
            const isExpanded = expandedDisputeId === disp.id;
            return (
              <div
                key={disp.id}
                className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() =>
                    setExpandedDisputeId(isExpanded ? null : disp.id)
                  }
                  className="w-full text-left p-4 hover:bg-white/[0.015] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            DISPUTE_STATUS_COLORS[disp.status] ?? ''
                          }`}
                        >
                          {disp.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600">
                          {disp.id}
                        </span>
                      </div>

                      <p className="text-sm text-gray-300 line-clamp-2">
                        {disp.reason}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span>
                          <span className="text-gray-600">Opened by</span>{' '}
                          <span className="text-white">
                            {agentName(disp.openedByAgentId)}
                          </span>
                        </span>
                        <span className="text-gray-700">vs</span>
                        <span>
                          <span className="text-gray-600">Against</span>{' '}
                          <span className="text-white">
                            {agentName(disp.againstAgentId)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock size={10} />
                          {fmtDate(disp.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className="text-gray-600 shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#1C2432] space-y-4">
                    {/* Full reason */}
                    <div className="pt-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block mb-1">
                        Full Description
                      </span>
                      <p className="text-sm text-gray-300">{disp.reason}</p>
                    </div>

                    {/* Evidence */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block mb-1">
                        Evidence
                      </span>
                      {disp.evidence.receiptIds.length > 0 && (
                        <div className="mb-1">
                          <span className="text-[10px] text-gray-500">
                            Receipt IDs:{' '}
                          </span>
                          {disp.evidence.receiptIds.map((rid: string) => (
                            <span
                              key={rid}
                              className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-[#1C2432] text-gray-400 rounded mr-1"
                            >
                              {rid}
                            </span>
                          ))}
                        </div>
                      )}
                      {disp.evidence.logs.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500">Logs:</span>
                          {disp.evidence.logs.map((log: string, i: number) => (
                            <p
                              key={i}
                              className="text-[11px] text-gray-400 font-mono bg-[#0B0F14] px-2 py-1 rounded"
                            >
                              {log}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resolution */}
                    {disp.resolution && (
                      <div className="bg-[#0B0F14] border border-[#1C2432] rounded-lg p-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#25D695] block mb-2">
                          Resolution
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-600 block">
                              Refund Amount
                            </span>
                            <span className="text-white font-mono font-semibold">
                              {disp.resolution.refundAmount.toLocaleString()} RLUSD
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-600 block">
                              Penalty
                            </span>
                            <span className="text-red-400 font-mono font-semibold">
                              {disp.resolution.penaltyBps} bps
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-600 block">
                              Notes
                            </span>
                            <span className="text-gray-300">
                              {disp.resolution.notes}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resolve button for OPEN disputes */}
                    {disp.status === 'OPEN' && (
                      <div className="flex justify-end pt-1">
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#25D695] text-gray-950 text-xs font-semibold rounded-lg hover:bg-[#25D695]/90 transition-colors">
                          <CheckCircle2 size={13} />
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {disputes.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-12">No disputes</p>
          )}
        </div>
      )}

    </div>
  );
}
