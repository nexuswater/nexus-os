import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Vote, Landmark, BookOpen, BarChart3, Users, ArrowRight,
  Plus, PlayCircle, ThumbsUp, ThumbsDown, Clock, CheckCircle2,
  XCircle, AlertTriangle,
} from 'lucide-react';
import { TerminalCard } from '@/components/terminal';
import { Select, useToast } from '@/components/common';
import {
  useNexusProposals,
  useNexusVotes,
  useNexusUser,
  useNexusKPIs,
  useNexusActions,
} from '@/mock/useNexusStore';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function timeRemaining(isoEnd: string): string {
  const ms = new Date(isoEnd).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

const TYPE_COLORS: Record<string, string> = {
  REWARD_RATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NEW_DEPLOYMENT: 'bg-[#25D695]/20 text-[#25D695] border-[#25D695]/30',
  BUDGET: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PARAMETER_CHANGE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  EMERGENCY: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Clock className="w-3 h-3" />,
  ACTIVE: <PlayCircle className="w-3 h-3" />,
  PASSED: <CheckCircle2 className="w-3 h-3" />,
  FAILED: <XCircle className="w-3 h-3" />,
  EXECUTED: <CheckCircle2 className="w-3 h-3" />,
  CANCELLED: <AlertTriangle className="w-3 h-3" />,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400',
  ACTIVE: 'text-[#25D695]',
  PASSED: 'text-blue-400',
  FAILED: 'text-red-400',
  EXECUTED: 'text-[#25D695]',
  CANCELLED: 'text-gray-500',
};

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */

export default function DAO() {
  const proposals = useNexusProposals();
  const votes = useNexusVotes();
  const user = useNexusUser();
  const kpis = useNexusKPIs();
  const actions = useNexusActions();
  const { toast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('BUDGET');
  const [newDesc, setNewDesc] = useState('');

  // ─── Derived values ───────────────────────────────────
  const activeProposals = useMemo(
    () => proposals.filter(p => p.status === 'ACTIVE'),
    [proposals],
  );

  // Voting power: NXS balance + (WTR + ENG) * 0.1
  const votingPower = useMemo(() => {
    let nxs = 0;
    let wtr = 0;
    let eng = 0;
    for (const cb of user.chainBalances) {
      nxs += cb.balances.NXS ?? 0;
      wtr += cb.balances.WTR ?? 0;
      eng += cb.balances.ENG ?? 0;
    }
    return nxs + (wtr + eng) * 0.1;
  }, [user]);

  // Total unique voters across all proposals
  const totalVoters = useMemo(() => {
    const unique = new Set(votes.map(v => v.voter));
    return unique.size;
  }, [votes]);

  // Quorum status: % of active proposals that have met quorum
  const quorumStatus = useMemo(() => {
    if (activeProposals.length === 0) return 100;
    const metQuorum = activeProposals.filter(p => {
      const totalCast = p.votesFor + p.votesAgainst + p.votesAbstain;
      return totalCast >= p.quorum;
    }).length;
    return Math.round((metQuorum / activeProposals.length) * 100);
  }, [activeProposals]);

  const [votedMap, setVotedMap] = useState<Record<string, 'FOR' | 'AGAINST'>>({});

  // ─── Handlers ─────────────────────────────────────────
  function handleVote(proposalId: string, choice: 'FOR' | 'AGAINST') {
    actions.vote(proposalId, choice, Math.max(1, Math.floor(votingPower)));
    setVotedMap(prev => ({ ...prev, [proposalId]: choice }));
    toast(
      `Vote cast: ${choice === 'FOR' ? 'For' : 'Against'} (${Math.floor(votingPower)} VP)`,
      choice === 'FOR' ? 'success' : 'info',
    );
  }

  function handleCreate() {
    if (!newTitle.trim()) return;
    actions.createProposal(newTitle.trim(), newType, newDesc.trim() || 'No description provided.');
    setNewTitle('');
    setNewDesc('');
    setShowCreateForm(false);
    toast('Proposal created and now active', 'success');
  }

  /* ---- Main render ---- */
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Governance</h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mt-1 font-mono">
            {'// dao > governance_hub'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D695]" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Live</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  NAV LINKS                                                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { to: '/dao/proposals', icon: Vote, label: 'Proposals', sub: `${kpis.activeProposals} active` },
          { to: '/dao/treasury', icon: Landmark, label: 'Treasury', sub: 'View allocations' },
          { to: '/dao/voting-power', icon: BarChart3, label: 'Voting Power', sub: `${formatNumber(votingPower)} VP` },
          { to: '/dao/rules', icon: BookOpen, label: 'Rules', sub: 'Governance config' },
          { to: '/dao/delegation', icon: Users, label: 'Delegation', sub: 'Delegate or operate' },
        ].map(nav => (
          <Link
            key={nav.to}
            to={nav.to}
            className="bg-[#111820] border border-[#1C2432] rounded-md px-4 py-3 hover:border-[#25D695]/30 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <nav.icon size={14} className="text-gray-600 group-hover:text-[#25D695] transition-colors" />
              <span className="text-xs font-medium text-white">{nav.label}</span>
            </div>
            <span className="text-[10px] text-gray-500">{nav.sub}</span>
          </Link>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  KPI CARDS                                                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Active Proposals', value: String(kpis.activeProposals), accent: 'text-[#25D695]' },
          { label: 'Total Voters', value: formatNumber(totalVoters), accent: 'text-blue-400' },
          { label: 'Your Voting Power', value: formatNumber(votingPower) + ' VP', accent: 'text-[#25D695]' },
          { label: 'Quorum Status', value: quorumStatus + '%', accent: quorumStatus >= 50 ? 'text-[#25D695]' : 'text-amber-400' },
        ].map(kpi => (
          <TerminalCard key={kpi.label} title={kpi.label} padding="sm">
            <span className={`text-xl font-semibold tabular-nums ${kpi.accent}`}>
              {kpi.value}
            </span>
          </TerminalCard>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  ACTION BUTTONS                                              */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[#25D695]/15 text-[#25D695] border border-[#25D695]/30 hover:bg-[#25D695]/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Proposal
        </button>
        <button
          onClick={() => actions.advanceProposals()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[#111820] text-gray-300 border border-[#1C2432] hover:border-[#25D695]/30 hover:text-[#25D695] transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Advance Proposals
        </button>
      </div>

      {/* ============================================================ */}
      {/*  CREATE PROPOSAL FORM                                        */}
      {/* ============================================================ */}
      {showCreateForm && (
        <TerminalCard title="New Proposal" className="mb-5" glow>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Proposal title..."
              className="w-full bg-[#0B0F14] border border-[#1C2432] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#25D695]/50 focus:outline-none"
            />
            <Select
              value={newType}
              onChange={v => setNewType(v)}
              options={['REWARD_RATE', 'NEW_DEPLOYMENT', 'BUDGET', 'PARAMETER_CHANGE', 'EMERGENCY'].map(t => ({ value: t, label: t.replace(/_/g, ' ') }))}
              placeholder="Select type..."
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              rows={3}
              className="w-full bg-[#0B0F14] border border-[#1C2432] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#25D695]/50 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded text-xs font-medium bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90 transition-colors"
              >
                Submit Proposal
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded text-xs font-medium text-gray-400 border border-[#1C2432] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </TerminalCard>
      )}

      {/* ============================================================ */}
      {/*  ACTIVE PROPOSALS LIST                                       */}
      {/* ============================================================ */}
      <TerminalCard title="Active Proposals" statusDot="active">
        {activeProposals.length === 0 ? (
          <p className="text-sm text-gray-600 py-6 text-center font-mono">
            No active proposals. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3 mt-2">
            {activeProposals.map(p => {
              const totalCast = p.votesFor + p.votesAgainst + p.votesAbstain;
              const forPct = totalCast > 0 ? Math.round((p.votesFor / totalCast) * 100) : 0;
              const againstPct = totalCast > 0 ? Math.round((p.votesAgainst / totalCast) * 100) : 0;
              const quorumPct = p.quorum > 0 ? Math.min(100, Math.round((totalCast / p.quorum) * 100)) : 0;

              return (
                <div
                  key={p.id}
                  className="bg-[#0B0F14] border border-[#1C2432] rounded-lg p-4 hover:border-[#1C2432]/80 transition-colors"
                >
                  {/* Header: title + badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{p.title}</h3>
                      <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1 font-mono">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-medium border ${TYPE_COLORS[p.type] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {p.type.replace(/_/g, ' ')}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${STATUS_COLORS[p.status]}`}>
                        {STATUS_ICONS[p.status]}
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* Vote bars */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wide text-gray-600 w-14">For</span>
                      <div className="flex-1 h-2 bg-[#1C2432] rounded-full overflow-hidden">
                        <div className="h-full bg-[#25D695] rounded-full transition-all" style={{ width: `${forPct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-gray-400 w-10 text-right font-mono">{forPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-wide text-gray-600 w-14">Against</span>
                      <div className="flex-1 h-2 bg-[#1C2432] rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${againstPct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-gray-400 w-10 text-right font-mono">{againstPct}%</span>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono mb-3">
                    <span>{p.totalVoters} voter{p.totalVoters !== 1 ? 's' : ''}</span>
                    <span>Quorum {quorumPct}%</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeRemaining(p.votingEndsAt)}
                    </span>
                  </div>

                  {/* Vote buttons */}
                  <div className="flex items-center gap-2">
                    {votedMap[p.id] ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium ${
                        votedMap[p.id] === 'FOR'
                          ? 'bg-[#25D695]/20 text-[#25D695] border border-[#25D695]/40'
                          : 'bg-red-400/20 text-red-400 border border-red-400/40'
                      }`}>
                        {votedMap[p.id] === 'FOR' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                        Voted {votedMap[p.id] === 'FOR' ? 'For' : 'Against'}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleVote(p.id, 'FOR')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/20 hover:bg-[#25D695]/20 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Vote For
                        </button>
                        <button
                          onClick={() => handleVote(p.id, 'AGAINST')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          Vote Against
                        </button>
                      </>
                    )}
                    <Link
                      to={`/dao/proposals/${p.id}`}
                      className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#25D695] transition-colors"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Link
          to="/dao/proposals"
          className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-[#25D695] mt-4 transition-colors"
        >
          View all {proposals.length} proposals <ArrowRight size={12} />
        </Link>
      </TerminalCard>

      {/* ---- Bottom timestamp ---- */}
      <div className="mt-5 flex items-center justify-between py-3 border-t border-[#1C2432]">
        <span className="text-[9px] font-mono text-gray-700">
          governance_hub v1.0 // nexus protocol
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
