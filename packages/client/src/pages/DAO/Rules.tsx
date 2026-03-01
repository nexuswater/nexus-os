import { useState, useEffect } from 'react';
import { Card, Spinner } from '@/components/common';
import type { GovernanceConfig } from '@nexus/shared';
import { BookOpen } from 'lucide-react';

export default function Rules() {
  const [config, setConfig] = useState<GovernanceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dao/config')
      .then(r => r.json())
      .then(res => setConfig(res.data ?? null))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={20} className="text-gray-500" />
        <h1 className="page-title mb-0">Governance Rules</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card header="Voting Parameters">
          <div className="space-y-2 text-sm">
            <RuleRow
              label="Default Quorum"
              value={config ? `${config.default_quorum.toLocaleString()} VP` : '--'}
            />
            <RuleRow
              label="Approval Threshold"
              value={config ? `${(config.default_approval_threshold * 100).toFixed(0)}%` : '--'}
            />
            <RuleRow
              label="Voting Period"
              value={config ? `${config.default_voting_period_hours} hours` : '--'}
            />
            <RuleRow
              label="Timelock"
              value={config ? `${config.default_timelock_hours} hours` : '--'}
            />
          </div>
        </Card>

        <Card header="Voting Power Weights">
          <div className="space-y-2 text-sm">
            <RuleRow
              label="WTR Weight"
              value={config ? config.wtr_weight.toString() : '--'}
            />
            <RuleRow
              label="ENG Weight"
              value={config ? config.eng_weight.toString() : '--'}
            />
            <RuleRow
              label="NFT Multiplier Mode"
              value={config ? formatMode(config.nft_multiplier_mode) : '--'}
            />
            <RuleRow
              label="Include WTR/ENG"
              value={config ? (config.include_wtr_eng_for_voting ? 'Yes' : 'No') : '--'}
            />
          </div>
        </Card>

        <Card header="Eligibility Thresholds">
          <div className="space-y-2 text-sm">
            <RuleRow
              label="Min NXS to Vote"
              value={config ? config.min_nxs_to_vote.toLocaleString() : '--'}
            />
            <RuleRow
              label="Min NFTs to Vote"
              value={config ? config.min_nfts_to_vote.toString() : '--'}
            />
            <RuleRow
              label="Exclude Retired Batches"
              value={config ? (config.exclude_retired_batches ? 'Yes' : 'No') : '--'}
            />
            <RuleRow
              label="Exclude Flagged Batches"
              value={config ? (config.exclude_flagged_batches ? 'Yes' : 'No') : '--'}
            />
          </div>
        </Card>

        <Card header="Emergency Powers">
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Pause minting
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Pause marketplace
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Rotate oracle keys
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Freeze compromised issuer
            </div>
          </div>
        </Card>
      </div>

      {config?.last_updated_at && (
        <p className="text-xs text-gray-600 mt-4">
          Last updated: {new Date(config.last_updated_at).toLocaleDateString()}
          {config.last_updated_proposal_id && (
            <span className="ml-2 font-mono">
              (Proposal: {config.last_updated_proposal_id})
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-gray-400">
      <span>{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function formatMode(mode: string): string {
  return mode
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
