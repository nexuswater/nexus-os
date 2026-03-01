/**
 * VerifyCertificate — Public verification page for Nexus Score certificates.
 * Accessed via /scoring/verify/:hash
 */

import { useParams, Link } from 'react-router-dom';
import { TerminalCard } from '@/components/terminal';
import { useNexusCertificates, useNexusSubject, useNexusScore } from '@/mock/useNexusStore';
import { TierBadge, ScoreRing, DomainIcon } from './index';
import {
  CheckCircle, XCircle, Shield, ArrowLeft,
  ExternalLink, Calendar, Hash, Building2, Home as HomeIcon,
} from 'lucide-react';
import type { ScoreDomain } from '@nexus/shared';

export default function VerifyCertificate() {
  const { hash } = useParams<{ hash: string }>();
  const certificates = useNexusCertificates();
  const cert = certificates.find(c => c.verificationHash === hash);
  const subject = useNexusSubject(cert?.subjectId ?? '');
  const score = useNexusScore(cert?.subjectId ?? '');

  const isValid = cert && cert.status === 'ACTIVE'
    && new Date(cert.expiresAt) > new Date();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Link to="/scoring" className="p-1.5 sm:p-2 rounded-lg bg-[#0D1117] border border-[#1C2432] hover:border-[#25D69530] transition-colors shrink-0">
          <ArrowLeft size={16} className="text-[#94A3B8]" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-semibold text-white tracking-tight truncate">Certificate Verification</h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider hidden sm:inline">
            // public verification portal
          </span>
        </div>
      </div>

      {!cert ? (
        <TerminalCard padding="md">
          <div className="text-center py-12">
            <XCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Certificate Not Found</h2>
            <p className="text-sm text-[#475569] max-w-md mx-auto">
              No certificate exists with this verification hash.
              Please check the hash and try again.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-[#0D1117] border border-[#1C2432] inline-block">
              <div className="text-[10px] text-[#475569] mb-1">Searched Hash</div>
              <code className="text-xs text-[#94A3B8] font-mono break-all">{hash}</code>
            </div>
          </div>
        </TerminalCard>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Verification Status */}
          <TerminalCard padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isValid ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">Verified &amp; Active</div>
                      <div className="text-[10px] text-[#475569]">This certificate is authentic and valid.</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <XCircle size={24} className="text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-red-400">
                        {cert.status === 'REVOKED' ? 'Revoked' : 'Expired'}
                      </div>
                      <div className="text-[10px] text-[#475569]">
                        This certificate is no longer valid.
                      </div>
                    </div>
                  </>
                )}
              </div>
              <TierBadge tier={cert.tier} size="md" />
            </div>
          </TerminalCard>

          {/* Certificate Details */}
          <TerminalCard title="Certificate Details" padding="md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Subject</div>
                <div className="flex items-center gap-2">
                  {subject?.kind === 'RESIDENTIAL'
                    ? <HomeIcon size={14} className="text-[#64748B]" />
                    : <Building2 size={14} className="text-[#64748B]" />
                  }
                  <span className="text-sm text-white font-medium">{cert.subjectName}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Overall Score</div>
                <ScoreRing score={cert.overallScore} size={56} tier={cert.tier} />
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Issued</div>
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <Calendar size={12} className="text-[#64748B]" />
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Expires</div>
                <div className="flex items-center gap-1.5 text-xs text-white">
                  <Calendar size={12} className="text-[#64748B]" />
                  {new Date(cert.expiresAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Issuer</div>
                <div className="text-xs text-white">{cert.issuerName}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Status</div>
                <div className="text-xs text-white capitalize">{cert.status.toLowerCase()}</div>
              </div>
            </div>
          </TerminalCard>

          {/* Domain Scores */}
          <TerminalCard title="Domain Breakdown" padding="md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cert.domains.map(d => (
                <div key={d.domain} className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432] text-center">
                  <DomainIcon domain={d.domain} size={18} />
                  <div className="text-lg font-bold text-white mt-1 tabular-nums">{Math.round(d.score)}</div>
                  <div className="text-[9px] text-[#475569] uppercase">{d.domain}</div>
                </div>
              ))}
            </div>
          </TerminalCard>

          {/* On-Chain Verification */}
          <TerminalCard title="On-Chain Record" padding="md">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                  <Hash size={10} />
                  Verification Hash
                </div>
                <code className="text-[10px] text-[#94A3B8] font-mono">
                  {cert.verificationHash.slice(0, 24)}...
                </code>
              </div>
              {cert.txHash && (
                <div className="flex items-center justify-between py-1.5 border-t border-[#1C2432]/50">
                  <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                    <ExternalLink size={10} />
                    Transaction
                  </div>
                  <code className="text-[10px] text-[#25D695] font-mono">
                    {cert.txHash.slice(0, 16)}...{cert.txHash.slice(-8)}
                  </code>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-t border-[#1C2432]/50">
                <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                  <Shield size={10} />
                  Certificate ID
                </div>
                <code className="text-[10px] text-[#94A3B8] font-mono">{cert.id}</code>
              </div>
            </div>
          </TerminalCard>
        </div>
      )}
    </div>
  );
}
