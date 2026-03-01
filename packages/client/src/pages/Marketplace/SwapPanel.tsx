import { useState, useEffect, useMemo } from 'react';
import { Card, Button, Spinner, Badge } from '@/components/common';
import { ArrowDownUp, Wallet, Check, AlertCircle } from 'lucide-react';

interface SwapPair {
  from: string;
  to: string;
  rate: number;
  inverse_rate: number;
  fee_bps: number;
  source: string;
  available: boolean;
}

interface WalletData {
  xrplBalances: { nxs: number; xrp: number; rlusd: number };
  evmBalances: { nxs: number; xrp: number; rlusd: number };
}

export default function SwapPanel() {
  const [pairs, setPairs] = useState<SwapPair[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const [fromToken, setFromToken] = useState('XRP');
  const [toToken, setToToken] = useState('RLUSD');
  const [amount, setAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/swap/pairs').then(r => r.json()),
      fetch('/api/swap/wallet').then(r => r.json()),
    ])
      .then(([pairsRes, walletRes]) => {
        setPairs(pairsRes.data ?? []);
        setWallet(walletRes.data ?? null);
      })
      .catch(() => {
        setPairs([]);
        setWallet(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const tokens = useMemo(() => {
    const set = new Set<string>();
    for (const p of pairs) {
      set.add(p.from);
      set.add(p.to);
    }
    return Array.from(set).sort();
  }, [pairs]);

  const toTokens = useMemo(() => {
    return tokens.filter(t => {
      if (t === fromToken) return false;
      return pairs.some(
        p =>
          (p.from === fromToken && p.to === t) ||
          (p.to === fromToken && p.from === t),
      );
    });
  }, [tokens, fromToken, pairs]);

  const activePair = useMemo(() => {
    return pairs.find(
      p =>
        (p.from === fromToken && p.to === toToken) ||
        (p.from === toToken && p.to === fromToken),
    );
  }, [pairs, fromToken, toToken]);

  const isReversed = activePair ? activePair.from !== fromToken : false;
  const rate = activePair
    ? isReversed
      ? activePair.inverse_rate
      : activePair.rate
    : 0;
  const feeBps = activePair?.fee_bps ?? 0;
  const outputAmount = amount && rate ? (parseFloat(amount) * rate).toFixed(6) : '';

  // Reset toToken if it is no longer valid after changing fromToken
  useEffect(() => {
    if (!toTokens.includes(toToken) && toTokens.length > 0) {
      setToToken(toTokens[0]);
    }
  }, [toTokens, toToken]);

  function handleFlip() {
    const prev = fromToken;
    setFromToken(toToken);
    setToToken(prev);
    setAmount('');
    setTxHash(null);
    setError(null);
  }

  async function handleSwap() {
    if (!amount || parseFloat(amount) <= 0 || !activePair) return;
    setSwapping(true);
    setError(null);
    setTxHash(null);
    try {
      const res = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromToken,
          to: toToken,
          amount: parseFloat(amount),
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.tx_hash) {
        setTxHash(json.data.tx_hash);
      } else {
        setError(json.error ?? 'Swap failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSwapping(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const xrpBal = wallet?.xrplBalances?.xrp ?? 0;
  const rlusdBal = wallet?.xrplBalances?.rlusd ?? 0;

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Wallet Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-400">XRP Balance</span>
          </div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {xrpBal.toLocaleString()}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-400">RLUSD Balance</span>
          </div>
          <div className="text-lg font-semibold text-white tabular-nums">
            {rlusdBal.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Swap Card */}
      <Card>
        {/* From */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            From
          </label>
          <div className="flex gap-3">
            <select
              value={fromToken}
              onChange={e => {
                setFromToken(e.target.value);
                setTxHash(null);
                setError(null);
              }}
              className="flex-shrink-0 w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nexus-500 transition-colors"
            >
              {tokens.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                setTxHash(null);
                setError(null);
              }}
              min="0"
              step="any"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-500 transition-colors tabular-nums"
            />
          </div>
        </div>

        {/* Flip Button */}
        <div className="flex justify-center my-3">
          <button
            onClick={handleFlip}
            className="p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-colors"
          >
            <ArrowDownUp className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* To */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            To
          </label>
          <div className="flex gap-3">
            <select
              value={toToken}
              onChange={e => {
                setToToken(e.target.value);
                setTxHash(null);
                setError(null);
              }}
              className="flex-shrink-0 w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-nexus-500 transition-colors"
            >
              {toTokens.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-300 tabular-nums">
              {outputAmount || '0.00'}
            </div>
          </div>
        </div>

        {/* Rate & Fee */}
        {activePair && (
          <div className="mt-4 space-y-2 pt-4 border-t border-gray-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Rate</span>
              <span className="text-gray-300 tabular-nums">
                1 {fromToken} = {rate.toFixed(6)} {toToken}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Fee</span>
              <span className="text-gray-300 tabular-nums">
                {(feeBps / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Source</span>
              <Badge color="gray">{activePair.source}</Badge>
            </div>
            {!activePair.available && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                This pair is currently unavailable
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-600/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success */}
        {txHash && (
          <div className="mt-4 bg-green-600/10 rounded-lg px-3 py-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
              <Check className="w-4 h-4" />
              Swap executed successfully
            </div>
            <div className="text-xs text-gray-400">
              Tx:{' '}
              <span className="text-gray-300 font-mono">
                {txHash.length > 20
                  ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
                  : txHash}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <div className="mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={
              swapping ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !activePair?.available ||
              !!txHash
            }
            onClick={handleSwap}
          >
            {swapping ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Swapping...
              </span>
            ) : txHash ? (
              'Swap Complete'
            ) : (
              'Swap'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
