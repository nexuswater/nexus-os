import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChainSelector from './ChainSelector';
import RouteCard from './RouteCard';
import SagaTimeline from './SagaTimeline';

type Phase = 'configure' | 'quoting' | 'routes' | 'executing' | 'receipt';

export type CrossChainMode = 'bridge' | 'cross-chain';

interface Token {
  symbol: string;
  name: string;
}

const TOKENS: Token[] = [
  { symbol: 'NXS', name: 'Nexus' },
  { symbol: 'WTR', name: 'Water Credit' },
  { symbol: 'ENG', name: 'Energy Credit' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'RLUSD', name: 'Ripple USD' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'ETH', name: 'Ethereum' },
];

interface CrossChainModalProps {
  open: boolean;
  onClose: () => void;
  /** 'bridge' locks from/to token to same value; 'cross-chain' allows full control */
  mode?: CrossChainMode;
}

const MODE_DEFAULTS: Record<CrossChainMode, { fromChain: string; toChain: string; fromToken: string; toToken: string; title: string; subtitle: string }> = {
  bridge: {
    fromChain: 'XRPL',
    toChain: 'BASE',
    fromToken: 'NXS',
    toToken: 'NXS',
    title: 'Bridge Transfer',
    subtitle: 'Same token, different chain',
  },
  'cross-chain': {
    fromChain: 'XRPL',
    toChain: 'BASE',
    fromToken: 'XRP',
    toToken: 'USDC',
    title: 'Cross-Chain Swap',
    subtitle: 'Any token, any chain',
  },
};

export default function CrossChainModal({ open, onClose, mode = 'cross-chain' }: CrossChainModalProps) {
  const defaults = MODE_DEFAULTS[mode];

  const [phase, setPhase] = useState<Phase>('configure');
  const [fromChain, setFromChain] = useState(defaults.fromChain);
  const [toChain, setToChain] = useState(defaults.toChain);
  const [fromToken, setFromToken] = useState(defaults.fromToken);
  const [toToken, setToToken] = useState(defaults.toToken);
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [sagaState, setSagaState] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isBridge = mode === 'bridge';

  // Reset on open — apply mode-specific defaults
  useEffect(() => {
    if (open) {
      const d = MODE_DEFAULTS[mode];
      setPhase('configure');
      setFromChain(d.fromChain);
      setToChain(d.toChain);
      setFromToken(d.fromToken);
      setToToken(d.toToken);
      setAmount('');
      setRoutes([]);
      setSelectedRouteId(null);
      setIntentId(null);
      setSagaState(null);
      setReceipt(null);
      setError(null);
    }
  }, [open, mode]);

  // Bridge mode: sync toToken with fromToken
  useEffect(() => {
    if (isBridge) setToToken(fromToken);
  }, [isBridge, fromToken]);

  // Get quote
  const handleGetQuote = useCallback(async () => {
    if (!amount || Number(amount) <= 0) return;
    setPhase('quoting');
    setError(null);
    try {
      const res = await fetch('/api/crosschain/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromChain, toChain, fromToken, toToken, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.data && data.data.routes?.length > 0) {
        setRoutes(data.data.routes);
        setIntentId(data.data.intentId);
        setSelectedRouteId(data.data.bestRouteId);
        setPhase('routes');
      } else {
        setError('No routes found for this pair');
        setPhase('configure');
      }
    } catch (err: any) {
      setError(err.message ?? 'Quote failed');
      setPhase('configure');
    }
  }, [fromChain, toChain, fromToken, toToken, amount]);

  // Execute selected route
  const handleExecute = useCallback(async () => {
    if (!intentId || !selectedRouteId) return;
    setPhase('executing');
    setError(null);
    try {
      const res = await fetch('/api/crosschain/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId, routeId: selectedRouteId }),
      });
      const data = await res.json();
      setSagaState(data.data);
    } catch (err: any) {
      setError(err.message ?? 'Execution failed');
    }
  }, [intentId, selectedRouteId]);

  // Poll saga status
  useEffect(() => {
    if (phase !== 'executing' || !intentId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/crosschain/status/${intentId}`);
        const data = await res.json();
        if (data.data) {
          setSagaState(data.data);
          if (data.data.status === 'completed') {
            const receiptRes = await fetch(`/api/crosschain/receipt/${intentId}`);
            const receiptData = await receiptRes.json();
            setReceipt(receiptData.data);
            setPhase('receipt');
            clearInterval(interval);
          } else if (data.data.status === 'failed' || data.data.status === 'stuck') {
            clearInterval(interval);
          }
        }
      } catch { /* ignore poll errors */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, intentId]);

  if (!open) return null;

  const selectedRoute = routes.find((r: any) => r.id === selectedRouteId);

  const phaseLabel =
    phase === 'configure' ? 'Configure intent' :
    phase === 'quoting' ? 'Finding routes...' :
    phase === 'routes' ? 'Select route' :
    phase === 'executing' ? 'Executing saga' :
    'Transfer complete';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#111820] border border-[#1C2432] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C2432]">
            <div>
              <h2 className="text-base font-semibold text-white">{defaults.title}</h2>
              <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">
                {phaseLabel}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 text-[#475569] hover:text-white rounded-lg hover:bg-[#1C2432]/60 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {/* PHASE: Configure */}
            {phase === 'configure' && (
              <div className="space-y-4">
                {/* Mode hint */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432]/60">
                  <span className="text-[10px] font-semibold text-[#25D695] uppercase tracking-wider">
                    {isBridge ? '↔ Bridge' : '⇄ Cross-Chain'}
                  </span>
                  <span className="text-[10px] text-[#475569]">—</span>
                  <span className="text-[10px] text-[#64748B]">{defaults.subtitle}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ChainSelector label="From Chain" value={fromChain} onChange={setFromChain} />
                  <ChainSelector label="To Chain" value={toChain} onChange={setToChain} />
                </div>

                {isBridge ? (
                  /* Bridge: single token selector */
                  <div>
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">Token</span>
                    <select
                      value={fromToken}
                      onChange={e => setFromToken(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-sm focus:outline-none focus:border-[#25D695]/50"
                    >
                      {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol} — {t.name}</option>)}
                    </select>
                    <p className="text-[10px] text-[#475569] mt-1">
                      Bridging {fromToken} from {fromChain} → {toChain}
                    </p>
                  </div>
                ) : (
                  /* Cross-chain: from + to token selectors */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">From Token</span>
                      <select
                        value={fromToken}
                        onChange={e => setFromToken(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-sm focus:outline-none focus:border-[#25D695]/50"
                      >
                        {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol} — {t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">To Token</span>
                      <select
                        value={toToken}
                        onChange={e => setToToken(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-sm focus:outline-none focus:border-[#25D695]/50"
                      >
                        {TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol} — {t.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">Amount</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-lg font-bold tabular-nums placeholder:text-[#334155] focus:outline-none focus:border-[#25D695]/50"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleGetQuote}
                  disabled={!amount || Number(amount) <= 0}
                  className="w-full py-3 bg-[#25D695] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#1FBF84] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isBridge ? 'Get Bridge Quote' : 'Get Quote'}
                </button>
              </div>
            )}

            {/* PHASE: Quoting */}
            {phase === 'quoting' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="text-[#25D695] animate-spin mb-3" />
                <p className="text-sm text-[#64748B]">
                  {isBridge ? 'Finding bridge routes...' : 'Finding best routes...'}
                </p>
              </div>
            )}

            {/* PHASE: Routes */}
            {phase === 'routes' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <span className="font-medium text-white">{amount} {fromToken}</span>
                  <ArrowRight size={14} className="text-[#475569]" />
                  <span className="font-medium text-white">{toToken}</span>
                  <span className="text-[10px] text-[#475569] ml-1">
                    ({routes.length} route{routes.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <div className="space-y-2">
                  {routes.map((route: any) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      outputToken={toToken}
                      selected={route.id === selectedRouteId}
                      onSelect={() => setSelectedRouteId(route.id)}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPhase('configure')}
                    className="flex-1 py-2.5 bg-[#1C2432] text-[#94A3B8] font-medium rounded-xl hover:bg-[#25384F] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={!selectedRouteId}
                    className="flex-[2] py-2.5 bg-[#25D695] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#1FBF84] disabled:opacity-40 transition-colors"
                  >
                    {isBridge ? 'Execute Bridge' : 'Execute Route'}
                  </button>
                </div>
              </div>
            )}

            {/* PHASE: Executing */}
            {phase === 'executing' && sagaState && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white">{amount} {fromToken}</span>
                  <ArrowRight size={14} className="text-[#475569]" />
                  <span className="font-medium text-white">{toToken}</span>
                </div>

                <SagaTimeline
                  steps={sagaState.steps}
                  routeSteps={selectedRoute?.steps}
                />

                {(sagaState.status === 'failed' || sagaState.status === 'stuck') && (
                  <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/20">
                    <p className="text-sm text-red-400">
                      {sagaState.status === 'stuck'
                        ? 'Transaction stuck. You can retry or close.'
                        : 'Transaction failed.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PHASE: Receipt */}
            {phase === 'receipt' && receipt && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle2 size={48} className="text-[#25D695] mb-3" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-white">
                    {isBridge ? 'Bridge Complete' : 'Transfer Complete'}
                  </h3>
                  <p className="text-sm text-[#64748B]">
                    {receipt.inputAmount} {receipt.inputToken} → {receipt.outputAmount?.toFixed?.(4) ?? receipt.outputAmount} {receipt.outputToken}
                  </p>
                </div>

                {receipt.explorerLinks?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em]">
                      Transaction Links
                    </span>
                    {receipt.explorerLinks.map((link: any, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432] hover:border-[#25D69530] text-sm transition-colors"
                      >
                        <span className="text-[#64748B] text-xs">{link.chainId}</span>
                        <span className="font-mono text-[#94A3B8] flex-1 truncate text-xs">{link.txHash}</span>
                        <ExternalLink size={12} className="text-[#25D695]" />
                      </a>
                    ))}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-[#25D695] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#1FBF84] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
