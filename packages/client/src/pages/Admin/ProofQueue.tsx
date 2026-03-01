import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileSearch } from 'lucide-react';
import { Card, StatusBadge, Button, Spinner } from '@/components/common';
import type { ProofPackage } from '@nexus/shared';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeWindow(tw: { start: string; end: string }): string {
  return `${formatDate(tw.start)} - ${formatDate(tw.end)}`;
}

export default function ProofQueue() {
  const [proofs, setProofs] = useState<ProofPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/proofs');
        const json = await res.json();
        if (json.success) {
          setProofs(json.data?.data ?? json.data);
        }
      } catch (err) {
        console.error('Failed to load proofs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleApprove(proofId: string) {
    setProofs((prev) =>
      prev.map((p) =>
        p.proof_id === proofId ? { ...p, status: 'approved' as const, updated_at: new Date().toISOString() } : p,
      ),
    );
  }

  function handleReject(proofId: string) {
    setProofs((prev) =>
      prev.map((p) =>
        p.proof_id === proofId
          ? { ...p, status: 'rejected' as const, rejection_reason: 'Rejected by admin', updated_at: new Date().toISOString() }
          : p,
      ),
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const pending = proofs.filter((p) => p.status === 'pending');
  const reviewed = proofs.filter((p) => p.status !== 'pending');

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Proof Queue</h1>
        {pending.length > 0 && (
          <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Pending Proofs */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Review
          </h2>
          <div className="space-y-3">
            {pending.map((proof) => (
              <Card key={proof.proof_id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white font-mono">
                        {proof.proof_id}
                      </span>
                      <StatusBadge status={proof.status} />
                    </div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>
                        <span className="text-gray-500">Installation:</span>{' '}
                        <span className="text-gray-300">{proof.installation_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time Window:</span>{' '}
                        {formatTimeWindow(proof.time_window)}
                      </div>
                      <div>
                        <span className="text-gray-500">Sources:</span>{' '}
                        {proof.source_types.join(', ')}
                      </div>
                      <div className="text-gray-500 mt-1">{proof.raw_readings_summary}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(proof.proof_id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(proof.proof_id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Proofs */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <FileSearch className="w-4 h-4" /> Reviewed
        </h2>
        {reviewed.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">No reviewed proofs yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {reviewed.map((proof) => (
              <div
                key={proof.proof_id}
                className="card"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-gray-300 font-mono">{proof.proof_id}</span>
                    <span className="text-xs text-gray-500">{proof.installation_id}</span>
                    <span className="text-xs text-gray-600">{formatTimeWindow(proof.time_window)}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">{proof.source_types.join(', ')}</span>
                    <StatusBadge status={proof.status} />
                  </div>
                </div>
                {proof.rejection_reason && (
                  <div className="mt-2 text-xs text-red-400/80">
                    Reason: {proof.rejection_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
