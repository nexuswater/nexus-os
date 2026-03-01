import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, StatusBadge, Spinner } from '@/components/common';
import { ShieldCheck } from 'lucide-react';
import type { ProofPackage, ProofStatus } from '@nexus/shared';

export default function ReviewQueue() {
  const [proofs, setProofs] = useState<ProofPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proofs')
      .then((r) => r.json())
      .then((res) => {
        setProofs(res.data ?? []);
        setLoading(false);
      });
  }, []);

  const updateStatus = (proofId: string, newStatus: ProofStatus) => {
    setProofs((prev) =>
      prev.map((p) =>
        p.proof_id === proofId ? { ...p, status: newStatus } : p,
      ),
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shortId = (id: string) => {
    if (id.length <= 12) return id;
    return id.slice(0, 6) + '...' + id.slice(-4);
  };

  const pending = proofs.filter((p) => p.status === 'pending');
  const reviewed = proofs.filter((p) => p.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Link to="/mint" className="hover:text-gray-300 transition-colors">
          Mint
        </Link>
        <span>/</span>
        <span className="text-gray-400">Step 3: Review Queue</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Review Queue</h1>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 mb-6">
        <Badge color="yellow">{pending.length} pending</Badge>
        <Badge color="green">{proofs.filter((p) => p.status === 'approved').length} approved</Badge>
        <Badge color="red">{proofs.filter((p) => p.status === 'rejected').length} rejected</Badge>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <Card header="Pending Review" className="mb-6">
          <div className="space-y-3">
            {pending.map((proof) => (
              <ProofRow
                key={proof.proof_id}
                proof={proof}
                formatDate={formatDate}
                shortId={shortId}
                onApprove={() => updateStatus(proof.proof_id, 'approved')}
                onReject={() => updateStatus(proof.proof_id, 'rejected')}
              />
            ))}
          </div>
        </Card>
      )}

      {/* All proofs table */}
      <Card header="All Proofs">
        {proofs.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No proof packages submitted yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800/60">
                  <th className="text-left py-3 px-4 font-medium">Proof ID</th>
                  <th className="text-left py-3 px-4 font-medium">Installation</th>
                  <th className="text-left py-3 px-4 font-medium">Time Window</th>
                  <th className="text-left py-3 px-4 font-medium">Sources</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {proofs.map((proof) => (
                  <tr key={proof.proof_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-300">{shortId(proof.proof_id)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-400 font-mono">{shortId(proof.installation_id)}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-400">
                      {formatDate(proof.time_window.start)} - {formatDate(proof.time_window.end)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {proof.source_types.map((s) => (
                          <Badge key={s} color="gray">
                            {s.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={proof.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {proof.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => updateStatus(proof.proof_id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(proof.proof_id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProofRow({
  proof,
  formatDate,
  shortId,
  onApprove,
  onReject,
}: {
  proof: ProofPackage;
  formatDate: (s: string) => string;
  shortId: (s: string) => string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-gray-300">{shortId(proof.proof_id)}</span>
            <StatusBadge status={proof.status} />
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Installation: {shortId(proof.installation_id)} | {formatDate(proof.time_window.start)} - {formatDate(proof.time_window.end)}
          </div>
          <p className="text-xs text-gray-400 mb-2">{proof.raw_readings_summary}</p>
          <div className="flex flex-wrap gap-1">
            {proof.source_types.map((s) => (
              <Badge key={s} color="gray">
                {s.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
