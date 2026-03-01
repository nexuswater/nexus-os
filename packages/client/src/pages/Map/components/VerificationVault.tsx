/**
 * VerificationVault — Right-panel proof trail for selected receipt.
 * Shows ProofStep timeline, CustodyEvents, VerificationScore gauge,
 * Artifacts list, and "Verify" button.
 *
 * Activated by clicking "View Proof Trail" in SiteDetailDrawer.
 */
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowLeft, FileText, CheckCircle, XCircle,
  Link as LinkIcon, Clock, User, Hash, AlertTriangle,
  Image as ImageIcon, Download,
} from 'lucide-react';
import { useMapStore } from '../store';
import { useNexusReceipts, nexusActions } from '@/mock/useNexusStore';
import { GLASS, HOLO } from '../hologramStyles';
import { useState } from 'react';

// ─── SVG Score Gauge ──────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#25D695' : score >= 60 ? '#F5C542' : '#E05272';

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="5"
        />
        {/* Progress arc */}
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white tabular-nums">{score}</span>
        <span className="text-[7px] text-gray-500 uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

// ─── Proof Step Kind → visual ──────────────────────────────

const STEP_STYLES: Record<string, { color: string; icon: typeof Shield }> = {
  ISSUANCE:     { color: '#25D695', icon: CheckCircle },
  VERIFICATION: { color: '#22D3EE', icon: Shield },
  TRANSFER:     { color: '#5B8DEF', icon: LinkIcon },
  RETIREMENT:   { color: '#F5C542', icon: Clock },
};

// ─── Artifact type icon ────────────────────────────────────

function artifactIcon(type: string) {
  switch (type) {
    case 'PDF': return <FileText size={10} className="text-red-400" />;
    case 'IMAGE': return <ImageIcon size={10} className="text-blue-400" />;
    case 'CSV': return <Download size={10} className="text-green-400" />;
    default: return <FileText size={10} className="text-gray-400" />;
  }
}

// ─── Main Component ────────────────────────────────────────

export default function VerificationVault() {
  const vaultReceiptId = useMapStore((s) => s.vaultReceiptId);
  const setVaultReceipt = useMapStore((s) => s.setVaultReceipt);
  const receipts = useNexusReceipts();
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ score: number; passed: boolean } | null>(null);

  const receipt = receipts.find((r) => r.id === vaultReceiptId);

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <Shield size={24} className="text-gray-700 mb-2" />
        <p className="text-xs text-gray-600">No receipt selected</p>
        <p className="text-[10px] text-gray-700 mt-1">Select a batch from site details to view proof trail</p>
      </div>
    );
  }

  const handleVerify = async () => {
    setVerifying(true);
    // Simulate verification delay
    await new Promise((r) => setTimeout(r, 1500));
    const result = nexusActions.verifyReceipt(receipt.id);
    if (result) {
      setVerifyResult({ score: result.score, passed: result.passed });
    }
    setVerifying(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={receipt.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {/* Header + Back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setVaultReceipt(null)}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Site
          </button>
          <span className="text-[8px] font-mono text-nexus-400/40 uppercase tracking-widest">
            Proof Trail
          </span>
        </div>

        {/* Receipt Header */}
        <div
          className="p-2.5 rounded-lg"
          style={{
            background: GLASS.bg,
            border: `1px solid ${GLASS.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white">{receipt.ticker} Receipt</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: receipt.ticker === 'WTR' ? '#25D69518' : '#4ADE8018',
                color: receipt.ticker === 'WTR' ? '#25D695' : '#4ADE80',
              }}
            >
              {receipt.amount.toLocaleString()} {receipt.ticker}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-gray-600">
            <span className="flex items-center gap-1"><Hash size={8} />{receipt.batchId}</span>
            <span className="flex items-center gap-1"><Clock size={8} />{new Date(receipt.mintedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Verification Score Gauge */}
        <div className="py-2">
          <ScoreGauge score={verifyResult?.score ?? receipt.verificationScore} />
          {receipt.riskReasons.length > 0 && (
            <div className="mt-2 space-y-1">
              {receipt.riskReasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] text-amber-400/80">
                  <AlertTriangle size={8} className="flex-shrink-0" />
                  {reason}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proof Steps Timeline */}
        <div>
          <span className="text-[8px] text-gray-600 uppercase tracking-wider block mb-2">
            Proof Steps
          </span>
          <div className="relative pl-4 space-y-2">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-nexus-400/30 via-nexus-400/10 to-transparent" />

            {receipt.proofTrail.map((step, i) => {
              const style = STEP_STYLES[step.kind] ?? STEP_STYLES.ISSUANCE;
              const Icon = style.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div
                    className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border"
                    style={{
                      backgroundColor: `${style.color}22`,
                      borderColor: style.color,
                      boxShadow: `0 0 6px ${style.color}44`,
                    }}
                  />
                  <div
                    className="p-2 rounded-lg text-[10px]"
                    style={{
                      background: 'rgba(10,12,18,0.5)',
                      border: `1px solid rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="flex items-center gap-1 font-semibold" style={{ color: style.color }}>
                        <Icon size={9} />
                        {step.kind}
                      </span>
                      <span className="text-[8px] text-gray-700">{new Date(step.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[9px] text-gray-500 flex items-center gap-1">
                      <User size={8} />{step.actor}
                    </div>
                    {step.txHash && (
                      <div className="text-[8px] text-gray-700 font-mono mt-0.5 truncate">
                        TX: {step.txHash}
                      </div>
                    )}
                    {step.memo && (
                      <div className="text-[8px] text-gray-600 mt-0.5 italic">{step.memo}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Verification Rules */}
        {receipt.verificationRules.length > 0 && (
          <div>
            <span className="text-[8px] text-gray-600 uppercase tracking-wider block mb-1.5">
              Verification Rules
            </span>
            <div className="space-y-1">
              {receipt.verificationRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between text-[9px] p-1.5 rounded bg-gray-900/30">
                  <span className="text-gray-400">{rule.name}</span>
                  {rule.passed ? (
                    <CheckCircle size={10} className="text-emerald-400" />
                  ) : (
                    <XCircle size={10} className="text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artifacts */}
        {receipt.artifacts.length > 0 && (
          <div>
            <span className="text-[8px] text-gray-600 uppercase tracking-wider block mb-1.5">
              Artifacts
            </span>
            <div className="space-y-1">
              {receipt.artifacts.map((artifact, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[9px] p-1.5 rounded bg-gray-900/30"
                >
                  {artifactIcon(artifact.kind)}
                  <span className="text-gray-400 flex-1 truncate">{artifact.label}</span>
                  <span className="text-[8px] text-gray-700">{artifact.kind}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verify Button */}
        <motion.button
          onClick={handleVerify}
          disabled={verifying}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
          style={{
            background: verifyResult?.passed
              ? 'rgba(37, 214, 149, 0.15)'
              : verifyResult && !verifyResult.passed
              ? 'rgba(224, 82, 114, 0.15)'
              : 'rgba(37, 214, 149, 0.1)',
            border: `1px solid ${
              verifyResult?.passed ? '#25D69544' : verifyResult ? '#E0527244' : GLASS.border
            }`,
            color: verifyResult?.passed ? '#25D695' : verifyResult ? '#E05272' : '#25D695',
          }}
        >
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border border-nexus-400/40 border-t-nexus-400 rounded-full animate-spin" />
              Verifying...
            </span>
          ) : verifyResult ? (
            <span className="flex items-center justify-center gap-1.5">
              {verifyResult.passed ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {verifyResult.passed ? 'Verified' : 'Failed'} — Score {verifyResult.score}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Shield size={10} />
              Run Verification
            </span>
          )}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
