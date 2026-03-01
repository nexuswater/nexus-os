import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, StatusBadge, ProgressBar, Spinner, EmptyState } from '@/components/common';
import { governanceHubReader, type UnifiedProposal, type ChainVoteBreakdown } from '@/lib/governance';
import { getHubChain } from '@nexus/shared';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'passed' | 'failed' | 'executed';

const FILTER_TABS: FilterTab[] = ['all', 'active', 'passed', 'failed', 'executed'];

const TAB_LABELS: Record<FilterTab, string> = {
  all: 'All',
  active: 'Active',
  passed: 'Passed',
  failed: 'Failed',
  executed: 'Executed',
};

/** Maps UnifiedProposal.status to a StatusBadge-compatible status string */
function mapStatusToBadge(status: UnifiedProposal['status']): string {
  switch (status) {
    case 'active': return 'active';
    case 'passed': return 'approved';
    case 'executed': return 'approved';
    case 'failed': return 'rejected';
    case 'cancelled': return 'expired';
    default: return status;
  }
}

/** Display label for a proposal status */
function statusLabel(status: UnifiedProposal['status']): string {
  switch (status) {
    case 'active': return 'Active';
    case 'passed': return 'Passed';
    case 'executed': return 'Executed';
    case 'failed': return 'Failed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatVP(value: number): string {
  return value.toLocaleString();
}

function timeRemaining(endTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTimestamp - now;
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  return `${hours}h remaining`;
}

// ─── Component ────────────────────────────────────────────

export default function Proposals() {
  const [tab, setTab] = useState<FilterTab>('all');
  const [proposals, setProposals] = useState<UnifiedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const hubChain = getHubChain();

  useEffect(() => {
    governanceHubReader
      .listProposals()
      .then(setProposals)
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    tab === 'all'
      ? proposals
      : proposals.filter(p => p.status === tab);

  const counts: Record<FilterTab, number> = {
    all: proposals.length,
    active: proposals.filter(p => p.status === 'active').length,
    passed: proposals.filter(p => p.status === 'passed').length,
    failed: proposals.filter(p => p.status === 'failed').length,
    executed: proposals.filter(p => p.status === 'executed').length,
  };

  function toggleExpanded(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="page-title mb-0">Proposals</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
            Hub: {hubChain.name}
          </span>
        </div>
        <Link to="/dao/proposals/new">
          <button className="inline-flex items-center justify-center font-medium rounded-lg transition-colors bg-nexus-600 text-white hover:bg-nexus-500 px-3 py-1.5 text-xs">
            Create Proposal
          </button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800 mb-6">
        {FILTER_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-nexus-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {TAB_LABELS[t]}
            <span className="ml-1.5 text-[10px] text-gray-600">
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title={tab === 'all' ? 'No proposals yet' : `No ${tab} proposals`}
            description={
              tab === 'all'
                ? 'There are no governance proposals at this time.'
                : `There are no proposals with "${tab}" status.`
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(proposal => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                expanded={expandedIds.has(proposal.id)}
                onToggleExpand={() => toggleExpanded(proposal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────

function ProposalCard({
  proposal,
  expanded,
  onToggleExpand,
}: {
  proposal: UnifiedProposal;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { unifiedYes, unifiedNo, unifiedTotal, quorumRequired, quorumReached } = proposal;
  const voteTotal = unifiedYes + unifiedNo;
  const yesPct = voteTotal > 0 ? (unifiedYes / voteTotal) * 100 : 0;
  const noPct = voteTotal > 0 ? (unifiedNo / voteTotal) * 100 : 0;
  const quorumPct = quorumRequired > 0 ? Math.min(1, unifiedTotal / quorumRequired) : 1;

  return (
    <Card className="hover:border-gray-700 transition-colors">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {proposal.title}
          </span>
          <StatusBadge status={statusLabel(proposal.status)} color={
            proposal.status === 'active' ? 'blue' :
            proposal.status === 'passed' || proposal.status === 'executed' ? 'green' :
            proposal.status === 'failed' ? 'red' : 'gray'
          } />
        </div>
        <span className="text-[11px] text-gray-500 ml-3 shrink-0">
          by {truncateAddress(proposal.proposer)}
        </span>
      </div>

      {/* Unified Vote Bar (Yes vs No) */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-emerald-400">Yes {yesPct.toFixed(1)}%</span>
          <span className="text-[11px] text-red-400">No {noPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          {voteTotal > 0 && (
            <>
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${yesPct}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${noPct}%` }}
              />
            </>
          )}
        </div>
      </div>

      {/* Quorum */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-gray-500">Quorum</span>
          <span className={`text-[11px] ${quorumReached ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatVP(unifiedTotal)} / {formatVP(quorumRequired)} VP
            {quorumReached ? ' (met)' : ''}
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${quorumReached ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${quorumPct * 100}%` }}
          />
        </div>
      </div>

      {/* Time remaining for active proposals */}
      {proposal.status === 'active' && (
        <div className="text-[11px] text-gray-500 mb-3">
          {timeRemaining(proposal.endTime)}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleExpand();
          }}
          className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Chain Breakdown
        </button>
        <Link
          to={`/dao/proposals/${proposal.id}`}
          className="text-[11px] text-nexus-400 hover:text-nexus-300 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>

      {/* Collapsible Chain Breakdown */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <ChainBreakdownTable breakdown={proposal.chainBreakdown} proposal={proposal} />
        </div>
      )}
    </Card>
  );
}

// ─── Chain Breakdown Table ────────────────────────────────

function ChainBreakdownTable({
  breakdown,
  proposal,
}: {
  breakdown: ChainVoteBreakdown[];
  proposal: UnifiedProposal;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left font-medium py-1 pr-4">Chain</th>
            <th className="text-right font-medium py-1 px-2">Yes VP</th>
            <th className="text-right font-medium py-1 px-2">No VP</th>
            <th className="text-right font-medium py-1 pl-2">Total</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {breakdown.map(chain => (
            <tr key={chain.chainKey} className="border-t border-gray-800/50">
              <td className="py-1.5 pr-4 text-white font-medium">{chain.chainName}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-emerald-400">{formatVP(chain.yes)}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-red-400">{formatVP(chain.no)}</td>
              <td className="py-1.5 pl-2 text-right tabular-nums">{formatVP(chain.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-700">
            <td className="py-1.5 pr-4 text-white font-semibold">Unified</td>
            <td className="py-1.5 px-2 text-right tabular-nums text-emerald-400 font-semibold">
              {formatVP(proposal.unifiedYes)}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-red-400 font-semibold">
              {formatVP(proposal.unifiedNo)}
            </td>
            <td className="py-1.5 pl-2 text-right tabular-nums font-semibold">
              {formatVP(proposal.unifiedTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
