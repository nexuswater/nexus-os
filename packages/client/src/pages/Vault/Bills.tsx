import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Badge,
  StatusBadge,
  Button,
  Spinner,
  EmptyState,
  Modal,
  ProgressBar,
} from '@/components/common';
import type {
  BillDocument,
  BillAuditLog,
  FraudSignal,
  BillType,
  BillStatus,
  FraudSeverity,
} from '@nexus/shared';
import {
  FileText,
  Upload,
  Search,
  Filter,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronDown,
  Hash,
  Droplets,
  Zap,
  Eye,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const BILL_TYPE_OPTIONS: { value: BillType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'WATER', label: 'Water' },
  { value: 'ENERGY', label: 'Energy' },
];

const STATUS_OPTIONS: { value: BillStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<BillStatus, 'gray' | 'green' | 'orange' | 'red'> = {
  pending: 'gray',
  verified: 'green',
  flagged: 'orange',
  rejected: 'red',
};

const SEVERITY_COLORS: Record<FraudSeverity, string> = {
  low: 'bg-blue-500/10 text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function fraudScoreColor(score: number): string {
  if (score < 30) return 'text-emerald-400';
  if (score < 60) return 'text-yellow-400';
  return 'text-red-400';
}

function fraudScoreDotColor(score: number): string {
  if (score < 30) return 'bg-emerald-400';
  if (score < 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

function fraudScoreVariant(score: number): 'green' | 'energy' | 'red' {
  if (score < 30) return 'green';
  if (score < 60) return 'energy';
  return 'red';
}

function billTypeIcon(type: BillType, size = 16) {
  if (type === 'WATER') return <Droplets size={size} className="text-water-400" />;
  return <Zap size={size} className="text-energy-400" />;
}

/* -------------------------------------------------------------------------- */
/*  Upload Bill Modal                                                          */
/* -------------------------------------------------------------------------- */

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

function UploadBillModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [billType, setBillType] = useState<BillType>('WATER');
  const [providerName, setProviderName] = useState('');
  const [accountNickname, setAccountNickname] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBillType('WATER');
      setProviderName('');
      setAccountNickname('');
      setPeriodStart('');
      setPeriodEnd('');
      setConsent(false);
      setSubmitting(false);
      setSuccess(false);
      setError(null);
    }
  }, [open]);

  async function handleUpload() {
    if (!providerName.trim()) {
      setError('Provider name is required.');
      return;
    }
    if (!periodStart || !periodEnd) {
      setError('Billing period start and end are required.');
      return;
    }
    if (!consent) {
      setError('You must consent to proceed.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/vault/bills/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: billType,
          providerName: providerName.trim(),
          accountNickname: accountNickname.trim() || undefined,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setSuccess(true);
      onUploaded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Bill">
      {success ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white mb-1">Bill Uploaded Successfully</p>
          <p className="text-xs text-gray-500">
            Your bill has been submitted for verification. You will receive a notification once
            processing is complete.
          </p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bill Type Selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Bill Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBillType('WATER')}
                className={`p-3 rounded-xl border transition-colors text-center ${
                  billType === 'WATER'
                    ? 'border-water-500/50 bg-water-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <Droplets
                  size={20}
                  className={`mx-auto mb-1 ${billType === 'WATER' ? 'text-water-400' : 'text-gray-500'}`}
                />
                <div className={`text-sm font-medium ${billType === 'WATER' ? 'text-water-400' : 'text-gray-400'}`}>
                  Water
                </div>
              </button>
              <button
                onClick={() => setBillType('ENERGY')}
                className={`p-3 rounded-xl border transition-colors text-center ${
                  billType === 'ENERGY'
                    ? 'border-energy-500/50 bg-energy-500/5'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <Zap
                  size={20}
                  className={`mx-auto mb-1 ${billType === 'ENERGY' ? 'text-energy-400' : 'text-gray-500'}`}
                />
                <div className={`text-sm font-medium ${billType === 'ENERGY' ? 'text-energy-400' : 'text-gray-400'}`}>
                  Energy
                </div>
              </button>
            </div>
          </div>

          {/* Provider Name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Provider Name</label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. City Water Authority"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
            />
          </div>

          {/* Account Nickname */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Account Nickname <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={accountNickname}
              onChange={(e) => setAccountNickname(e.target.value)}
              placeholder="e.g. Home, Office"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
            />
          </div>

          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 rounded border-gray-600 text-nexus-500 focus:ring-nexus-500 bg-gray-700"
            />
            <span className="text-xs text-gray-400 leading-relaxed">
              I consent to store this bill for verification and token issuance purposes. The
              uploaded document will be processed to extract usage and billing data, verified for
              authenticity, and used as proof-of-resource for sustainability token minting.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-800/40">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={submitting || !providerName.trim() || !periodStart || !periodEnd || !consent}
            onClick={handleUpload}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Bill
              </>
            )}
          </Button>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bill Detail Modal                                                          */
/* -------------------------------------------------------------------------- */

interface DetailModalProps {
  bill: BillDocument | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}

function BillDetailModal({ bill, open, onClose, onRefresh, isAdmin = false }: DetailModalProps) {
  const [auditLog, setAuditLog] = useState<BillAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open && bill) {
      setLoadingAudit(true);
      fetch(`/api/vault/bills/${bill.id}/audit`)
        .then((r) => r.json())
        .then((data) => setAuditLog(data.data ?? []))
        .catch(() => setAuditLog([]))
        .finally(() => setLoadingAudit(false));
    }
  }, [open, bill]);

  async function handleAdminAction(action: 'verify' | 'reject') {
    if (!bill) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/vault/bills/${bill.id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error('Action failed');
      onRefresh();
      onClose();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  if (!bill) return null;

  return (
    <Modal open={open} onClose={onClose} title="Bill Details">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {billTypeIcon(bill.type, 20)}
            <span className="text-sm font-semibold text-white">{bill.providerName}</span>
            <Badge color={bill.type === 'WATER' ? 'water' : 'energy'}>{bill.type}</Badge>
          </div>
          <StatusBadge status={bill.status} color={STATUS_COLORS[bill.status]} />
        </div>

        {/* Parsed Data Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-800/40">
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Billing Period</div>
            <div className="text-sm text-white">
              {formatDate(bill.billingPeriodStart)} - {formatDate(bill.billingPeriodEnd)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Usage</div>
            <div className="text-sm text-white">
              {bill.usageValue.toLocaleString()} {bill.usageUnit}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Amount</div>
            <div className="text-sm text-white">
              {bill.currency} {bill.amountValue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Account</div>
            <div className="text-sm text-white font-mono">****{bill.accountLast4}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Service Address</div>
            <div className="text-sm text-gray-300">{bill.serviceAddressMasked}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wider">Uploaded</div>
            <div className="text-sm text-gray-300">{formatDateTime(bill.createdAt)}</div>
          </div>
        </div>

        {/* File Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40">
          <FileText size={16} className="text-gray-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{bill.fileName}</div>
            <div className="text-[11px] text-gray-500">{formatFileSize(bill.fileSize)}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <Hash size={10} />
              <span className="font-mono">{truncateHash(bill.sha256)}</span>
            </div>
          </div>
        </div>

        {/* Fraud Score Gauge */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-gray-500" />
              <span className="text-xs text-gray-400 font-medium">Fraud Score</span>
            </div>
            <span className={`text-lg font-bold tabular-nums ${fraudScoreColor(bill.fraudScore)}`}>
              {bill.fraudScore}
              <span className="text-xs text-gray-500 font-normal"> / 100</span>
            </span>
          </div>
          <ProgressBar
            value={bill.fraudScore / 100}
            variant={fraudScoreVariant(bill.fraudScore)}
            className="mb-1"
          />
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Clean</span>
            <span>Suspicious</span>
            <span>High Risk</span>
          </div>
        </div>

        {/* Fraud Signals */}
        {bill.fraudSignals.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Fraud Signals ({bill.fraudSignals.length})
            </div>
            <div className="space-y-2">
              {bill.fraudSignals.map((signal, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-800/40 border border-gray-800"
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider shrink-0 ${SEVERITY_COLORS[signal.severity]}`}
                  >
                    {signal.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono text-gray-300 mb-0.5">{signal.code}</div>
                    <div className="text-[11px] text-gray-500">{signal.description}</div>
                    {signal.evidence && (
                      <div className="text-[10px] text-gray-600 mt-1 font-mono truncate">
                        Evidence: {signal.evidence}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parsed Fields */}
        {bill.parsedFields && Object.keys(bill.parsedFields).length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Eye size={12} />
              Parsed Fields
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(bill.parsedFields).map(([key, value]) => (
                <div key={key} className="p-2 rounded bg-gray-800/40">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider">{key}</div>
                  <div className="text-xs text-gray-300 truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Log */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <Clock size={12} />
            Audit Log
          </div>
          {loadingAudit ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : auditLog.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No audit entries yet.</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2 rounded bg-gray-800/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 font-medium">{entry.actorName}</span>
                      <span className="text-[10px] text-gray-500 capitalize">{entry.action}</span>
                    </div>
                    {entry.notes && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{entry.notes}</p>
                    )}
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {formatDateTime(entry.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-800/60">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              /* mock download */
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Original
          </Button>

          {isAdmin && bill.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading === 'verify'}
                onClick={() => handleAdminAction('verify')}
                className="ml-auto"
              >
                {actionLoading === 'verify' ? (
                  <Spinner size="sm" className="mr-1.5" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Verify
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={actionLoading === 'reject'}
                onClick={() => handleAdminAction('reject')}
              >
                {actionLoading === 'reject' ? (
                  <Spinner size="sm" className="mr-1.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Reject
              </Button>
            </>
          )}

          {isAdmin && bill.status === 'flagged' && (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading === 'verify'}
                onClick={() => handleAdminAction('verify')}
                className="ml-auto"
              >
                {actionLoading === 'verify' ? (
                  <Spinner size="sm" className="mr-1.5" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Override & Verify
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={actionLoading === 'reject'}
                onClick={() => handleAdminAction('reject')}
              >
                {actionLoading === 'reject' ? (
                  <Spinner size="sm" className="mr-1.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function Bills() {
  /* ---- Data ---- */
  const [bills, setBills] = useState<BillDocument[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---- Filters ---- */
  const [typeFilter, setTypeFilter] = useState<BillType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /* ---- Modals ---- */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillDocument | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /* ---- Mock admin flag (replace with real auth context) ---- */
  const isAdmin = true;

  /* ---- Fetch ---- */
  const fetchBills = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== 'ALL') params.set('type', typeFilter);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    fetch(`/api/vault/bills?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setBills(data.data ?? []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  /* ---- Summary stats ---- */
  const totalBills = bills.length;
  const verifiedCount = bills.filter((b) => b.status === 'verified').length;
  const pendingCount = bills.filter((b) => b.status === 'pending').length;
  const flaggedCount = bills.filter((b) => b.status === 'flagged').length;
  const avgFraudScore =
    totalBills > 0 ? bills.reduce((sum, b) => sum + b.fraudScore, 0) / totalBills : 0;

  /* ---- Open detail modal ---- */
  function openDetail(bill: BillDocument) {
    setSelectedBill(bill);
    setDetailOpen(true);
  }

  function closeDetail() {
    setSelectedBill(null);
    setDetailOpen(false);
  }

  /* ---- Loading state ---- */
  if (loading && bills.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-nexus-400" />
          <h1 className="page-title mb-0">Bills</h1>
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Upload Bill
        </Button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Upload, verify, and manage your utility bills for sustainability token issuance
      </p>

      {/* ================================================================== */}
      {/*  Summary Cards                                                      */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card header="Total Bills" icon={<FileText className="w-4 h-4 text-gray-400" />}>
          <div className="stat-value text-white">{totalBills}</div>
          <div className="stat-label">Documents uploaded</div>
        </Card>

        <Card header="Verified" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}>
          <div className="stat-value text-emerald-400">{verifiedCount}</div>
          <div className="stat-label">
            {totalBills > 0 ? `${((verifiedCount / totalBills) * 100).toFixed(0)}% of total` : 'No bills yet'}
          </div>
        </Card>

        <Card header="Pending Review" icon={<Clock className="w-4 h-4 text-amber-400" />}>
          <div className="stat-value text-amber-400">{pendingCount}</div>
          <div className="stat-label">Awaiting verification</div>
        </Card>

        <Card header="Avg Fraud Score" icon={<Shield className="w-4 h-4 text-gray-400" />}>
          <div className={`stat-value ${fraudScoreColor(avgFraudScore)}`}>
            {avgFraudScore.toFixed(1)}
          </div>
          <div className="stat-label">
            {avgFraudScore < 30 ? 'Low risk' : avgFraudScore < 60 ? 'Moderate risk' : 'High risk'}
          </div>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  Filter Bar                                                          */}
      {/* ================================================================== */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by provider..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Toggle Filters */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filters
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-nexus-500 text-[10px] flex items-center justify-center">
                {(typeFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
              </span>
            )}
          </Button>

          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={fetchBills} disabled={loading}>
            {loading ? <Spinner size="sm" /> : <Activity size={14} />}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {/* Bill Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as BillType | 'ALL')}
                className="appearance-none px-3 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors cursor-pointer"
              >
                {BILL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BillStatus | 'ALL')}
                className="appearance-none px-3 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>

            {/* Clear Filters */}
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================================================================== */}
      {/*  Bill History List                                                    */}
      {/* ================================================================== */}
      {bills.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No bills found"
          description={
            typeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery
              ? 'Try adjusting your filters or search query.'
              : 'Upload your first utility bill to get started with verification.'
          }
          actionLabel={!searchQuery && typeFilter === 'ALL' && statusFilter === 'ALL' ? 'Upload Bill' : undefined}
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <Card key={bill.id} className="cursor-pointer hover:border-gray-700 transition-colors">
              <button
                onClick={() => openDetail(bill)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  {/* Provider + Type */}
                  <div className="flex items-center gap-2">
                    {billTypeIcon(bill.type, 18)}
                    <span className="text-sm font-semibold text-white">{bill.providerName}</span>
                    <Badge color={bill.type === 'WATER' ? 'water' : 'energy'}>
                      {bill.type}
                    </Badge>
                  </div>
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${fraudScoreDotColor(bill.fraudScore)}`}
                      title={`Fraud Score: ${bill.fraudScore}`}
                    />
                    <StatusBadge status={bill.status} color={STATUS_COLORS[bill.status]} />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
                      <Calendar size={10} />
                      Billing Period
                    </div>
                    <div className="text-xs text-gray-300">
                      {formatDate(bill.billingPeriodStart)} - {formatDate(bill.billingPeriodEnd)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
                      <Activity size={10} />
                      Usage
                    </div>
                    <div className="text-xs text-white font-medium tabular-nums">
                      {bill.usageValue.toLocaleString()} {bill.usageUnit}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
                      <DollarSign size={10} />
                      Amount
                    </div>
                    <div className="text-xs text-white font-medium tabular-nums">
                      {bill.currency} {bill.amountValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">
                      <Shield size={10} />
                      Fraud Score
                    </div>
                    <div className={`text-xs font-medium tabular-nums ${fraudScoreColor(bill.fraudScore)}`}>
                      {bill.fraudScore} / 100
                    </div>
                  </div>
                </div>

                {/* File Info Row */}
                <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-800/60">
                  <div className="flex items-center gap-1">
                    <FileText size={10} />
                    <span>{bill.fileName}</span>
                    <span className="text-gray-600">({formatFileSize(bill.fileSize)})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash size={10} />
                    <span className="font-mono">{truncateHash(bill.sha256)}</span>
                  </div>
                  {bill.fraudSignals.length > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <AlertTriangle size={10} />
                      <span>{bill.fraudSignals.length} signal{bill.fraudSignals.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/*  Modals                                                              */}
      {/* ================================================================== */}
      <UploadBillModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={fetchBills}
      />

      <BillDetailModal
        bill={selectedBill}
        open={detailOpen}
        onClose={closeDetail}
        onRefresh={fetchBills}
        isAdmin={isAdmin}
      />
    </div>
  );
}
