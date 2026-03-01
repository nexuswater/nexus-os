import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, StatusBadge, ProgressBar, Spinner, Button } from '@/components/common';
import { governanceHubReader, type UnifiedProposal, type ChainVoteBreakdown } from '@/lib/governance';
import { multiChainGovernance, type VoteChoice, type GovernanceAction } from '@/lib/governance';
import { getHubChain, NEXUS_CHAINS, type NexusChainConfig } from '@nexus/shared';
import { switchNetwork, getConnectedChainId } from '@/lib/evm/evmClient';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────

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
  if (diff <= 0) return 'Voting ended';
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(hours / 24);
  const mins = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours % 24}h ${mins}m remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function statusColor(status: UnifiedProposal['status']): 'blue' | 'green' | 'red' | 'gray' {
  switch (status) {
    case 'active': return 'blue';
    case 'passed': return 'green';
    case 'executed': return 'green';
    case 'failed': return 'red';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
}

/** All governance-supported chains */
const SUPPORTED_CHAINS: NexusChainConfig[] = Object.values(NEXUS_CHAINS).filter(c => c.active);

// ─── Component ────────────────────────────────────────────

export default function ProposalDetail() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<UnifiedProposal | null>(null);
  const [loading, setLoading] = useState(true);

  // Voting state
  const [userVote, setUserVote] = useState<VoteChoice | null>(null);
  const [voteResult, setVoteResult] = useState<GovernanceAction | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Network state
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  const hubChain = getHubChain();

  // Fetch proposal
  useEffect(() => {
    const id = Number(proposalId);
    if (isNaN(id)) {
      setLoading(false);
      return;
    }
    governanceHubReader
      .getProposal(id)
      .then(setProposal)
      .catch(() => setProposal(null))
      .finally(() => setLoading(false));
  }, [proposalId]);

  // Detect connected chain
  useEffect(() => {
    getConnectedChainId().then(setConnectedChainId);

    // Listen for chain changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handler = (hexChainId: string) => {
        setConnectedChainId(parseInt(hexChainId, 16));
      };
      (window as any).ethereum.on?.('chainChanged', handler);
      return () => {
        (window as any).ethereum.removeListener?.('chainChanged', handler);
      };
    }
  }, []);

  const activeChain = multiChainGovernance.getActiveChain(connectedChainId);
  const isSupported = multiChainGovernance.isOnSupportedChain(connectedChainId);

  // Handle vote
  const handleVote = useCallback(async (choice: VoteChoice) => {
    if (!connectedChainId || !isSupported || !proposal) return;
    setVoteSubmitting(true);
    setVoteError(null);
    try {
      const result = await multiChainGovernance.vote(proposal.id, choice, connectedChainId);
      setUserVote(choice);
      setVoteResult(result);
    } catch (err: any) {
      setVoteError(err.message ?? 'Vote failed');
    } finally {
      setVoteSubmitting(false);
    }
  }, [connectedChainId, isSupported, proposal]);

  // Handle network switch
  const handleSwitchNetwork = useCallback(async (chain: NexusChainConfig) => {
    setSwitching(true);
    const ok = await switchNetwork(chain.chainId);
    if (ok) {
      setConnectedChainId(chain.chainId);
    }
    setSwitching(false);
  }, []);

  // ─── Loading / Not Found ────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div>
        <Link
          to="/dao/proposals"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Proposals
        </Link>
        <Card>
          <p className="text-sm text-gray-500">Proposal not found.</p>
        </Card>
      </div>
    );
  }

  // ─── Computed values ────────────────────────────────────

  const { unifiedYes, unifiedNo, unifiedAbstain, unifiedTotal, quorumRequired, quorumReached } = proposal;
  const forPct = unifiedTotal > 0 ? (unifiedYes / unifiedTotal) * 100 : 0;
  const againstPct = unifiedTotal > 0 ? (unifiedNo / unifiedTotal) * 100 : 0;
  const abstainPct = unifiedTotal > 0 ? (unifiedAbstain / unifiedTotal) * 100 : 0;
  const quorumPct = quorumRequired > 0 ? Math.min(1, unifiedTotal / quorumRequired) : 1;
  const isActive = proposal.status === 'active';

  // ─── Render ─────────────────────────────────────────────

  return (
    <div>
      {/* Back link */}
      <Link
        to="/dao/proposals"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Proposals
      </Link>

      {/* Title + badges */}
      <div className="flex items-center gap-3 mb-1">
        <h1 className="page-title mb-0">{proposal.title}</h1>
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
          Hub: {hubChain.name}
        </span>
        <StatusBadge status={statusLabel(proposal.status)} color={statusColor(proposal.status)} />
        {isActive && (
          <span className="text-xs text-gray-500">
            {timeRemaining(proposal.endTime)}
          </span>
        )}
        {!isActive && (
          <span className="text-xs text-gray-500">
            Ended {formatTimestamp(proposal.endTime)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Proposal Info */}
          <Card header="Proposal Info">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>Proposer</span>
                <span className="text-white font-mono text-xs">{truncateAddress(proposal.proposer)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Proposal ID</span>
                <span className="text-white font-mono text-xs">#{proposal.id}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Voting Started</span>
                <span className="text-white text-xs">{formatTimestamp(proposal.startTime)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Voting Ends</span>
                <span className="text-white text-xs">{formatTimestamp(proposal.endTime)}</span>
              </div>
            </div>
          </Card>

          {/* Vote Progress */}
          <Card header="Vote Progress">
            <div className="space-y-4">
              {/* For */}
              <VoteBar
                label="For"
                value={unifiedYes}
                pct={forPct}
                color="bg-emerald-500"
                textColor="text-emerald-400"
              />
              {/* Against */}
              <VoteBar
                label="Against"
                value={unifiedNo}
                pct={againstPct}
                color="bg-red-500"
                textColor="text-red-400"
              />
              {/* Abstain */}
              <VoteBar
                label="Abstain"
                value={unifiedAbstain}
                pct={abstainPct}
                color="bg-gray-500"
                textColor="text-gray-400"
              />
            </div>

            {/* Quorum indicator */}
            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Quorum</span>
                <span className={quorumReached ? 'text-emerald-400' : 'text-amber-400'}>
                  {formatVP(unifiedTotal)} / {formatVP(quorumRequired)} VP
                  {quorumReached ? ' (met)' : ' (not met)'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${quorumReached ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${quorumPct * 100}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Per-chain breakdown (always visible) */}
          <Card header="Per-Chain Vote Breakdown">
            <ChainBreakdownTable breakdown={proposal.chainBreakdown} proposal={proposal} />
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Cast Vote */}
          {isActive && (
            <Card header="Cast Your Vote">
              {voteResult ? (
                <VoteSuccess vote={userVote!} result={voteResult} />
              ) : (
                <div className="space-y-3">
                  {/* Network status */}
                  <NetworkStatus
                    activeChain={activeChain}
                    isSupported={isSupported}
                    switching={switching}
                    onSwitch={handleSwitchNetwork}
                  />

                  {/* Vote error */}
                  {voteError && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                      <AlertTriangle size={14} />
                      {voteError}
                    </div>
                  )}

                  {/* Vote buttons */}
                  {isSupported && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-gray-500">
                        Vote will be submitted on {activeChain?.name ?? 'connected chain'}
                      </p>
                      <Button
                        variant="primary"
                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => handleVote('for')}
                        disabled={voteSubmitting}
                      >
                        {voteSubmitting ? 'Submitting...' : 'For'}
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full border-red-600/30 text-red-400 hover:bg-red-600/10"
                        onClick={() => handleVote('against')}
                        disabled={voteSubmitting}
                      >
                        {voteSubmitting ? 'Submitting...' : 'Against'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => handleVote('abstain')}
                        disabled={voteSubmitting}
                      >
                        {voteSubmitting ? 'Submitting...' : 'Abstain'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Details card */}
          <Card header="Details">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>Status</span>
                <StatusBadge status={statusLabel(proposal.status)} color={statusColor(proposal.status)} />
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Quorum Required</span>
                <span className="text-white text-xs">{formatVP(quorumRequired)} VP</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Total VP Cast</span>
                <span className="text-white text-xs">{formatVP(unifiedTotal)} VP</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Chains Reporting</span>
                <span className="text-white text-xs">{proposal.chainBreakdown.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Vote Bar ─────────────────────────────────────────────

function VoteBar({
  label,
  value,
  pct,
  color,
  textColor,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  textColor: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${textColor}`}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatVP(value)} VP</span>
          <span className="text-xs text-gray-500 tabular-nums">{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
            <th className="text-right font-medium py-1 px-2">For VP</th>
            <th className="text-right font-medium py-1 px-2">Against VP</th>
            <th className="text-right font-medium py-1 px-2">Abstain VP</th>
            <th className="text-right font-medium py-1 pl-2">Total VP</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {breakdown.map(chain => (
            <tr key={chain.chainKey} className="border-t border-gray-800/50">
              <td className="py-1.5 pr-4 text-white font-medium">{chain.chainName}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-emerald-400">{formatVP(chain.yes)}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-red-400">{formatVP(chain.no)}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{formatVP(chain.abstain)}</td>
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
            <td className="py-1.5 px-2 text-right tabular-nums text-gray-400 font-semibold">
              {formatVP(proposal.unifiedAbstain)}
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

// ─── Network Status ───────────────────────────────────────

function NetworkStatus({
  activeChain,
  isSupported,
  switching,
  onSwitch,
}: {
  activeChain: NexusChainConfig | null;
  isSupported: boolean;
  switching: boolean;
  onSwitch: (chain: NexusChainConfig) => void;
}) {
  if (isSupported && activeChain) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Voting from: {activeChain.name}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
        <AlertTriangle size={14} />
        Switch to a supported network to vote
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {SUPPORTED_CHAINS.map(chain => (
          <button
            key={chain.id}
            onClick={() => onSwitch(chain)}
            disabled={switching}
            className="px-2 py-1.5 text-[11px] font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
          >
            {chain.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Vote Success ─────────────────────────────────────────

function VoteSuccess({ vote, result }: { vote: VoteChoice; result: GovernanceAction }) {
  const choiceLabels: Record<VoteChoice, string> = {
    for: 'For',
    against: 'Against',
    abstain: 'Abstain',
  };

  return (
    <div className="text-center py-4">
      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
        <Check size={20} className="text-emerald-400" />
      </div>
      <p className="text-sm font-medium text-white mb-1">Vote Recorded</p>
      <p className="text-xs text-gray-400 mb-2">
        You voted <span className="font-medium text-white">{choiceLabels[vote]}</span>
      </p>
      <div className="space-y-1 text-[11px] text-gray-500">
        <div>Chain: <span className="text-gray-300">{result.chainName}</span></div>
        <div>
          {result.isHub ? 'Recorded directly on hub' : 'Will relay to hub via Axelar'}
        </div>
        <div className="font-mono text-gray-600 truncate">
          TX: {result.txHash}
        </div>
      </div>
    </div>
  );
}
