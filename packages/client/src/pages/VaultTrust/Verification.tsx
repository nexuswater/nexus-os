/**
 * Verification — Plain-English verification trail.
 * "We verified your March water bill → Fraud checks passed → Credits minted → Receipt generated"
 */
import { ReceiptViewer } from '@/components/health';
import { generateVerificationSteps } from '@/mock/generators/health';
import { CheckCircle2, Shield, FileText } from 'lucide-react';

const steps = generateVerificationSteps();

const verifiedCount = steps.filter(s => s.status === 'verified').length;

export default function VaultVerification() {
  return (
    <div>
      {/* Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#25D695]/[0.08] to-transparent border border-[#25D695]/10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#25D695]/15 flex items-center justify-center">
            <Shield size={24} className="text-[#25D695]" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">All Checks Passed</div>
            <div className="text-sm text-[#64748B]">
              {verifiedCount} of {steps.length} verification steps completed
            </div>
          </div>
        </div>
      </div>

      {/* Latest Receipt */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={14} className="text-[#64748B]" />
          Latest Verification
        </h3>
        <ReceiptViewer
          receiptId="NXS-2026-03-001"
          steps={steps}
          creditAmount={35}
          creditType="WTR credits"
          issuedDate="Mar 1, 2026"
        />
      </div>

      {/* Past Verifications */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4">Past Verifications</h3>
        <div className="space-y-2">
          {[
            { id: 'p1', label: 'February water bill', credits: 32, date: 'Feb 1, 2026', status: 'Verified' },
            { id: 'p2', label: 'February energy bill', credits: 27, date: 'Feb 1, 2026', status: 'Verified' },
            { id: 'p3', label: 'January water bill', credits: 30, date: 'Jan 2, 2026', status: 'Verified' },
            { id: 'p4', label: 'January energy bill', credits: 24, date: 'Jan 2, 2026', status: 'Verified' },
            { id: 'p5', label: 'December water bill', credits: 30, date: 'Dec 31, 2025', status: 'Verified' },
          ].map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[#25D695]" />
                <div>
                  <div className="text-sm text-white/80">{p.label}</div>
                  <div className="text-[10px] text-[#475569]">{p.date}</div>
                </div>
              </div>
              <div className="text-sm font-bold text-[#25D695]">+{p.credits}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
