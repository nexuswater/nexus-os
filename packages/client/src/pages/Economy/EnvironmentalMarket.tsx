/**
 * EnvironmentalMarket — Apple-simple environmental asset marketplace.
 * Three panels: Swap, Redeem, Retire.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  Leaf,
  Flame,
  CheckCircle2,
  Copy,
  RotateCcw,
  Recycle,
  Coins,
  Wallet,
  Info,
} from 'lucide-react';
import { generateEnvAssets, generateBalances, generateFeeConfig } from '@/mock/generators/economy';

// ─── Types ───────────────────────────────────────────────

type PanelTab = 'Swap' | 'Redeem' | 'Retire';
type RoutePreference = 'Best' | 'XRPL Only' | 'EVM Only';

interface QuoteResult {
  amountOut: number;
  rate: number;
  route: string;
  settlementFee: number;
  receiptFee: number;
  totalFees: number;
  estimatedTime: string;
}

interface ReceiptResult {
  id: string;
  type: string;
  amountIn: number;
  amountOut: number;
  assetIn: string;
  assetOut: string;
  txHash: string;
  timestamp: string;
  certificateRef?: string;
}

// ─── Mock Data ───────────────────────────────────────────

const envAssets = generateEnvAssets();
const balances = generateBalances();
const feeConfig = generateFeeConfig();

const userBalances: Record<string, number> = {};
for (const b of balances) {
  if (b.ownerId === 'user_demo') {
    userBalances[b.asset] = b.available;
  }
}

const MOCK_RATES: Record<string, Record<string, number>> = {
  WTR: { ENG: 0.694, NXS: 0.084, RLUSD: 0.042, XRP: 0.019 },
  ENG: { WTR: 1.441, NXS: 0.072, RLUSD: 0.036, XRP: 0.016 },
  NXS: { WTR: 11.905, ENG: 13.889, RLUSD: 0.50, XRP: 0.222 },
  RLUSD: { WTR: 23.810, ENG: 27.778, NXS: 2.00, XRP: 0.444 },
  XRP: { WTR: 52.632, ENG: 62.500, NXS: 4.50, RLUSD: 2.25 },
};

const ASSET_SYMBOLS = ['WTR', 'ENG', 'NXS', 'RLUSD', 'XRP'] as const;

const ASSET_ICONS: Record<string, typeof Leaf> = {
  WTR: Leaf,
  ENG: Flame,
  NXS: Coins,
  RLUSD: Wallet,
  XRP: Wallet,
};

const ASSET_COLORS: Record<string, string> = {
  WTR: 'text-blue-400',
  ENG: 'text-amber-400',
  NXS: 'text-[#25D695]',
  RLUSD: 'text-emerald-300',
  XRP: 'text-gray-300',
};

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

function generateReceiptId(): string {
  return `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Shared UI Components ────────────────────────────────

function AssetIcon({ symbol, size = 16 }: { symbol: string; size?: number }) {
  const Icon = ASSET_ICONS[symbol] ?? Coins;
  const color = ASSET_COLORS[symbol] ?? 'text-gray-400';
  return <Icon size={size} className={color} />;
}

function AssetDropdown({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  const options = ASSET_SYMBOLS.filter((s) => s !== exclude);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1C2432] hover:bg-[#232d3f] rounded-lg px-3 py-2.5 text-sm font-mono text-white transition-colors min-w-[110px]"
      >
        <AssetIcon symbol={value} size={14} />
        <span>{value}</span>
        <ChevronDown size={14} className="text-gray-500 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-[#111820] border border-[#1C2432] rounded-lg shadow-xl min-w-[140px] overflow-hidden">
          {options.map((sym) => (
            <button
              key={sym}
              onClick={() => {
                onChange(sym);
                setOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm font-mono transition-colors ${
                sym === value
                  ? 'bg-[#1C2432] text-white'
                  : 'text-gray-400 hover:bg-[#1C2432]/60 hover:text-white'
              }`}
            >
              <AssetIcon symbol={sym} size={14} />
              {sym}
              <span className="ml-auto text-[11px] text-[#64748B] tabular-nums">
                {(userBalances[sym] ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SuccessScreen({
  receipt,
  onReset,
}: {
  receipt: ReceiptResult;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const shortHash = `${receipt.txHash.slice(0, 10)}...${receipt.txHash.slice(-8)}`;

  return (
    <div className="text-center space-y-5 py-2">
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-[#25D695]/10 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-[#25D695]" />
        </div>
      </div>

      <div>
        <h3 className="text-white text-base font-semibold mb-1">
          {receipt.type === 'RETIRE' ? 'Assets Retired' : receipt.type === 'REDEEM' ? 'Redemption Complete' : 'Trade Executed'}
        </h3>
        <p className="text-gray-400 text-sm">
          {receipt.amountIn.toLocaleString()} {receipt.assetIn}
          <ArrowRight size={14} className="inline mx-1.5 text-gray-600" />
          {receipt.amountOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} {receipt.assetOut}
        </p>
      </div>

      <div className="bg-[#0B0F14] rounded-lg p-4 space-y-2.5 text-left">
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Receipt ID</span>
          <span className="font-mono text-gray-300">{receipt.id}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Tx Hash</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(receipt.txHash);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 font-mono text-gray-300 hover:text-white transition-colors"
          >
            {shortHash}
            {copied ? (
              <CheckCircle2 size={11} className="text-[#25D695]" />
            ) : (
              <Copy size={11} className="text-gray-600" />
            )}
          </button>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#64748B]">Time</span>
          <span className="font-mono text-gray-300">{receipt.timestamp}</span>
        </div>
        {receipt.certificateRef && (
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Certificate</span>
            <span className="font-mono text-amber-300">{receipt.certificateRef}</span>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <RotateCcw size={14} />
        New Transaction
      </button>
    </div>
  );
}

// ─── Swap Panel ──────────────────────────────────────────

function SwapView() {
  const [fromAsset, setFromAsset] = useState('WTR');
  const [toAsset, setToAsset] = useState('NXS');
  const [amount, setAmount] = useState('');
  const [routePref, setRoutePref] = useState<RoutePreference>('Best');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);

  const estimatedOutput = useMemo(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return 0;
    const rate = MOCK_RATES[fromAsset]?.[toAsset] ?? 0;
    return val * rate;
  }, [amount, fromAsset, toAsset]);

  const currentRate = MOCK_RATES[fromAsset]?.[toAsset] ?? 0;

  const handleFlip = useCallback(() => {
    const prev = fromAsset;
    setFromAsset(toAsset);
    setToAsset(prev);
    setAmount('');
    setQuote(null);
  }, [fromAsset, toAsset]);

  function handleGetQuote() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const rate = MOCK_RATES[fromAsset]?.[toAsset] ?? 0;
    const amountOut = val * rate;
    const settlementFee = val * (feeConfig.settlementFeeBps / 10000);
    const receiptFee = feeConfig.receiptFlatFee;
    setQuote({
      amountOut,
      rate,
      route: routePref === 'XRPL Only' ? 'XRPL AMM' : routePref === 'EVM Only' ? 'EVM DEX' : 'XRPL AMM (Best)',
      settlementFee,
      receiptFee,
      totalFees: settlementFee + receiptFee,
      estimatedTime: '~3 seconds',
    });
  }

  function handleSubmitTrade() {
    if (!quote) return;
    setSubmitting(true);
    setTimeout(() => {
      setReceipt({
        id: generateReceiptId(),
        type: 'TRADE',
        amountIn: parseFloat(amount),
        amountOut: quote.amountOut,
        assetIn: fromAsset,
        assetOut: toAsset,
        txHash: generateTxHash(),
        timestamp: new Date().toLocaleString(),
      });
      setSubmitting(false);
    }, 1200);
  }

  function handleReset() {
    setAmount('');
    setQuote(null);
    setReceipt(null);
  }

  if (receipt) {
    return <SuccessScreen receipt={receipt} onReset={handleReset} />;
  }

  return (
    <div className="space-y-4">
      {/* You give */}
      <div className="bg-[#0B0F14] rounded-lg p-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-3">
          You give
        </div>
        <div className="flex items-center gap-3">
          <AssetDropdown value={fromAsset} onChange={(v) => { setFromAsset(v); setQuote(null); }} exclude={toAsset} />
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
            className="flex-1 bg-transparent text-right text-xl font-mono text-white placeholder-gray-700 outline-none tabular-nums"
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[#64748B] font-mono">
            Balance: {(userBalances[fromAsset] ?? 0).toLocaleString()}
          </span>
          <button
            onClick={() => { setAmount(String(userBalances[fromAsset] ?? 0)); setQuote(null); }}
            className="text-[11px] text-[#25D695] font-mono hover:text-[#25D695]/80 transition-colors"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Swap arrow */}
      <div className="flex justify-center -my-1">
        <button
          onClick={handleFlip}
          className="w-9 h-9 rounded-full bg-[#111820] border border-[#1C2432] flex items-center justify-center hover:border-[#25D695]/30 transition-colors"
        >
          <ArrowDownUp size={16} className="text-gray-400" />
        </button>
      </div>

      {/* You get */}
      <div className="bg-[#0B0F14] rounded-lg p-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-3">
          You get
        </div>
        <div className="flex items-center gap-3">
          <AssetDropdown value={toAsset} onChange={(v) => { setToAsset(v); setQuote(null); }} exclude={fromAsset} />
          <div className="flex-1 text-right text-xl font-mono text-gray-300 tabular-nums">
            {estimatedOutput > 0
              ? estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })
              : '0.00'}
          </div>
        </div>
        {currentRate > 0 && (
          <div className="text-[11px] text-[#64748B] font-mono mt-2 text-right">
            1 {fromAsset} = {currentRate} {toAsset}
          </div>
        )}
      </div>

      {/* Route preference */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Route</span>
        <div className="flex gap-1 bg-[#0B0F14] rounded-lg p-0.5">
          {(['Best', 'XRPL Only', 'EVM Only'] as RoutePreference[]).map((pref) => (
            <button
              key={pref}
              onClick={() => { setRoutePref(pref); setQuote(null); }}
              className={`px-3 py-1.5 text-[11px] font-mono rounded-md transition-colors ${
                routePref === pref
                  ? 'bg-[#1C2432] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {/* Quote details */}
      {quote && (
        <div className="bg-[#0B0F14] rounded-lg p-4 space-y-2.5 border border-[#1C2432]">
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Route</span>
            <span className="font-mono text-gray-300">{quote.route}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Rate</span>
            <span className="font-mono text-gray-300">1 {fromAsset} = {quote.rate} {toAsset}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Settlement Fee</span>
            <span className="font-mono text-gray-300">{quote.settlementFee.toFixed(4)} {fromAsset}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#64748B]">Receipt Fee</span>
            <span className="font-mono text-gray-300">{quote.receiptFee.toFixed(2)} RLUSD</span>
          </div>
          <div className="border-t border-[#1C2432] pt-2 flex justify-between text-xs">
            <span className="text-[#64748B]">Estimated Time</span>
            <span className="font-mono text-[#25D695]">{quote.estimatedTime}</span>
          </div>
        </div>
      )}

      {/* Fee summary (before quote) */}
      {!quote && parseFloat(amount) > 0 && (
        <div className="flex justify-between text-[11px] text-[#64748B] font-mono px-1">
          <span>Settlement: {(feeConfig.settlementFeeBps / 100).toFixed(2)}%</span>
          <span>Receipt: {feeConfig.receiptFlatFee} RLUSD</span>
        </div>
      )}

      {/* Action button */}
      {!quote ? (
        <button
          onClick={handleGetQuote}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90"
        >
          Get Quote
        </button>
      ) : (
        <button
          onClick={handleSubmitTrade}
          disabled={submitting}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin" />
              Executing...
            </span>
          ) : (
            'Submit Trade'
          )}
        </button>
      )}
    </div>
  );
}

// ─── Redeem Panel ────────────────────────────────────────

function RedeemView() {
  const [asset, setAsset] = useState<'WTR' | 'ENG'>('WTR');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);

  const REDEEM_RATES: Record<string, number> = { WTR: 0.084, ENG: 0.072 };

  const estimatedNXS = useMemo(() => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return 0;
    return val * REDEEM_RATES[asset];
  }, [amount, asset]);

  function handleRedeem() {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setSubmitting(true);
    setTimeout(() => {
      setReceipt({
        id: generateReceiptId(),
        type: 'REDEEM',
        amountIn: val,
        amountOut: estimatedNXS,
        assetIn: asset,
        assetOut: 'NXS',
        txHash: generateTxHash(),
        timestamp: new Date().toLocaleString(),
      });
      setSubmitting(false);
    }, 1000);
  }

  if (receipt) {
    return <SuccessScreen receipt={receipt} onReset={() => { setAmount(''); setReceipt(null); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#0B0F14] rounded-lg p-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-3">
          Redeem environmental tokens for NXS rewards
        </div>

        {/* Current rates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Leaf size={14} className="text-blue-400" />
              <span className="text-xs font-mono text-gray-400">WTR Rate</span>
            </div>
            <div className="text-sm font-mono text-white">1 WTR = <span className="text-[#25D695]">0.084</span> NXS</div>
          </div>
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Flame size={14} className="text-amber-400" />
              <span className="text-xs font-mono text-gray-400">ENG Rate</span>
            </div>
            <div className="text-sm font-mono text-white">1 ENG = <span className="text-[#25D695]">0.072</span> NXS</div>
          </div>
        </div>

        {/* Asset selector */}
        <div className="flex gap-2 mb-4">
          {(['WTR', 'ENG'] as const).map((sym) => (
            <button
              key={sym}
              onClick={() => { setAsset(sym); setAmount(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                asset === sym
                  ? 'bg-[#1C2432] text-white border border-[#25D695]/30'
                  : 'bg-[#111820] text-gray-500 border border-[#1C2432] hover:text-gray-300'
              }`}
            >
              <AssetIcon symbol={sym} size={14} />
              {sym}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-[#111820] border border-[#1C2432] rounded-lg px-3 py-2.5">
            <AssetIcon symbol={asset} size={16} />
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder-gray-700 outline-none tabular-nums"
            />
            <button
              onClick={() => setAmount(String(userBalances[asset] ?? 0))}
              className="text-[11px] text-[#25D695] font-mono hover:text-[#25D695]/80 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="text-[11px] text-[#64748B] font-mono px-1">
            Balance: {(userBalances[asset] ?? 0).toLocaleString()} {asset}
          </div>
        </div>
      </div>

      {/* Estimated output */}
      <div className="bg-[#0B0F14] rounded-lg p-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider mb-2">
          You receive
        </div>
        <div className="flex items-center gap-2">
          <AssetIcon symbol="NXS" size={18} />
          <span className="text-xl font-mono text-white tabular-nums">
            {estimatedNXS > 0
              ? estimatedNXS.toLocaleString(undefined, { maximumFractionDigits: 4 })
              : '0.00'}
          </span>
          <span className="text-sm text-gray-500 font-mono">NXS</span>
        </div>
      </div>

      {/* Redeem button */}
      <button
        onClick={handleRedeem}
        disabled={!amount || parseFloat(amount) <= 0 || submitting}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin" />
            Redeeming...
          </span>
        ) : (
          'Redeem'
        )}
      </button>
    </div>
  );
}

// ─── Retire Panel ────────────────────────────────────────

function RetireView() {
  const [asset, setAsset] = useState<'WTR' | 'ENG'>('WTR');
  const [amount, setAmount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);

  function handleRetire() {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !beneficiary.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setReceipt({
        id: generateReceiptId(),
        type: 'RETIRE',
        amountIn: val,
        amountOut: 0,
        assetIn: asset,
        assetOut: 'Retired',
        txHash: generateTxHash(),
        timestamp: new Date().toLocaleString(),
        certificateRef: `cert_ret_${Date.now().toString(36)}`,
      });
      setSubmitting(false);
    }, 1500);
  }

  if (receipt) {
    return <SuccessScreen receipt={receipt} onReset={() => { setAmount(''); setBeneficiary(''); setReason(''); setReceipt(null); }} />;
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
        <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-gray-400 leading-relaxed">
          Assets permanently removed from circulation as verified environmental impact.
          Retirement generates a certificate and proof chain on-ledger.
        </p>
      </div>

      {/* Asset + Amount */}
      <div className="bg-[#0B0F14] rounded-lg p-4 space-y-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
          Retire environmental assets
        </div>

        {/* Asset selector */}
        <div className="flex gap-2">
          {(['WTR', 'ENG'] as const).map((sym) => (
            <button
              key={sym}
              onClick={() => { setAsset(sym); setAmount(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                asset === sym
                  ? 'bg-[#1C2432] text-white border border-amber-500/30'
                  : 'bg-[#111820] text-gray-500 border border-[#1C2432] hover:text-gray-300'
              }`}
            >
              <AssetIcon symbol={sym} size={14} />
              {sym}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-[#111820] border border-[#1C2432] rounded-lg px-3 py-2.5">
            <AssetIcon symbol={asset} size={16} />
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder-gray-700 outline-none tabular-nums"
            />
            <button
              onClick={() => setAmount(String(userBalances[asset] ?? 0))}
              className="text-[11px] text-[#25D695] font-mono hover:text-[#25D695]/80 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="text-[11px] text-[#64748B] font-mono px-1">
            Balance: {(userBalances[asset] ?? 0).toLocaleString()} {asset}
          </div>
        </div>
      </div>

      {/* Beneficiary + Reason */}
      <div className="bg-[#0B0F14] rounded-lg p-4 space-y-4">
        <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
          Attribution
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-gray-400">Beneficiary Name</label>
          <input
            type="text"
            placeholder="e.g. City of Phoenix"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="w-full bg-[#111820] border border-[#1C2432] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-gray-700 outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-gray-400">Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g. Q1 2026 Carbon Offset"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#111820] border border-[#1C2432] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-gray-700 outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Retire button */}
      <button
        onClick={handleRetire}
        disabled={!amount || parseFloat(amount) <= 0 || !beneficiary.trim() || submitting}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 text-[#0B0F14] hover:bg-amber-400"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin" />
            Retiring...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Recycle size={16} />
            Retire Assets
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export default function EnvironmentalMarket() {
  const [activeTab, setActiveTab] = useState<PanelTab>('Swap');

  const TABS: { label: PanelTab; icon: typeof ArrowDownUp }[] = [
    { label: 'Swap', icon: ArrowDownUp },
    { label: 'Redeem', icon: Coins },
    { label: 'Retire', icon: Recycle },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Environmental Market
          </h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider hidden sm:inline">
            // swap, redeem &amp; retire environmental assets
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] text-[#475569] font-mono hidden sm:inline">Market v1.0</span>
        </div>
      </div>

      {/* Balance bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {ASSET_SYMBOLS.map((sym) => (
          <div
            key={sym}
            className="bg-[#111820] border border-[#1C2432] rounded-lg p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AssetIcon symbol={sym} size={12} />
              <span className="text-[10px] font-mono text-[#64748B] uppercase">{sym}</span>
            </div>
            <div className="text-sm font-mono text-white tabular-nums">
              {(userBalances[sym] ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Market card */}
      <div className="max-w-lg mx-auto">
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg">
          {/* Tab bar */}
          <div className="flex border-b border-[#1C2432]">
            {TABS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === label
                    ? 'text-white border-b-2 border-[#25D695]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="p-5">
            {activeTab === 'Swap' && <SwapView />}
            {activeTab === 'Redeem' && <RedeemView />}
            {activeTab === 'Retire' && <RetireView />}
          </div>
        </div>
      </div>
    </div>
  );
}
