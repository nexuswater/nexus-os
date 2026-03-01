import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, StatusBadge, TabGroup, Button, Spinner, EmptyState, Modal } from '@/components/common';
import { Users, ArrowLeft, CheckCircle, AlertTriangle, Copy } from 'lucide-react';

// ─── Inline Types ──────────────────────────────────────
type DelegationScope = 'SCOPE_NXS' | 'SCOPE_IMPACT' | 'SCOPE_NFT_MULTIPLIER' | 'SCOPE_ALL';
type DelegationStatus = 'pending' | 'active' | 'revoked' | 'expired';

interface DelegationRecord {
  id: string;
  rail: 'xrpl' | 'evm';
  delegatorAddress: string;
  delegateAddress: string;
  scopes: DelegationScope[];
  feeBps: number;
  startTime: string;
  endTime?: string;
  revocable: boolean;
  status: DelegationStatus;
  policyVersion: string;
  notes?: string;
}

interface DelegateProfile {
  delegateAddress: string;
  displayName: string;
  bio: string;
  feeBpsDefault: number;
  rail: 'xrpl' | 'evm' | 'both';
  scopesSupported: DelegationScope[];
  performanceStats: { participationRate: number; proposalsVoted: number; uptime: number };
  verifiedBadge: boolean;
}

// ─── Constants ─────────────────────────────────────────
const WALLET_ADDRESS = 'rNexus4Qh7xkPdTJfbGDwJceYEw5K3v8Hn';
const TABS = ['yours', 'incoming', 'operators'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  yours: 'Your Delegations',
  incoming: 'Delegated To You',
  operators: 'Operators',
};

const SCOPE_LABELS: Record<DelegationScope, string> = {
  SCOPE_NXS: 'NXS',
  SCOPE_IMPACT: 'Impact',
  SCOPE_NFT_MULTIPLIER: 'NFT',
  SCOPE_ALL: 'All',
};

const SCOPE_COLORS: Record<DelegationScope, string> = {
  SCOPE_NXS: 'bg-nexus-600/20 text-nexus-400',
  SCOPE_IMPACT: 'bg-green-600/20 text-green-400',
  SCOPE_NFT_MULTIPLIER: 'bg-yellow-600/20 text-yellow-400',
  SCOPE_ALL: 'bg-gray-600/20 text-gray-300',
};

const STATUS_COLORS: Record<DelegationStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  active: 'green',
  pending: 'yellow',
  revoked: 'red',
  expired: 'gray',
};

const MOCK_VP_PER_DELEGATION = 5000;
const MOCK_REWARD_RATE = 0.005;

// ─── Helpers ───────────────────────────────────────────
function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2) + '%';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function ScopeChips({ scopes }: { scopes: DelegationScope[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {scopes.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${SCOPE_COLORS[s]}`}
        >
          {SCOPE_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

function RailBadge({ rail }: { rail: 'xrpl' | 'evm' | 'both' }) {
  if (rail === 'both') {
    return (
      <div className="flex gap-1">
        <Badge color="blue">XRPL</Badge>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400`}>EVM</span>
      </div>
    );
  }
  if (rail === 'evm') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
        EVM
      </span>
    );
  }
  return <Badge color="blue">XRPL</Badge>;
}

// ─── Rewards Estimate ──────────────────────────────────
function RewardsEstimate({ feeBps }: { feeBps: number }) {
  const estimatedRewards = MOCK_VP_PER_DELEGATION * MOCK_REWARD_RATE;
  const operatorFee = estimatedRewards * (feeBps / 10000);
  const netToYou = estimatedRewards - operatorFee;

  return (
    <div className="mt-3 pt-3 border-t border-gray-800/60">
      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
        Governance Rewards Estimate
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-medium text-white">{estimatedRewards.toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Monthly Est.</div>
        </div>
        <div>
          <div className="text-sm font-medium text-red-400">-{operatorFee.toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Operator Fee</div>
        </div>
        <div>
          <div className="text-sm font-medium text-green-400">{netToYou.toFixed(2)}</div>
          <div className="text-[10px] text-gray-500">Net to You</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-600 text-center mt-1">Variable, policy-dependent</div>
    </div>
  );
}

// ─── Create Delegation Modal ───────────────────────────
interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  prefillAddress?: string;
  prefillRail?: 'xrpl' | 'evm';
  onCreated: () => void;
}

function CreateDelegationModal({ open, onClose, prefillAddress, prefillRail, onCreated }: CreateModalProps) {
  const [step, setStep] = useState(1);
  const [rail, setRail] = useState<'xrpl' | 'evm' | null>(prefillRail ?? null);
  const [delegateAddr, setDelegateAddr] = useState(prefillAddress ?? '');
  const [scopes, setScopes] = useState<DelegationScope[]>([]);
  const [feeBps, setFeeBps] = useState(500);
  const [understood, setUnderstood] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep(prefillAddress ? 3 : prefillRail ? 2 : 1);
      setRail(prefillRail ?? null);
      setDelegateAddr(prefillAddress ?? '');
      setScopes([]);
      setFeeBps(500);
      setUnderstood(false);
      setSubmitting(false);
      setTxHash(null);
      setError(null);
    }
  }, [open, prefillAddress, prefillRail]);

  function toggleScope(scope: DelegationScope) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/delegation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegatorAddress: WALLET_ADDRESS,
          delegateAddress: delegateAddr,
          rail,
          scopes,
          feeBps,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create delegation');
      setTxHash(json.data?.txHash ?? json.txHash ?? 'TX_PENDING');
      setStep(6);
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  const SCOPE_OPTIONS: { value: DelegationScope; label: string }[] = [
    { value: 'SCOPE_NXS', label: 'NXS Voting Power' },
    { value: 'SCOPE_IMPACT', label: 'Impact Token Governance' },
    { value: 'SCOPE_NFT_MULTIPLIER', label: 'NFT Multiplier Delegation' },
    { value: 'SCOPE_ALL', label: 'All Scopes' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Create Delegation">
      {/* Step indicators */}
      {step <= 5 && (
        <div className="flex items-center gap-1 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? 'bg-nexus-500' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Choose Rail */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Choose the rail for this delegation.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setRail('xrpl'); setStep(2); }}
              className="p-4 rounded-xl border border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-center"
            >
              <div className="text-sm font-medium text-white mb-1">XRPL</div>
              <div className="text-[11px] text-gray-500">XRP Ledger</div>
            </button>
            <button
              onClick={() => { setRail('evm'); setStep(2); }}
              className="p-4 rounded-xl border border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-center"
            >
              <div className="text-sm font-medium text-white mb-1">EVM</div>
              <div className="text-[11px] text-gray-500">EVM Sidechain</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Delegate Address */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Enter the delegate (operator) address.</p>
          <input
            type="text"
            value={delegateAddr}
            onChange={(e) => setDelegateAddr(e.target.value)}
            placeholder={rail === 'xrpl' ? 'rXXXXXX...' : '0xXXXXXX...'}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-500 transition-colors"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
            <Button
              size="sm"
              disabled={!delegateAddr.trim()}
              onClick={() => setStep(3)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Scopes */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Select governance scopes to delegate.</p>
          <div className="space-y-2">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                  className="rounded border-gray-600 text-nexus-500 focus:ring-nexus-500 bg-gray-700"
                />
                <span className="text-sm text-gray-300">{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
            <Button
              size="sm"
              disabled={scopes.length === 0}
              onClick={() => setStep(4)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Set Fee */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Set the operator fee in basis points (0 - 2000). This fee is taken from governance reward distributions only.
          </p>
          <div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={2000}
                value={feeBps}
                onChange={(e) => setFeeBps(Math.min(2000, Math.max(0, Number(e.target.value))))}
                className="w-28 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-nexus-500 transition-colors"
              />
              <span className="text-sm text-gray-400">BPS</span>
              <span className="text-sm font-medium text-white">= {bpsToPercent(feeBps)}</span>
            </div>
            <div className="text-[11px] text-gray-600 mt-1">
              100 BPS = 1.00%. Max 2000 BPS = 20.00%
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Back</Button>
            <Button size="sm" onClick={() => setStep(5)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 5: Warning + Confirm */}
      {step === 5 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-3 rounded-lg bg-gray-800/50 space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Rail</span>
              <span className="text-white">{rail?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Delegate</span>
              <span className="text-white font-mono text-xs">{truncateAddress(delegateAddr)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Scopes</span>
              <span className="text-white">{scopes.map((s) => SCOPE_LABELS[s]).join(', ')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Operator Fee</span>
              <span className="text-white">{bpsToPercent(feeBps)}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">
              Delegation gives another address the ability to vote with your power for selected scopes.
              You can revoke if revocable. Fee is paid only from governance reward distributions,
              not from your principal token balance.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="rounded border-gray-600 text-nexus-500 focus:ring-nexus-500 bg-gray-700"
            />
            <span className="text-sm text-gray-300">I understand</span>
          </label>

          {error && (
            <div className="text-xs text-red-400 p-2 rounded bg-red-950/30 border border-red-800/40">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(4)}>Back</Button>
            <Button
              size="sm"
              disabled={!understood || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : 'Confirm Delegation'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: Success */}
      {step === 6 && (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Delegation Created</p>
            <p className="text-xs text-gray-400 mt-1">Your delegation has been submitted successfully.</p>
          </div>
          {txHash && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
              <span className="text-xs font-mono text-gray-400">{truncateAddress(txHash)}</span>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Copy size={12} />
              </button>
            </div>
          )}
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────
export default function Delegation() {
  const [activeTab, setActiveTab] = useState<Tab>('yours');
  const [delegations, setDelegations] = useState<DelegationRecord[]>([]);
  const [incoming, setIncoming] = useState<DelegationRecord[]>([]);
  const [operators, setOperators] = useState<DelegateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>();
  const [prefillRail, setPrefillRail] = useState<'xrpl' | 'evm' | undefined>();

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/delegation?address=${WALLET_ADDRESS}`).then((r) => r.json()),
      fetch(`/api/delegation/incoming?address=${WALLET_ADDRESS}`).then((r) => r.json()),
      fetch('/api/delegation/operators').then((r) => r.json()),
    ])
      .then(([d, inc, ops]) => {
        setDelegations(d.data ?? []);
        setIncoming(inc.data ?? []);
        setOperators(ops.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await fetch(`/api/delegation/${id}/revoke`, { method: 'POST' });
      fetchData();
    } catch {
      // silent
    } finally {
      setRevoking(null);
    }
  }

  function openCreateModal(address?: string, rail?: 'xrpl' | 'evm') {
    setPrefillAddress(address);
    setPrefillRail(rail);
    setModalOpen(true);
  }

  // ─── Tab Content Renderers ─────────────────────────────

  function renderYourDelegations() {
    if (delegations.length === 0) {
      return (
        <EmptyState
          icon={<Users size={32} />}
          title="No delegations yet"
          description="Delegate your voting power to a governance operator to participate passively."
          actionLabel="Create Delegation"
          onAction={() => openCreateModal()}
        />
      );
    }

    return (
      <div className="space-y-4">
        {delegations.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{truncateAddress(d.delegateAddress)}</span>
                <RailBadge rail={d.rail} />
              </div>
              <StatusBadge status={d.status} color={STATUS_COLORS[d.status]} />
            </div>

            <div className="flex items-center gap-3 mb-3">
              <ScopeChips scopes={d.scopes} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Operator Fee</div>
                <div className="text-white font-medium">{bpsToPercent(d.feeBps)}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Start Date</div>
                <div className="text-white">{formatDate(d.startTime)}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Policy Version</div>
                <div className="text-gray-400 font-mono text-xs">{d.policyVersion}</div>
              </div>
            </div>

            {d.notes && (
              <div className="mt-3 text-xs text-gray-500 italic">{d.notes}</div>
            )}

            <RewardsEstimate feeBps={d.feeBps} />

            {d.revocable && d.status === 'active' && (
              <div className="mt-3 pt-3 border-t border-gray-800/60">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={revoking === d.id}
                  onClick={() => handleRevoke(d.id)}
                >
                  {revoking === d.id ? 'Revoking...' : 'Revoke Delegation'}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  function renderIncoming() {
    if (incoming.length === 0) {
      return (
        <EmptyState
          icon={<Users size={32} />}
          title="No incoming delegations"
          description="When others delegate voting power to you, they will appear here."
        />
      );
    }

    return (
      <div className="space-y-4">
        {incoming.map((d) => (
          <Card key={d.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{truncateAddress(d.delegatorAddress)}</span>
                <RailBadge rail={d.rail} />
              </div>
              <StatusBadge status={d.status} color={STATUS_COLORS[d.status]} />
            </div>

            <div className="flex items-center gap-3 mb-3">
              <ScopeChips scopes={d.scopes} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Operator Fee</div>
                <div className="text-white font-medium">{bpsToPercent(d.feeBps)}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Status</div>
                <div className="text-white capitalize">{d.status}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider">Est. Delegated VP</div>
                <div className="text-nexus-400 font-medium">{MOCK_VP_PER_DELEGATION.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        ))}

        {/* Summary */}
        <Card className="border-nexus-600/30">
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-white">
              {(incoming.filter((d) => d.status === 'active').length * MOCK_VP_PER_DELEGATION).toLocaleString()} VP
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Delegated Voting Power (Active)</div>
          </div>
        </Card>
      </div>
    );
  }

  function renderOperators() {
    if (operators.length === 0) {
      return (
        <EmptyState
          icon={<Users size={32} />}
          title="No operators found"
          description="Governance operators will be listed here once registered."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {operators.map((op) => (
          <Card key={op.delegateAddress}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-white">{op.displayName}</span>
              {op.verifiedBadge && (
                <CheckCircle size={14} className="text-green-400" />
              )}
            </div>

            {/* Rail + Address */}
            <div className="flex items-center gap-2 mb-3">
              <RailBadge rail={op.rail} />
              <span className="text-xs font-mono text-gray-500">{truncateAddress(op.delegateAddress)}</span>
            </div>

            {/* Bio */}
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{op.bio}</p>

            {/* Scopes */}
            <div className="mb-3">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Scopes Supported</div>
              <ScopeChips scopes={op.scopesSupported} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3 p-2 rounded-lg bg-gray-800/40">
              <div>
                <div className="text-sm font-medium text-white">
                  {(op.performanceStats.participationRate * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-500">Participation</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {op.performanceStats.proposalsVoted}
                </div>
                <div className="text-[10px] text-gray-500">Proposals Voted</div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {(op.performanceStats.uptime * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-gray-500">Uptime</div>
              </div>
            </div>

            {/* Fee + Action */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/60">
              <div>
                <div className="text-[10px] text-gray-600 uppercase tracking-wider">Default Fee</div>
                <div className="text-sm font-medium text-white">{bpsToPercent(op.feeBpsDefault)}</div>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  openCreateModal(
                    op.delegateAddress,
                    op.rail === 'both' ? undefined : op.rail,
                  )
                }
              >
                Delegate
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <div>
      {/* Back link */}
      <Link
        to="/dao"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to DAO
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-nexus-400" />
          <h1 className="page-title mb-0">Delegation</h1>
        </div>
        <Button size="sm" onClick={() => openCreateModal()}>
          Create Delegation
        </Button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Delegate voting power to governance operators
      </p>

      {/* Tabs */}
      <div className="mb-6">
        <TabGroup
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          labels={TAB_LABELS}
          counts={{
            yours: delegations.length,
            incoming: incoming.length,
            operators: operators.length,
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {activeTab === 'yours' && renderYourDelegations()}
          {activeTab === 'incoming' && renderIncoming()}
          {activeTab === 'operators' && renderOperators()}
        </>
      )}

      {/* Create Delegation Modal */}
      <CreateDelegationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefillAddress={prefillAddress}
        prefillRail={prefillRail}
        onCreated={fetchData}
      />
    </div>
  );
}
