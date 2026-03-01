import { useState, useEffect, useCallback } from 'react';
import { Card, ProgressBar, Spinner, Button, StatusBadge, EmptyState } from '@/components/common';
import type { NexusIntegrityScore, VerificationItem } from '@nexus/shared';
import {
  Shield, TrendingUp, TrendingDown, Minus, FileText, Cpu,
  CheckCircle, AlertTriangle, XCircle, Eye, Activity,
  Droplets, Plug, Radio, RefreshCw, Info, Zap,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type TrendDirection = 'improving' | 'stable' | 'declining';
type ItemType = 'bill' | 'device';
type ItemStatus = 'pending_review' | 'verified' | 'flagged' | 'rejected';

interface IntegrityScore {
  score: number;
  trend: TrendDirection;
  breakdown: {
    billsVerifiedPct: number;
    connectionsActivePct: number;
    devicesVerifiedPct: number;
  };
  summary: {
    bills: { total: number; verified: number; flagged: number };
    connections: { total: number; active: number };
    devices: { total: number; verified: number; flagged: number };
  };
}

interface ActionItem {
  id: string;
  type: ItemType;
  name: string;
  status: ItemStatus;
  fraudScore: number;
  lastUpdated: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_MAP: Record<ItemStatus, { label: string; color: 'green' | 'yellow' | 'red' | 'gray' }> = {
  pending_review: { label: 'Pending Review', color: 'yellow' },
  verified: { label: 'Verified', color: 'green' },
  flagged: { label: 'Flagged', color: 'red' },
  rejected: { label: 'Rejected', color: 'red' },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function scoreColor(score: number): string {
  if (score > 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function scoreGradient(score: number): string {
  if (score > 70) return '#25D695';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function scoreBgRing(score: number): string {
  if (score > 70) return 'ring-emerald-500/20';
  if (score >= 40) return 'ring-amber-500/20';
  return 'ring-red-500/20';
}

function trendIcon(trend: TrendDirection) {
  switch (trend) {
    case 'improving':
      return <TrendingUp size={16} className="text-emerald-400" />;
    case 'declining':
      return <TrendingDown size={16} className="text-red-400" />;
    default:
      return <Minus size={16} className="text-gray-400" />;
  }
}

function trendLabel(trend: TrendDirection): string {
  switch (trend) {
    case 'improving':
      return 'Improving';
    case 'declining':
      return 'Declining';
    default:
      return 'Stable';
  }
}

function trendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'improving':
      return 'text-emerald-400';
    case 'declining':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function itemTypeIcon(type: ItemType, size = 14) {
  if (type === 'bill') return <FileText size={size} className="text-blue-400" />;
  return <Cpu size={size} className="text-cyan-400" />;
}

function fraudScoreVariant(score: number): 'green' | 'nexus' | 'red' {
  if (score < 0.3) return 'green';
  if (score < 0.7) return 'nexus';
  return 'red';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*  Score Arc SVG                                                              */
/* -------------------------------------------------------------------------- */

function ScoreArc({ score }: { score: number }) {
  const radius = 60;
  const stroke = 8;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * radius; // semi-circle
  const arcLength = (score / 100) * circumference;
  const color = scoreGradient(score);

  return (
    <svg viewBox="0 0 140 85" className="w-40 h-[85px]">
      {/* Background arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#1f2937"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Score arc */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference}`}
        className="transition-all duration-1000 ease-out"
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        className="text-3xl font-bold"
        fill="white"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="text-[10px]"
        fill="#6b7280"
      >
        / 100
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function Verification() {
  /* ---- State ---- */
  const [scoreData, setScoreData] = useState<IntegrityScore | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ---- Fetch ---- */
  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/vault/verification/score').then((r) => r.json()),
      fetch('/api/vault/verification/items').then((r) => r.json()),
    ])
      .then(([sRes, iRes]) => {
        setScoreData(sRes.data ?? sRes);
        setItems(iRes.data ?? []);
      })
      .catch(() => {
        /* fail silently */
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Actions ---- */
  async function handleAction(itemId: string, action: 'verify' | 'reject') {
    setActionLoading(itemId);
    try {
      const res = await fetch(`/api/vault/verification/items/${itemId}/${action}`, {
        method: 'POST',
      });
      if (res.ok) fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const score = scoreData?.score ?? 0;
  const trend = scoreData?.trend ?? 'stable';
  const breakdown = scoreData?.breakdown ?? {
    billsVerifiedPct: 0,
    connectionsActivePct: 0,
    devicesVerifiedPct: 0,
  };
  const summary = scoreData?.summary ?? {
    bills: { total: 0, verified: 0, flagged: 0 },
    connections: { total: 0, active: 0 },
    devices: { total: 0, verified: 0, flagged: 0 },
  };

  const pendingItems = items.filter(
    (i) => i.status === 'pending_review' || i.status === 'flagged',
  );

  /* ---- Render ---- */
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title flex items-center gap-3 mb-0">
          <Shield className="w-6 h-6 text-nexus-400" />
          Verification & Integrity
        </h1>
        <Button variant="ghost" size="sm" onClick={fetchData}>
          <RefreshCw size={14} className="mr-1.5" />
          Refresh
        </Button>
      </div>
      <p className="text-sm text-gray-400 mb-8">
        Monitor your Nexus Integrity Score and review flagged items
      </p>

      {/* ================================================================== */}
      {/*  Nexus Integrity Score Hero                                          */}
      {/* ================================================================== */}
      <Card className="mb-8 relative overflow-hidden">
        {/* Subtle gradient background accent */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background: scoreGradient(score) }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-nexus-400" />
            <h2 className="text-lg font-semibold text-white">Nexus Integrity Score</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Score Arc */}
            <div className="flex flex-col items-center">
              <ScoreArc score={score} />
              {/* Trend */}
              <div className="flex items-center gap-1.5 mt-3">
                {trendIcon(trend)}
                <span className={`text-xs font-medium ${trendColor(trend)}`}>
                  {trendLabel(trend)}
                </span>
              </div>
            </div>

            {/* Breakdown Stats */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bills Verified */}
                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-blue-400" />
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                      Bills Verified
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2 tabular-nums">
                    {(breakdown.billsVerifiedPct * 100).toFixed(0)}%
                  </div>
                  <ProgressBar
                    value={breakdown.billsVerifiedPct}
                    variant="nexus"
                  />
                </div>

                {/* Connections Active */}
                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Plug size={14} className="text-cyan-400" />
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                      Connections Active
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2 tabular-nums">
                    {(breakdown.connectionsActivePct * 100).toFixed(0)}%
                  </div>
                  <ProgressBar
                    value={breakdown.connectionsActivePct}
                    variant="green"
                  />
                </div>

                {/* Devices Verified */}
                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={14} className="text-cyan-400" />
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                      Devices Verified
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2 tabular-nums">
                    {(breakdown.devicesVerifiedPct * 100).toFixed(0)}%
                  </div>
                  <ProgressBar
                    value={breakdown.devicesVerifiedPct}
                    variant="water"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================== */}
      {/*  Breakdown Cards                                                     */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Bills */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Bills</h3>
              <p className="text-[10px] text-gray-500">Utility bill verification</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white tabular-nums">
                {summary.bills.total}
              </div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                {summary.bills.verified}
              </div>
              <div className="text-[10px] text-gray-500">Verified</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400 tabular-nums">
                {summary.bills.flagged}
              </div>
              <div className="text-[10px] text-gray-500">Flagged</div>
            </div>
          </div>
        </Card>

        {/* Connections */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Plug size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connections</h3>
              <p className="text-[10px] text-gray-500">API & data connections</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white tabular-nums">
                {summary.connections.total}
              </div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                {summary.connections.active}
              </div>
              <div className="text-[10px] text-gray-500">Active</div>
            </div>
          </div>
        </Card>

        {/* Devices */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Cpu size={16} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Devices</h3>
              <p className="text-[10px] text-gray-500">IoT device verification</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white tabular-nums">
                {summary.devices.total}
              </div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400 tabular-nums">
                {summary.devices.verified}
              </div>
              <div className="text-[10px] text-gray-500">Verified</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400 tabular-nums">
                {summary.devices.flagged}
              </div>
              <div className="text-[10px] text-gray-500">Flagged</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  Action Items Table                                                  */}
      {/* ================================================================== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={18} className="text-gray-500" />
            Action Items
          </h2>
          {pendingItems.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20">
              {pendingItems.length} need review
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={32} />}
            title="All clear"
            description="No items require review at this time."
          />
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/60">
                  <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Fraud Score
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusInfo = STATUS_MAP[item.status];
                  const isProcessing = actionLoading === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors"
                    >
                      {/* Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {itemTypeIcon(item.type)}
                          <span className="text-xs text-gray-400 capitalize">
                            {item.type}
                          </span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-white font-medium">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-gray-600 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={statusInfo.label}
                          color={statusInfo.color}
                        />
                      </td>

                      {/* Fraud Score */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <ProgressBar
                            value={item.fraudScore}
                            variant={fraudScoreVariant(item.fraudScore)}
                            className="flex-1"
                          />
                          <span className="text-[11px] text-gray-500 tabular-nums w-8 text-right">
                            {(item.fraudScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(item.lastUpdated)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(item.status === 'pending_review' || item.status === 'flagged') && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleAction(item.id, 'verify')}
                              >
                                {isProcessing ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <CheckCircle size={12} className="mr-1" />
                                    Verify
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleAction(item.id, 'reject')}
                              >
                                <XCircle size={12} className="mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {item.status === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                              <CheckCircle size={12} />
                              Done
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                              <XCircle size={12} />
                              Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/*  Fraud Engine Info Panel                                             */}
      {/* ================================================================== */}
      <Card className="border-gray-800/60">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-nexus-500/10 flex items-center justify-center">
            <Info size={16} className="text-nexus-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              How Nexus Integrity Score is Calculated
            </h3>
            <p className="text-[10px] text-gray-500">
              Transparent, explainable verification
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
            <FileText size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white mb-0.5">
                Bill Verification
              </div>
              <p className="text-[11px] text-gray-500">
                Utility bills are cross-referenced against provider APIs, OCR data extraction,
                and historical usage patterns to detect anomalies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
            <Plug size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white mb-0.5">
                Connection Health
              </div>
              <p className="text-[11px] text-gray-500">
                Active connections to utility providers and IoT data streams are monitored
                for uptime, data freshness, and authentication validity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
            <Cpu size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white mb-0.5">
                Device Integrity
              </div>
              <p className="text-[11px] text-gray-500">
                IoT devices are validated through manufacturer registry lookups, reading
                consistency analysis, and geographic plausibility checks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
            <Activity size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white mb-0.5">
                Anomaly Detection
              </div>
              <p className="text-[11px] text-gray-500">
                Statistical models flag unusual consumption spikes, duplicate serial numbers,
                and cross-device reading inconsistencies in real time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
            <Shield size={14} className="text-nexus-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white mb-0.5">
                Score Aggregation
              </div>
              <p className="text-[11px] text-gray-500">
                Individual signals are weighted and combined into a single 0-100 score.
                Weights adapt based on data availability and category relevance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-nexus-500/5 border border-nexus-500/10">
          <CheckCircle size={14} className="text-nexus-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-nexus-300/80">
            All assessments are explainable — no black box scoring. Every flag includes
            a reason code and recommended action. You can dispute any finding through
            the review workflow above.
          </p>
        </div>
      </Card>
    </div>
  );
}
