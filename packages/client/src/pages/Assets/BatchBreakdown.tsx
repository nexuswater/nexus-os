import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, ProgressBar, Spinner, Badge } from '@/components/common';
import { ArrowLeft } from 'lucide-react';
import { TokenIcon } from '@/components/common';
import type { MPTBatch, BatchTokenType } from '@nexus/shared';

export default function BatchBreakdown() {
  const { tokenType } = useParams<{ tokenType: string }>();
  const ticker = (tokenType ?? 'WTR') as BatchTokenType;
  const isWater = ticker === 'WTR';

  const [batches, setBatches] = useState<MPTBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/batches')
      .then((r) => r.json())
      .then((res) => {
        setBatches((res.data ?? []).filter((b: MPTBatch) => b.token_ticker === ticker));
        setLoading(false);
      });
  }, [ticker]);

  const total = batches.reduce((s, b) => s + b.amount_minted, 0);
  const totalActive = batches.reduce((s, b) => s + b.amount_minted * (1 - b.current_retired_fraction), 0);
  const totalRetired = total - totalActive;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shortId = (id: string) => {
    if (id.length <= 12) return id;
    return id.slice(0, 6) + '...' + id.slice(-4);
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
      <Link
        to="/assets"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Assets
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <TokenIcon symbol={ticker} size={22} />
        <h1 className="page-title mb-0">${ticker} Batch Breakdown</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className={`stat-value ${isWater ? 'text-water-400' : 'text-energy-400'}`}>
            {total.toLocaleString()}
          </div>
          <div className="stat-label">Total Minted</div>
        </Card>
        <Card>
          <div className="stat-value text-white">{Math.round(totalActive).toLocaleString()}</div>
          <div className="stat-label">Active</div>
        </Card>
        <Card>
          <div className="stat-value text-gray-500">{Math.round(totalRetired).toLocaleString()}</div>
          <div className="stat-label">Retired</div>
        </Card>
      </div>

      {/* Batch Table */}
      <Card header={`${batches.length} Batch${batches.length !== 1 ? 'es' : ''}`}>
        {batches.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No batches found. Batches appear here when you mint or acquire {ticker} tokens.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800/60">
                  <th className="text-left py-3 px-4 font-medium">Batch ID</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Mint Date</th>
                  <th className="text-left py-3 px-4 font-medium">Region</th>
                  <th className="text-left py-3 px-4 font-medium">Installation</th>
                  <th className="text-left py-3 px-4 font-medium min-w-[140px]">Retired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {batches.map((batch) => (
                  <tr key={batch.batch_id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-300">{shortId(batch.batch_id)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold tabular-nums ${isWater ? 'text-water-400' : 'text-energy-400'}`}>
                        {batch.amount_minted.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{formatDate(batch.mint_date)}</td>
                    <td className="py-3 px-4">
                      <Badge color={isWater ? 'water' : 'energy'}>{batch.region_code}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-500 font-mono">{shortId(batch.installation_id)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <ProgressBar
                        value={batch.current_retired_fraction}
                        variant={isWater ? 'water' : 'energy'}
                        showPercent
                      />
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
