/**
 * Trust Center — Privacy, verification methodology, and receipt export.
 * Makes the system feel legitimate and safe.
 */
import { Shield, Eye, Lock, FileCheck, Download, ExternalLink } from 'lucide-react';

const sections = [
  {
    id: 'privacy',
    icon: Lock,
    color: '#A78BFA',
    title: 'Privacy',
    subtitle: 'What we collect and why',
    items: [
      {
        label: 'Utility bills',
        detail: 'We read usage amounts and billing periods to calculate your impact. We do not store personal account numbers.',
      },
      {
        label: 'IoT device data',
        detail: 'Smart meter readings are used to cross-reference bill accuracy. Data stays encrypted at rest.',
      },
      {
        label: 'Location (city-level)',
        detail: 'Used for regional benchmarking and climate zone adjustments. We never track precise GPS location.',
      },
      {
        label: 'Wallet address',
        detail: 'Your blockchain address is used to issue and manage impact credits. It is publicly visible on-chain.',
      },
    ],
  },
  {
    id: 'verification',
    icon: FileCheck,
    color: '#00b8f0',
    title: 'Verification',
    subtitle: 'How we check your bills',
    items: [
      {
        label: 'Document integrity',
        detail: 'Every uploaded bill is hashed and checked for signs of tampering, such as mismatched fonts, resolution anomalies, or metadata inconsistencies.',
      },
      {
        label: 'Cross-reference check',
        detail: 'When IoT meters are connected, we compare the reported usage against real-time readings to detect discrepancies.',
      },
      {
        label: 'Oracle verification',
        detail: 'An independent network of oracle nodes verifies each proof package before credits are issued.',
      },
      {
        label: 'Fraud scoring',
        detail: 'Each bill receives a fraud score from 0 (clean) to 100 (highly suspicious). Bills scoring above 60 are flagged for manual review.',
      },
    ],
  },
  {
    id: 'receipts',
    icon: Download,
    color: '#25D695',
    title: 'Receipts & Certificates',
    subtitle: 'How proofs can be exported',
    items: [
      {
        label: 'PDF certificates',
        detail: 'Every verification generates a downloadable PDF certificate that can be shared with landlords, employers, or regulators.',
      },
      {
        label: 'On-chain receipts',
        detail: 'Each credit issuance is recorded on the XRPL blockchain with a permanent, tamper-proof audit trail.',
      },
      {
        label: 'Bulk export',
        detail: 'Export all your verification data as CSV for tax reporting, compliance, or personal records.',
      },
    ],
  },
];

export default function TrustCenter() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#A78BFA]/[0.08] to-transparent border border-[#A78BFA]/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center">
            <Shield size={24} className="text-[#A78BFA]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trust Center</h2>
            <p className="text-sm text-[#64748B]">How Nexus keeps your data safe and your impact real</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map(section => {
        const SectionIcon = section.icon;
        return (
          <div key={section.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${section.color}12` }}
              >
                <SectionIcon size={16} style={{ color: section.color }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                <p className="text-xs text-[#64748B]">{section.subtitle}</p>
              </div>
            </div>

            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white/[0.02]">
                  <div className="text-sm font-medium text-white/90 mb-1">{item.label}</div>
                  <div className="text-xs text-[#64748B] leading-relaxed">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
