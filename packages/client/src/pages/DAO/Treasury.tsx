import { useState, useEffect } from 'react';
import { Card, ProgressBar, Spinner } from '@/components/common';
import { TREASURY_LABELS } from '@nexus/shared';
import type { TreasuryOverview } from '@nexus/shared';
import { Landmark, Wallet, Clock } from 'lucide-react';

export default function Treasury() {
  const [treasury, setTreasury] = useState<TreasuryOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treasury')
      .then(r => r.json())
      .then(res => setTreasury(res.data ?? null))
      .catch(() => setTreasury(null))
      .finally(() => setLoading(false));
  }, []);

  // Fallback values if API returns null
  const nxsBalance = treasury?.nxs_balance ?? 1250000;
  const xrpBalance = treasury?.xrp_balance ?? 85000;
  const pendingActions = treasury?.pending_actions ?? 0;
  const allocations = treasury?.allocations ?? [];
  const lastUpdated = treasury?.last_updated ?? null;

  return (
    <div>
      <h1 className="page-title">{TREASURY_LABELS.header}</h1>
      <p className="text-sm text-gray-400 mb-6">{TREASURY_LABELS.description}</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">NXS Balance</span>
                <Landmark size={16} className="text-nexus-400" />
              </div>
              <div className="stat-value">{nxsBalance.toLocaleString()}</div>
              <div className="stat-label">Governance Token Reserve</div>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">XRP Balance</span>
                <Wallet size={16} className="text-gray-400" />
              </div>
              <div className="stat-value">{xrpBalance.toLocaleString()}</div>
              <div className="stat-label">Operational Funds</div>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Pending Actions</span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <div className="stat-value">{pendingActions}</div>
              <div className="stat-label">Awaiting Execution</div>
            </Card>
          </div>

          {/* Allocations */}
          <Card header="Infrastructure Allocations" className="mb-4">
            {allocations.length === 0 ? (
              <p className="text-sm text-gray-500">No allocations configured.</p>
            ) : (
              <div className="space-y-4">
                {allocations.map((alloc, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{alloc.label}</span>
                      <span className="text-sm text-white font-medium">
                        {alloc.amount.toLocaleString()} {alloc.currency}
                      </span>
                    </div>
                    <ProgressBar
                      value={alloc.percentage / 100}
                      variant="nexus"
                      showPercent
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-500 font-medium mb-2">Treasury purpose:</div>
              <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                {TREASURY_LABELS.purpose_items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Recent Actions */}
          <Card header="Recent Governance Actions">
            <p className="text-sm text-gray-500">No recent treasury actions.</p>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-600">{TREASURY_LABELS.disclaimer}</p>
            {lastUpdated && (
              <span className="text-xs text-gray-600">
                Last updated: {new Date(lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
