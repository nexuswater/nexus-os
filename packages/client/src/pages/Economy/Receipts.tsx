/**
 * Receipts — Timeline of all economy receipts with expandable detail view.
 * Supports filtering by receipt type and full cost/proof/trust breakdowns.
 */

import { useState, useMemo } from 'react';
import {
  FileText,
  ArrowRightLeft,
  Coins,
  Recycle,
  Award,
  Package,
  Handshake,
  ChevronRight,
  X,
  Download,
  Shield,
  Hash,
  Clock,
  Copy,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { generateEconReceipts } from '@/mock/generators/economy';

// ─── Types ───────────────────────────────────────────────

type ReceiptType = 'SKILL_CALL' | 'TRADE' | 'REDEEM' | 'RETIRE' | 'CERTIFICATE' | 'AUDIT_PACK' | 'NEGOTIATION';
type FilterType = 'All' | 'Skill Calls' | 'Trades' | 'Redemptions' | 'Retirements' | 'Certificates' | 'Negotiations';

interface EconReceipt {
  id: string;
  type: ReceiptType;
  createdAt: string;
  subject: Record<string, unknown>;
  proofs: Record<string, unknown>;
  policy: Record<string, unknown>;
  financials: {
    totalCost: number;
    platformFee: number;
    sellerPayout: number;
    receiptFee: number;
    settlementFee: number;
    currency: string;
    splits: { label: string; amount: number; bps: number }[];
  };
  signatures: Record<string, string>;
  trustContext?: {
    callerTier: string;
    counterpartyTier: string;
    trustScoreAtTime: number;
    reasonSummary: string;
  };
}

// ─── Constants ───────────────────────────────────────────

const TYPE_CONFIG: Record<ReceiptType, { label: string; color: string; bgColor: string; icon: typeof FileText }> = {
  SKILL_CALL:   { label: 'Skill Call',   color: 'text-teal-400',   bgColor: 'bg-teal-500/10 border-teal-500/20',     icon: FileText },
  TRADE:        { label: 'Trade',        color: 'text-[#25D695]',  bgColor: 'bg-[#25D695]/10 border-[#25D695]/20',   icon: ArrowRightLeft },
  REDEEM:       { label: 'Redeem',       color: 'text-sky-400',    bgColor: 'bg-sky-500/10 border-sky-500/20',        icon: Coins },
  RETIRE:       { label: 'Retire',       color: 'text-amber-400',  bgColor: 'bg-amber-500/10 border-amber-500/20',   icon: Recycle },
  CERTIFICATE:  { label: 'Certificate',  color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20', icon: Award },
  AUDIT_PACK:   { label: 'Audit Pack',   color: 'text-blue-400',   bgColor: 'bg-blue-500/10 border-blue-500/20',     icon: Package },
  NEGOTIATION:  { label: 'Negotiation',  color: 'text-pink-400',   bgColor: 'bg-pink-500/10 border-pink-500/20',     icon: Handshake },
};

const FILTER_MAP: Record<FilterType, ReceiptType | null> = {
  'All':          null,
  'Skill Calls':  'SKILL_CALL',
  'Trades':       'TRADE',
  'Redemptions':  'REDEEM',
  'Retirements':  'RETIRE',
  'Certificates': 'CERTIFICATE',
  'Negotiations': 'NEGOTIATION',
};

const FILTERS: FilterType[] = [
  'All', 'Skill Calls', 'Trades', 'Redemptions', 'Retirements', 'Certificates', 'Negotiations',
];

// ─── Mock Data ───────────────────────────────────────────

const allReceipts = generateEconReceipts() as unknown as EconReceipt[];

// ─── Helper ──────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function subjectSummary(type: ReceiptType, subject: Record<string, unknown>): string {
  switch (type) {
    case 'SKILL_CALL':
      return `${subject.skillSlug} via ${subject.sellerAgentId}`;
    case 'TRADE':
      return `${Number(subject.amountIn).toLocaleString()} ${subject.fromAsset} -> ${Number(subject.amountOut).toLocaleString()} ${subject.toAsset}`;
    case 'REDEEM':
      return `${Number(subject.amount).toLocaleString()} ${subject.asset} -> ${Number(subject.rewardNXS).toLocaleString()} NXS`;
    case 'RETIRE':
      return `${Number(subject.amount).toLocaleString()} ${subject.asset} for ${subject.beneficiary}`;
    case 'CERTIFICATE':
      return `${subject.type} - ${subject.period}`;
    case 'AUDIT_PACK':
      return `${subject.receiptCount} receipts, ${subject.period}`;
    case 'NEGOTIATION':
      return `${subject.skillSlug} with ${subject.counterparty}`;
    default:
      return 'Receipt';
  }
}

// ─── Type Badge ──────────────────────────────────────────

function TypeBadge({ type }: { type: ReceiptType }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono font-medium ${config.bgColor} ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

// ─── Cost Breakdown Bar ──────────────────────────────────

function CostBreakdownBar({ splits }: { splits: { label: string; amount: number; bps: number }[] }) {
  const total = splits.reduce((s, sp) => s + sp.amount, 0);
  if (total === 0) return null;

  const SPLIT_COLORS = [
    'bg-[#25D695]',
    'bg-teal-400',
    'bg-sky-400',
    'bg-amber-400',
    'bg-purple-400',
    'bg-pink-400',
  ];

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-[#0B0F14]">
        {splits.map((sp, i) => {
          const pct = total > 0 ? (sp.amount / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={sp.label}
              className={`${SPLIT_COLORS[i % SPLIT_COLORS.length]} transition-all`}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div className="space-y-1">
        {splits.map((sp, i) => (
          <div key={sp.label} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${SPLIT_COLORS[i % SPLIT_COLORS.length]}`} />
              <span className="text-gray-400">{sp.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-gray-300 tabular-nums">{sp.amount.toFixed(4)}</span>
              {sp.bps > 0 && (
                <span className="font-mono text-[#64748B] tabular-nums">{(sp.bps / 100).toFixed(1)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Copyable Hash ───────────────────────────────────────

function CopyableValue({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const display = value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;

  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-[11px] text-[#64748B] font-mono">{label}</span>}
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="flex items-center gap-1.5 font-mono text-[11px] text-gray-300 hover:text-white transition-colors"
      >
        {display}
        {copied ? (
          <CheckCircle2 size={11} className="text-[#25D695]" />
        ) : (
          <Copy size={11} className="text-gray-600" />
        )}
      </button>
    </div>
  );
}

// ─── Receipt Detail Drawer ───────────────────────────────

function ReceiptDetail({ receipt, onClose }: { receipt: EconReceipt; onClose: () => void }) {
  const config = TYPE_CONFIG[receipt.type];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-[#0B0F14] border-l border-[#1C2432] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0B0F14] border-b border-[#1C2432] px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <TypeBadge type={receipt.type} />
            <span className="text-[11px] font-mono text-[#64748B]">{receipt.id}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#111820] border border-[#1C2432] flex items-center justify-center hover:border-gray-600 transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={13} className="text-[#64748B]" />
            <span className="font-mono">{formatDate(receipt.createdAt)} at {formatTime(receipt.createdAt)}</span>
          </div>

          {/* Subject */}
          <Section title="Subject">
            <div className="space-y-2">
              {Object.entries(receipt.subject).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-[#64748B] font-mono">{key}</span>
                  <span className="text-gray-300 font-mono text-right max-w-[60%] truncate">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Cost Breakdown */}
          <Section title="Cost Breakdown">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-base font-mono font-semibold text-white tabular-nums">
                  {receipt.financials.totalCost.toLocaleString()} {receipt.financials.currency}
                </span>
              </div>
              <CostBreakdownBar splits={receipt.financials.splits} />
            </div>
          </Section>

          {/* Policy Decision */}
          <Section title="Policy Decision">
            <div className="space-y-2">
              {Object.entries(receipt.policy).map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px]">
                  <span className="text-[#64748B] font-mono">{key}</span>
                  <span className={`font-mono ${
                    key === 'allowed'
                      ? val ? 'text-[#25D695]' : 'text-red-400'
                      : 'text-gray-300'
                  }`}>
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Proofs */}
          <Section title="Proofs">
            <div className="space-y-2">
              {Object.entries(receipt.proofs).map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                  <span className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">{key}</span>
                  <CopyableValue value={String(val)} />
                </div>
              ))}
            </div>
          </Section>

          {/* Trust Context */}
          {receipt.trustContext && (
            <Section title="Trust Context">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-2.5 text-center">
                    <div className="text-[10px] font-mono text-[#64748B] mb-1">Caller</div>
                    <div className="text-sm font-mono font-semibold text-white">
                      Tier {receipt.trustContext.callerTier}
                    </div>
                  </div>
                  <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-2.5 text-center">
                    <div className="text-[10px] font-mono text-[#64748B] mb-1">Counterparty</div>
                    <div className="text-sm font-mono font-semibold text-white">
                      Tier {receipt.trustContext.counterpartyTier}
                    </div>
                  </div>
                  <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-2.5 text-center">
                    <div className="text-[10px] font-mono text-[#64748B] mb-1">Trust Score</div>
                    <div className="text-sm font-mono font-semibold text-[#25D695]">
                      {receipt.trustContext.trustScoreAtTime}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 font-mono bg-[#111820] border border-[#1C2432] rounded-lg p-2.5">
                  {receipt.trustContext.reasonSummary}
                </div>
              </div>
            </Section>
          )}

          {/* Signatures */}
          <Section title="Signatures">
            <div className="space-y-2">
              {Object.entries(receipt.signatures).map(([signer, sig]) => (
                <div key={signer} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-[#25D695]" />
                    <span className="text-[11px] font-mono text-gray-400">{signer}</span>
                  </div>
                  <CopyableValue value={String(sig)} />
                </div>
              ))}
            </div>
          </Section>

          {/* Export */}
          <button className="w-full py-2.5 rounded-lg text-sm font-medium border border-[#1C2432] text-gray-300 hover:text-white hover:border-gray-600 transition-colors flex items-center justify-center gap-2">
            <Download size={14} />
            Export Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Hash size={12} className="text-[#64748B]" />
        <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Receipt Card ────────────────────────────────────────

function ReceiptCard({
  receipt,
  onClick,
}: {
  receipt: EconReceipt;
  onClick: () => void;
}) {
  const config = TYPE_CONFIG[receipt.type];
  const summary = subjectSummary(receipt.type, receipt.subject);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#25D695]/20 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Type badge + date */}
          <div className="flex items-center gap-2.5 mb-2">
            <TypeBadge type={receipt.type} />
            <span className="text-[11px] font-mono text-[#64748B]">
              {formatDate(receipt.createdAt)}
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              {formatTime(receipt.createdAt)}
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-gray-300 truncate">{summary}</p>
        </div>

        {/* Cost + Chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-mono font-semibold text-white tabular-nums">
              {receipt.financials.totalCost > 0
                ? receipt.financials.totalCost.toLocaleString()
                : 'Free'}
            </div>
            {receipt.financials.totalCost > 0 && (
              <div className="text-[10px] font-mono text-[#64748B]">
                {receipt.financials.currency}
              </div>
            )}
          </div>
          <ChevronRight
            size={16}
            className="text-gray-600 group-hover:text-gray-400 transition-colors"
          />
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function Receipts() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedReceipt, setSelectedReceipt] = useState<EconReceipt | null>(null);

  const filteredReceipts = useMemo(() => {
    const typeFilter = FILTER_MAP[activeFilter];
    const filtered = typeFilter
      ? allReceipts.filter((r) => r.type === typeFilter)
      : allReceipts;
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<FilterType, number>> = {};
    for (const filter of FILTERS) {
      const typeFilter = FILTER_MAP[filter];
      counts[filter] = typeFilter
        ? allReceipts.filter((r) => r.type === typeFilter).length
        : allReceipts.length;
    }
    return counts;
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Receipts
          </h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider hidden sm:inline">
            // economy transaction timeline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] text-[#475569] font-mono hidden sm:inline">
            {allReceipts.length} receipts
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 bg-[#0B0F14]/60 p-1 rounded-xl w-fit">
          {FILTERS.map((filter) => {
            const count = typeCounts[filter] ?? 0;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-[#111820] text-white shadow-sm border border-[#1C2432]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {filter === 'All' && <Filter size={12} />}
                {filter}
                <span className={`text-[10px] font-mono ${
                  activeFilter === filter ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Receipt list */}
      <div className="space-y-2">
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">No receipts found</p>
          </div>
        ) : (
          filteredReceipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              onClick={() => setSelectedReceipt(receipt)}
            />
          ))
        )}
      </div>

      {/* Detail drawer */}
      {selectedReceipt && (
        <ReceiptDetail
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
