import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Spinner, ProgressBar } from '@/components/common';
import { Coins, CheckCircle2 } from 'lucide-react';
import { TokenIcon } from '@/components/common';
import type { ProofPackage, Installation, BatchTokenType } from '@nexus/shared';

const inputClass =
  'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500/50 focus:border-nexus-500/50 transition-colors';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function BatchMint() {
  const [proofs, setProofs] = useState<ProofPackage[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  const [tokenType, setTokenType] = useState<BatchTokenType>('WTR');
  const [selectedProofId, setSelectedProofId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ batch_id: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/proofs').then((r) => r.json()),
      fetch('/api/installations').then((r) => r.json()),
    ]).then(([proofRes, instRes]) => {
      const approved = (proofRes.data ?? []).filter(
        (p: ProofPackage) => p.status === 'approved',
      );
      setProofs(approved);
      setInstallations(instRes.data ?? []);
      if (approved.length > 0) setSelectedProofId(approved[0].proof_id);
      setLoading(false);
    });
  }, []);

  const selectedProof = proofs.find((p) => p.proof_id === selectedProofId);
  const selectedInstallation = installations.find(
    (i) => i.installation_id === selectedProof?.installation_id,
  );
  const regionCode = selectedInstallation?.location.region_code ?? '';

  const isWater = tokenType === 'WTR';
  const canSubmit = selectedProofId !== '' && Number(amount) > 0;

  const handleMint = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const body = {
        token_ticker: tokenType,
        amount_minted: Number(amount),
        region_code: regionCode,
        installation_id: selectedProof?.installation_id ?? '',
        proof_id: selectedProofId,
      };
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <span className="text-gray-400">Step 4: Mint Batch</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Coins className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Mint Batch</h1>
      </div>

      {result ? (
        <Card className="max-w-lg">
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Batch Minted</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your {tokenType} batch has been created successfully.
            </p>

            <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-6 w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Batch ID</span>
                <span className="font-mono text-sm text-nexus-400">{result.batch_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Token</span>
                <Badge color={isWater ? 'water' : 'energy'}>${tokenType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount</span>
                <span className="text-sm font-semibold text-white">{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Region</span>
                <span className="text-sm text-gray-300">{regionCode || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to={`/mint/receipt/${result.batch_id}`}>
                <Button>View Receipt</Button>
              </Link>
              <Link to="/assets">
                <Button variant="secondary">View in Assets</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <div className="space-y-5">
              {/* Token type */}
              <div>
                <label className={labelClass}>Token Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      tokenType === 'WTR'
                        ? 'border-water-500/50 bg-water-600/10 text-water-400'
                        : 'border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                    onClick={() => setTokenType('WTR')}
                  >
                    <TokenIcon symbol="WTR" size={18} />
                    $WTR
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      tokenType === 'ENG'
                        ? 'border-energy-500/50 bg-energy-600/10 text-energy-400'
                        : 'border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                    onClick={() => setTokenType('ENG')}
                  >
                    <TokenIcon symbol="ENG" size={18} />
                    $ENG
                  </button>
                </div>
              </div>

              {/* Proof select */}
              <div>
                <label className={labelClass}>Approved Proof</label>
                {proofs.length === 0 ? (
                  <p className="text-xs text-gray-500">No approved proofs available. Submit and approve proofs first.</p>
                ) : (
                  <select
                    className={inputClass}
                    value={selectedProofId}
                    onChange={(e) => setSelectedProofId(e.target.value)}
                  >
                    {proofs.map((p) => (
                      <option key={p.proof_id} value={p.proof_id}>
                        {p.proof_id} ({p.installation_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className={labelClass}>Amount to Mint</label>
                <input
                  type="number"
                  className={inputClass}
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>

              {/* Region auto-fill */}
              {regionCode && (
                <div>
                  <label className={labelClass}>Region (auto-filled)</label>
                  <div className="px-3 py-2.5 bg-gray-800/40 border border-gray-800/60 rounded-lg text-sm text-gray-300">
                    {regionCode}
                  </div>
                </div>
              )}

              <Button
                onClick={handleMint}
                disabled={!canSubmit || submitting}
                className="w-full"
              >
                {submitting ? 'Minting...' : `Mint ${tokenType} Batch`}
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <Card header="Batch Preview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Token</span>
                <Badge color={isWater ? 'water' : 'energy'}>${tokenType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount</span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {amount ? Number(amount).toLocaleString() : '---'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Region</span>
                <span className="text-sm text-gray-300">{regionCode || '---'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Installation</span>
                <span className="text-xs font-mono text-gray-400">
                  {selectedProof?.installation_id ?? '---'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Proof ID</span>
                <span className="text-xs font-mono text-gray-400">{selectedProofId || '---'}</span>
              </div>

              <div className="border-t border-gray-800/60 pt-4">
                <div className="text-xs text-gray-500 mb-2">Retirement Schedule</div>
                <div className="text-sm text-gray-300 mb-2">12-month linear retirement</div>
                <ProgressBar
                  value={0}
                  variant={isWater ? 'water' : 'energy'}
                  label="Retired"
                  showPercent
                />
              </div>

              {selectedProof && (
                <div className="border-t border-gray-800/60 pt-4">
                  <div className="text-xs text-gray-500 mb-1">Proof Summary</div>
                  <p className="text-xs text-gray-400">{selectedProof.raw_readings_summary}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
