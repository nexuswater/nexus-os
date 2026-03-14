/**
 * ReceiptViewer — Plain-English verification trail + advanced toggle.
 * Shows proof steps in human language, hides blockchain details by default.
 */
import { useState } from 'react';
import {
  FileText, Shield, CheckCircle2, Clock, Copy, ExternalLink,
  ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react';

export interface VerificationStep {
  id: string;
  label: string;          // Plain English: "We verified your March water bill"
  source: string;         // "Utility PDF" or "IoT Meter"
  status: 'verified' | 'pending' | 'flagged';
  timestamp: string;
  /** Technical details (hidden by default) */
  technical?: {
    txHash?: string;
    chain?: string;
    contractAddress?: string;
    blockNumber?: number;
    oracleSignature?: string;
  };
}

interface ReceiptViewerProps {
  receiptId: string;
  steps: VerificationStep[];
  creditAmount?: number;
  creditType?: string;
  issuedDate?: string;
}

const statusConfig = {
  verified: { icon: CheckCircle2, label: 'Verified', color: '#25D695', bg: 'bg-[#25D695]/10' },
  pending:  { icon: Clock,        label: 'Pending',  color: '#f99d07', bg: 'bg-[#f99d07]/10' },
  flagged:  { icon: Shield,       label: 'Flagged',  color: '#EF4444', bg: 'bg-[#EF4444]/10' },
};

export function ReceiptViewer({ receiptId, steps, creditAmount, creditType, issuedDate }: ReceiptViewerProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Receipt Header */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-[#64748B] mb-1">Receipt</div>
            <div className="text-lg font-semibold text-white font-mono">{receiptId}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/[0.04] text-[#64748B] hover:text-white hover:bg-white/[0.08] transition-colors">
              <Copy size={14} />
            </button>
            <button className="p-2 rounded-lg bg-white/[0.04] text-[#64748B] hover:text-white hover:bg-white/[0.08] transition-colors">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {(creditAmount || issuedDate) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
            {creditAmount != null && (
              <div>
                <div className="text-xs text-[#64748B]">Credits issued</div>
                <div className="text-sm font-bold text-[#25D695]">
                  {creditAmount.toLocaleString()} {creditType || 'credits'}
                </div>
              </div>
            )}
            {issuedDate && (
              <div>
                <div className="text-xs text-[#64748B]">Date</div>
                <div className="text-sm text-white">{issuedDate}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Technical toggle */}
      <button
        onClick={() => setShowTechnical(!showTechnical)}
        className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors"
      >
        {showTechnical ? <EyeOff size={12} /> : <Eye size={12} />}
        {showTechnical ? 'Hide technical details' : 'Show technical details'}
      </button>

      {/* Verification Steps */}
      <div className="space-y-1">
        {steps.map((step, i) => {
          const cfg = statusConfig[step.status];
          const StatusIcon = cfg.icon;
          const isExpanded = expandedStep === step.id;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id}>
              <button
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl hover:bg-white/[0.03] transition-colors text-left"
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center pt-0.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <StatusIcon size={14} style={{ color: cfg.color }} />
                  </div>
                  {!isLast && (
                    <div className="w-px h-6 bg-white/[0.08] mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/90">{step.label}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#64748B]">Source: {step.source}</span>
                    <span className="text-[10px] text-[#475569]">•</span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#475569] mt-0.5">{step.timestamp}</div>
                </div>

                <div className="shrink-0 pt-1 text-[#475569]">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Expanded technical details */}
              {isExpanded && showTechnical && step.technical && (
                <div className="ml-10 mb-2 p-3 rounded-lg bg-[#0B0F14] border border-white/[0.06] text-xs font-mono space-y-1.5">
                  {step.technical.chain && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Network</span>
                      <span className="text-[#94A3B8]">{step.technical.chain}</span>
                    </div>
                  )}
                  {step.technical.txHash && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Transaction</span>
                      <span className="text-[#00b8f0] truncate max-w-[200px]">{step.technical.txHash}</span>
                    </div>
                  )}
                  {step.technical.blockNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Block</span>
                      <span className="text-[#94A3B8]">{step.technical.blockNumber.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {isExpanded && !showTechnical && (
                <div className="ml-10 mb-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-[#64748B]">
                  <FileText size={12} className="inline mr-1.5 -mt-0.5" />
                  Audit trail available.{' '}
                  <button
                    onClick={() => setShowTechnical(true)}
                    className="text-[#25D695] hover:underline"
                  >
                    Show details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
