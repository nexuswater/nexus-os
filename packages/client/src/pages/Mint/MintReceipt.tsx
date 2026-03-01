import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Button, Badge, ProgressBar, Spinner } from '@/components/common';
import { Receipt, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { TokenIcon } from '@/components/common';
import type { MPTBatch } from '@nexus/shared';

export default function MintReceipt() {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<MPTBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((res) => {
        const found = (res.data ?? []).find((b: MPTBatch) => b.batch_id === batchId);
        setBatch(found ?? null);
        setLoading(false);
      });
  }, [batchId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyBatchId = () => {
    navigator.clipboard.writeText(batchId ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // Generic receipt when batch is not found in mock data
  if (!batch) {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link to="/mint" className="hover:text-gray-300 transition-colors">
            Mint
          </Link>
          <span>/</span>
          <span className="text-gray-400">Receipt</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Receipt className="w-5 h-5 text-nexus-400" />
          <h1 className="page-title mb-0">Mint Receipt</h1>
        </div>

        <Card className="max-w-lg mx-auto">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Batch Created</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your batch has been minted and recorded on-ledger.
            </p>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-6 w-full">
              <div className="text-xs text-gray-500 mb-1">Batch ID</div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm text-nexus-400">{batchId}</span>
                <button onClick={copyBatchId} className="text-gray-500 hover:text-gray-300 transition-colors">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/assets">
                <Button>View in Assets</Button>
              </Link>
              <Link to="/mint/batch/create">
                <Button variant="secondary">Mint Another</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full receipt with batch data
  const isWater = batch.token_ticker === 'WTR';
  const txHash = batch.ledger_identifiers.tx_hashes[0] ?? 'N/A';

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Link to="/mint" className="hover:text-gray-300 transition-colors">
          Mint
        </Link>
        <span>/</span>
        <span className="text-gray-400">Receipt</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Receipt className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Mint Receipt</h1>
      </div>

      <div className="max-w-lg mx-auto">
        <Card>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWater ? 'bg-water-600/20' : 'bg-energy-600/20'}`}>
                <TokenIcon symbol={batch.token_ticker} size={22} />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {batch.amount_minted.toLocaleString()} ${batch.token_ticker}
                </div>
                <div className="text-xs text-gray-500">Batch minted successfully</div>
              </div>
            </div>
            <Badge color={isWater ? 'water' : 'energy'}>${batch.token_ticker}</Badge>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <DetailRow label="Batch ID">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{batch.batch_id}</span>
                <button onClick={copyBatchId} className="text-gray-500 hover:text-gray-300 transition-colors">
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </DetailRow>
            <DetailRow label="Token">{batch.token_ticker}</DetailRow>
            <DetailRow label="Amount">{batch.amount_minted.toLocaleString()}</DetailRow>
            <DetailRow label="Mint Date">{formatDate(batch.mint_date)}</DetailRow>
            <DetailRow label="Region">{batch.region_code}</DetailRow>
            <DetailRow label="Installation">
              <span className="font-mono text-xs">{batch.installation_id}</span>
            </DetailRow>
          </div>

          {/* Retirement Schedule */}
          <div className="border-t border-gray-800/60 pt-4 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Retirement Schedule</div>
            <div className="text-sm text-gray-300 mb-1">
              {batch.retirement_schedule.duration_months}-month linear retirement
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Started {formatDate(batch.retirement_schedule.start_date)}
            </div>
            <ProgressBar
              value={batch.current_retired_fraction}
              variant={isWater ? 'water' : 'energy'}
              label="Retired"
              showPercent
            />
          </div>

          {/* On-ledger references */}
          <div className="border-t border-gray-800/60 pt-4 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">On-Ledger References</div>
            <div className="space-y-2">
              <DetailRow label="TX Hash">
                <span className="font-mono text-xs">{txHash}</span>
              </DetailRow>
              <DetailRow label="Issuer">
                <span className="font-mono text-xs">{batch.ledger_identifiers.issuer}</span>
              </DetailRow>
              <DetailRow label="Metadata">
                <a
                  href={batch.metadata_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-nexus-400 hover:underline text-xs"
                >
                  IPFS Link
                  <ExternalLink className="w-3 h-3" />
                </a>
              </DetailRow>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/assets" className="flex-1">
              <Button className="w-full">View in Assets</Button>
            </Link>
            <Link to="/mint/batch/create" className="flex-1">
              <Button variant="secondary" className="w-full">Mint Another</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-300">{children}</span>
    </div>
  );
}
