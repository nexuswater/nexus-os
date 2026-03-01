import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Badge,
  Button,
  Spinner,
  EmptyState,
  Modal,
} from '@/components/common';
import type {
  UtilityConnection,
  UtilityProvider,
  UtilityCategory,
  ConnectionMethod,
  ConnectionStatus,
} from '@nexus/shared';
import {
  Plug,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  Plus,
  Search,
  Droplets,
  Zap,
  ChevronRight,
  CheckCircle,
  Shield,
  ArrowLeft,
  ExternalLink,
  Clock,
  AlertTriangle,
  Globe,
  Link2,
  BookOpen,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'bg-emerald-400',
  PENDING: 'bg-yellow-400',
  REVOKED: 'bg-gray-500',
  FAILED: 'bg-red-400',
};

const STATUS_TEXT_COLORS: Record<ConnectionStatus, string> = {
  CONNECTED: 'text-emerald-400',
  PENDING: 'text-yellow-400',
  REVOKED: 'text-gray-400',
  FAILED: 'text-red-400',
};

const METHOD_BADGE_COLOR: Record<ConnectionMethod, 'blue' | 'green' | 'gray'> = {
  OAUTH: 'blue',
  AGGREGATOR: 'green',
  MANUAL: 'gray',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function categoryIcon(cat: UtilityCategory, size = 16) {
  if (cat === 'WATER') return <Droplets size={size} className="text-water-400" />;
  return <Zap size={size} className="text-energy-400" />;
}

function categoryColor(cat: UtilityCategory): string {
  return cat === 'WATER' ? 'text-water-400' : 'text-energy-400';
}

/* -------------------------------------------------------------------------- */
/*  Connect New Wizard Modal                                                   */
/* -------------------------------------------------------------------------- */

interface WizardModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
  providers: UtilityProvider[];
}

function ConnectWizardModal({ open, onClose, onConnected, providers }: WizardModalProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<UtilityCategory | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<UtilityProvider | null>(null);
  const [consentChecks, setConsentChecks] = useState([false, false, false, false]);
  const [connectMethod, setConnectMethod] = useState<ConnectionMethod | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [result, setResult] = useState<'success' | 'pending' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setCategory(null);
      setProviderSearch('');
      setSelectedProvider(null);
      setConsentChecks([false, false, false, false]);
      setConnectMethod(null);
      setConnecting(false);
      setResult(null);
      setError(null);
    }
  }, [open]);

  function toggleConsent(idx: number) {
    setConsentChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  const allConsented = consentChecks.every(Boolean);

  // Filter providers by category and search
  const filteredProviders = providers.filter((p) => {
    if (category && p.category !== category) return false;
    if (providerSearch.trim()) {
      return p.name.toLowerCase().includes(providerSearch.toLowerCase());
    }
    return true;
  });

  async function handleConnect() {
    if (!selectedProvider || !connectMethod) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/vault/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          method: connectMethod,
          category: selectedProvider.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Connection failed');
      setResult(connectMethod === 'OAUTH' ? 'success' : 'pending');
      setStep(5);
      onConnected();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConnecting(false);
    }
  }

  const CONSENT_ITEMS = [
    {
      label: 'Read-only access to my usage data',
      detail: 'We will only read consumption and billing data. No write or control access.',
    },
    {
      label: 'Data collected: usage, billing period, amounts, service address (masked)',
      detail: 'Personal identifiers like full name and exact address are masked.',
    },
    {
      label: 'Purpose: verification + sustainability accounting',
      detail: 'Data is used to verify resource usage and mint corresponding sustainability tokens.',
    },
    {
      label: 'I can revoke this connection at any time',
      detail: 'You retain full control and can disconnect at any point from the dashboard.',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Connect Utility Account">
      {/* Step Progress Bar */}
      {step <= 4 && (
        <div className="flex items-center gap-1 mb-5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-nexus-500' : 'bg-gray-800'}`}
            />
          ))}
        </div>
      )}

      {/* ─── Step 1: Choose Category ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            What type of utility account would you like to connect?
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCategory('WATER');
                setStep(2);
              }}
              className="group p-6 rounded-xl border border-gray-800 hover:border-water-500/50 hover:bg-water-500/5 transition-colors text-center"
            >
              <Droplets
                size={32}
                className="mx-auto mb-3 text-gray-500 group-hover:text-water-400 transition-colors"
              />
              <div className="text-sm font-medium text-white mb-1">Water</div>
              <div className="text-[11px] text-gray-500">
                Municipal water, wells, recycling systems
              </div>
            </button>
            <button
              onClick={() => {
                setCategory('ENERGY');
                setStep(2);
              }}
              className="group p-6 rounded-xl border border-gray-800 hover:border-energy-500/50 hover:bg-energy-500/5 transition-colors text-center"
            >
              <Zap
                size={32}
                className="mx-auto mb-3 text-gray-500 group-hover:text-energy-400 transition-colors"
              />
              <div className="text-sm font-medium text-white mb-1">Energy</div>
              <div className="text-[11px] text-gray-500">
                Electric, solar, gas, hydrogen providers
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Search & Select Provider ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm text-gray-400">Select your utility provider</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
            />
          </div>

          {/* Provider List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {filteredProviders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500">No providers found for this category.</p>
              </div>
            ) : (
              filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider);
                    setStep(3);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/60 transition-colors text-left"
                >
                  {categoryIcon(provider.category, 18)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{provider.name}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                      <Globe size={10} />
                      {provider.region}
                      <span className="text-gray-600">|</span>
                      {provider.methods.map((m) => m.toLowerCase()).join(', ')}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Step 3: Consent Screen ─── */}
      {step === 3 && selectedProvider && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setStep(2)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm text-gray-400">
              Review data access for{' '}
              <span className="text-white font-medium">{selectedProvider.name}</span>
            </p>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-nexus-950/30 border border-nexus-800/30">
            <Shield size={16} className="text-nexus-400 mt-0.5 shrink-0" />
            <div className="text-xs text-gray-400 leading-relaxed">
              NEXUS OS requests minimal data access to verify your resource usage. All data is
              encrypted in transit and at rest. You can revoke access at any time.
            </div>
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-2">
            {CONSENT_ITEMS.map((item, idx) => (
              <label
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={consentChecks[idx]}
                  onChange={() => toggleConsent(idx)}
                  className="mt-0.5 rounded border-gray-600 text-nexus-500 focus:ring-nexus-500 bg-gray-700"
                />
                <div>
                  <div className="text-sm text-gray-300">{item.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{item.detail}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button size="sm" disabled={!allConsented} onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Choose Connect Method ─── */}
      {step === 4 && selectedProvider && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setStep(3)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm text-gray-400">
              Choose how to connect to{' '}
              <span className="text-white font-medium">{selectedProvider.name}</span>
            </p>
          </div>

          <div className="space-y-3">
            {/* OAuth */}
            {selectedProvider.methods.includes('OAUTH') && (
              <button
                onClick={() => {
                  setConnectMethod('OAUTH');
                  handleConnect();
                }}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-nexus-500/50 hover:bg-nexus-500/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-nexus-600/20 flex items-center justify-center shrink-0">
                  <ExternalLink size={18} className="text-nexus-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Connect with OAuth</div>
                  <div className="text-[11px] text-gray-500">
                    Secure redirect to {selectedProvider.name} for authorization. Recommended.
                  </div>
                </div>
                {connecting && connectMethod === 'OAUTH' ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronRight size={14} className="text-gray-600" />
                )}
              </button>
            )}

            {/* Aggregator */}
            {selectedProvider.methods.includes('AGGREGATOR') && (
              <button
                onClick={() => {
                  setConnectMethod('AGGREGATOR');
                  handleConnect();
                }}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-green-500/50 hover:bg-green-500/5 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
                  <Link2 size={18} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Via Data Aggregator</div>
                  <div className="text-[11px] text-gray-500">
                    Connect through a third-party aggregator for automatic bill import.
                  </div>
                </div>
                {connecting && connectMethod === 'AGGREGATOR' ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronRight size={14} className="text-gray-600" />
                )}
              </button>
            )}

            {/* Manual */}
            {selectedProvider.methods.includes('MANUAL') && (
              <button
                onClick={() => {
                  setConnectMethod('MANUAL');
                  handleConnect();
                }}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-800 hover:border-gray-600 hover:bg-gray-800/60 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-gray-700/40 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Manual Upload</div>
                  <div className="text-[11px] text-gray-500">
                    Download bills yourself and upload them to the Bills page for verification.
                  </div>
                </div>
                {connecting && connectMethod === 'MANUAL' ? (
                  <Spinner size="sm" />
                ) : (
                  <ChevronRight size={14} className="text-gray-600" />
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-800/40">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
            Back
          </Button>
        </div>
      )}

      {/* ─── Step 5: Result ─── */}
      {step === 5 && (
        <div className="text-center py-6 space-y-4">
          {result === 'success' ? (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Connection Established</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your {selectedProvider?.name} account is now connected. Usage data will sync
                  automatically.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                <Clock size={24} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Connection Pending</p>
                <p className="text-xs text-gray-400 mt-1">
                  Your connection request has been submitted. It may take a few minutes to
                  establish. We will notify you once the connection is active.
                </p>
              </div>
            </>
          )}
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function UtilityConnect() {
  /* ---- Data ---- */
  const [connections, setConnections] = useState<UtilityConnection[]>([]);
  const [providers, setProviders] = useState<UtilityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  /* ---- Modal ---- */
  const [wizardOpen, setWizardOpen] = useState(false);

  /* ---- Provider Search ---- */
  const [dirSearch, setDirSearch] = useState('');
  const [dirCategory, setDirCategory] = useState<UtilityCategory | 'ALL'>('ALL');

  /* ---- Fetch ---- */
  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/vault/connections').then((r) => r.json()),
      fetch('/api/vault/connections/providers').then((r) => r.json()),
    ])
      .then(([cRes, pRes]) => {
        setConnections(cRes.data ?? []);
        setProviders(pRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Actions ---- */
  async function handleSync(connId: string) {
    setSyncing(connId);
    try {
      await fetch(`/api/vault/connections/${connId}/sync`, { method: 'POST' });
      fetchData();
    } catch {
      // silent
    } finally {
      setSyncing(null);
    }
  }

  async function handleRevoke(connId: string) {
    setRevoking(connId);
    try {
      await fetch(`/api/vault/connections/${connId}/revoke`, { method: 'POST' });
      fetchData();
    } catch {
      // silent
    } finally {
      setRevoking(null);
    }
  }

  /* ---- Derived data ---- */
  const activeConnections = connections.filter((c) => c.status === 'CONNECTED');
  const pendingConnections = connections.filter((c) => c.status === 'PENDING');
  const revokedConnections = connections.filter((c) => c.status === 'REVOKED' || c.status === 'FAILED');

  // IDs of providers already connected
  const connectedProviderNames = new Set(connections.map((c) => c.providerName));

  // Filter provider directory
  const filteredDirectoryProviders = providers.filter((p) => {
    if (dirCategory !== 'ALL' && p.category !== dirCategory) return false;
    if (dirSearch.trim()) {
      return p.name.toLowerCase().includes(dirSearch.toLowerCase());
    }
    return true;
  });

  /* ---- Loading ---- */
  if (loading && connections.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plug size={20} className="text-nexus-400" />
          <h1 className="page-title mb-0">Utility Connect</h1>
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Connect Utility Account
        </Button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Connect your utility accounts for automatic bill import and usage verification
      </p>

      {/* ================================================================== */}
      {/*  Connection Summary                                                  */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card header="Active" icon={<Wifi className="w-4 h-4 text-emerald-400" />}>
          <div className="stat-value text-emerald-400">{activeConnections.length}</div>
          <div className="stat-label">Connected accounts</div>
        </Card>

        <Card header="Pending" icon={<Clock className="w-4 h-4 text-yellow-400" />}>
          <div className="stat-value text-yellow-400">{pendingConnections.length}</div>
          <div className="stat-label">Awaiting authorization</div>
        </Card>

        <Card header="Revoked / Failed" icon={<WifiOff className="w-4 h-4 text-gray-400" />}>
          <div className="stat-value text-gray-400">{revokedConnections.length}</div>
          <div className="stat-label">Disconnected</div>
        </Card>

        <Card header="Providers" icon={<Globe className="w-4 h-4 text-gray-400" />}>
          <div className="stat-value text-white">{providers.length}</div>
          <div className="stat-label">Available in directory</div>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  Active Connections                                                  */}
      {/* ================================================================== */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-gray-500" />
          Active Connections
        </h2>

        {connections.length === 0 ? (
          <EmptyState
            icon={<Plug size={32} />}
            title="No connections yet"
            description="Connect a utility account to start importing bills and usage data automatically."
            actionLabel="Connect Utility Account"
            onAction={() => setWizardOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {connections.map((conn) => (
              <Card key={conn.id}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {categoryIcon(conn.category, 18)}
                    <span className="text-sm font-semibold text-white">{conn.providerName}</span>
                    <Badge color={conn.category === 'WATER' ? 'water' : 'energy'}>
                      {conn.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={METHOD_BADGE_COLOR[conn.method]}>{conn.method}</Badge>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[conn.status]}`} />
                    <span className={`text-xs font-medium ${STATUS_TEXT_COLORS[conn.status]}`}>
                      {conn.status}
                    </span>
                  </div>
                  <span className="text-gray-700">|</span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Clock size={10} />
                    Last synced: {formatRelativeTime(conn.lastSyncedAt)}
                  </div>
                </div>

                {/* Consent Version */}
                <div className="text-[11px] text-gray-600 mb-3">
                  Consent v{conn.consentVersion}
                </div>

                {/* Scopes */}
                {conn.scopes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {conn.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-700/40 text-gray-400"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800/60">
                  {conn.status === 'CONNECTED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={syncing === conn.id}
                      onClick={() => handleSync(conn.id)}
                    >
                      {syncing === conn.id ? (
                        <Spinner size="sm" className="mr-1.5" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {syncing === conn.id ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  )}

                  {conn.status === 'PENDING' && (
                    <span className="text-[11px] text-yellow-400 flex items-center gap-1">
                      <Clock size={10} />
                      Awaiting provider authorization...
                    </span>
                  )}

                  {(conn.status === 'CONNECTED' || conn.status === 'PENDING') && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={revoking === conn.id}
                      onClick={() => handleRevoke(conn.id)}
                      className="ml-auto"
                    >
                      {revoking === conn.id ? (
                        <Spinner size="sm" className="mr-1.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {revoking === conn.id ? 'Revoking...' : 'Revoke'}
                    </Button>
                  )}

                  {(conn.status === 'REVOKED' || conn.status === 'FAILED') && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <WifiOff size={10} />
                      {conn.status === 'FAILED' ? 'Connection failed' : 'Connection revoked'}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/*  Provider Directory                                                  */}
      {/* ================================================================== */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-500" />
          Provider Directory
        </h2>

        {/* Directory Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={dirSearch}
              onChange={(e) => setDirSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors"
            />
          </div>

          <div className="flex gap-1.5">
            {(['ALL', 'WATER', 'ENERGY'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setDirCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dirCategory === cat
                    ? 'bg-nexus-600/20 text-nexus-400'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat === 'WATER' ? 'Water' : 'Energy'}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {filteredDirectoryProviders.length === 0 ? (
          <EmptyState
            icon={<Globe size={32} />}
            title="No providers found"
            description="Try adjusting your search or category filter."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDirectoryProviders.map((provider) => {
              const isConnected = connectedProviderNames.has(provider.name);
              return (
                <Card key={provider.id} className="flex flex-col">
                  {/* Provider Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {categoryIcon(provider.category, 18)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {provider.name}
                      </div>
                      <div className="text-[11px] text-gray-500">{provider.region}</div>
                    </div>
                    <Badge color={provider.category === 'WATER' ? 'water' : 'energy'}>
                      {provider.category}
                    </Badge>
                  </div>

                  {/* Methods */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {provider.methods.map((method) => (
                      <span
                        key={method}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400"
                      >
                        {method}
                      </span>
                    ))}
                  </div>

                  {/* Connect Button */}
                  <div className="mt-auto pt-3 border-t border-gray-800/60">
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle size={12} />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setWizardOpen(true)}
                      >
                        <Plug className="w-3.5 h-3.5 mr-1.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/*  Wizard Modal                                                        */}
      {/* ================================================================== */}
      <ConnectWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnected={fetchData}
        providers={providers}
      />
    </div>
  );
}
