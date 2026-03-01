import { useState, useEffect } from 'react';
import { Card, Button, Spinner, Badge, EmptyState } from '@/components/common';
import { ArrowRight, Clock, Check, AlertCircle, Link2, Unplug } from 'lucide-react';

interface BridgeRoute {
  id: string;
  from_chain: string;
  to_chain: string;
  from_token: string;
  to_token: string;
  estimated_time_seconds: number;
  fee_usd: number;
  provider: string;
  available: boolean;
}

interface WalletData {
  xrpl: Record<string, unknown> | null;
  evm: Record<string, unknown> | null;
  xrplBalances: { nxs: number; xrp: number; rlusd: number };
  evmBalances: { nxs: number; xrp: number; rlusd: number };
}

export default function CrossChain() {
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [bridging, setBridging] = useState(false);
  const [txResult, setTxResult] = useState<{
    tx_hash: string;
    estimated_time_seconds: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/swap/bridge-routes').then(r => r.json()),
      fetch('/api/swap/wallet').then(r => r.json()),
    ])
      .then(([routesRes, walletRes]) => {
        setRoutes(routesRes.data ?? []);
        setWallet(walletRes.data ?? null);
      })
      .catch(() => {
        setRoutes([]);
        setWallet(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const evmConnected = wallet?.evm != null;

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  }

  async function handleBridge(route: BridgeRoute) {
    const amt = amounts[route.id];
    if (!amt || parseFloat(amt) <= 0) return;
    setBridging(true);
    setSelectedRoute(route.id);
    setError(null);
    setTxResult(null);
    try {
      const res = await fetch('/api/swap/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_id: route.id,
          amount: parseFloat(amt),
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.tx_hash) {
        setTxResult({
          tx_hash: json.data.tx_hash,
          estimated_time_seconds:
            json.data.estimated_time_seconds ?? route.estimated_time_seconds,
        });
      } else {
        setError(json.error ?? 'Bridge transaction failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBridging(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Powered By Banner */}
      <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5">
        <Link2 className="w-4 h-4 text-nexus-400" />
        <span className="text-xs text-gray-400">
          Powered by <span className="text-white font-medium">Squid Router</span>
        </span>
      </div>

      {/* EVM Wallet Warning */}
      {!evmConnected && (
        <div className="flex items-center gap-3 bg-yellow-600/10 border border-yellow-600/20 rounded-xl px-4 py-3">
          <Unplug className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-400">
            Connect EVM wallet to enable cross-chain bridging
          </span>
        </div>
      )}

      {/* Success State */}
      {txResult && (
        <div className="bg-green-600/10 border border-green-600/20 rounded-xl px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
            <Check className="w-4 h-4" />
            Bridge transaction submitted
          </div>
          <div className="text-xs text-gray-400">
            Tx:{' '}
            <span className="text-gray-300 font-mono">
              {txResult.tx_hash.length > 24
                ? `${txResult.tx_hash.slice(0, 12)}...${txResult.tx_hash.slice(-8)}`
                : txResult.tx_hash}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            Estimated arrival: {formatTime(txResult.estimated_time_seconds)}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-600/10 border border-red-600/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Routes */}
      {routes.length === 0 ? (
        <EmptyState
          icon={<Link2 size={32} />}
          title="No bridge routes available"
          description="Cross-chain bridge routes are not currently available. Check back later."
        />
      ) : (
        <div className="space-y-3">
          {routes.map(route => {
            const routeAmount = amounts[route.id] ?? '';
            const isActive = selectedRoute === route.id;

            return (
              <Card key={route.id} className={isActive && txResult ? 'border-green-600/30' : ''}>
                {/* Route Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge color="blue">{route.from_chain}</Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                    <Badge color="green">{route.to_chain}</Badge>
                  </div>
                  {!route.available && (
                    <Badge color="yellow">Unavailable</Badge>
                  )}
                </div>

                {/* Token Info */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-white">
                      {route.from_token}
                    </span>
                    {route.from_token !== route.to_token && (
                      <>
                        <ArrowRight className="w-3 h-3 text-gray-600 inline mx-1.5" />
                        <span className="text-sm font-medium text-white">
                          {route.to_token}
                        </span>
                      </>
                    )}
                  </div>
                  <Badge color="gray">{route.provider}</Badge>
                </div>

                {/* Details Row */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{formatTime(route.estimated_time_seconds)}
                  </div>
                  <div>
                    Fee: <span className="text-gray-300">${route.fee_usd.toFixed(2)}</span>
                  </div>
                </div>

                {/* Amount + Bridge Button */}
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={routeAmount}
                    onChange={e => {
                      setAmounts(prev => ({ ...prev, [route.id]: e.target.value }));
                      if (selectedRoute === route.id) {
                        setTxResult(null);
                        setError(null);
                      }
                    }}
                    min="0"
                    step="any"
                    disabled={!route.available || !evmConnected}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-500 transition-colors tabular-nums disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    disabled={
                      !route.available ||
                      !evmConnected ||
                      !routeAmount ||
                      parseFloat(routeAmount) <= 0 ||
                      (bridging && isActive)
                    }
                    onClick={() => handleBridge(route)}
                  >
                    {bridging && isActive ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Bridging...
                      </span>
                    ) : (
                      'Bridge'
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
