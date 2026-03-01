import React, { useState, useMemo, useRef, useEffect } from 'react';

// ──────────────────────────────────────────────
// Token registry (mock)
// ──────────────────────────────────────────────
interface Token {
  symbol: string;
  name: string;
  price: number;
  balance: number;
  icon: string;
}

const TOKENS: Token[] = [
  { symbol: 'NXS',   name: 'Nexus',        price: 2.42, balance: 24750, icon: '⬡'  },
  { symbol: 'WTR',   name: 'Water Credit',  price: 0.85, balance: 3200,  icon: '💧' },
  { symbol: 'ENG',   name: 'Energy Credit', price: 1.12, balance: 1800,  icon: '⚡' },
  { symbol: 'XRP',   name: 'XRP',           price: 2.18, balance: 5000,  icon: '✕'  },
  { symbol: 'RLUSD', name: 'Ripple USD',    price: 1.00, balance: 8500,  icon: '$'  },
  { symbol: 'USDC',  name: 'USD Coin',      price: 1.00, balance: 12000, icon: '$'  },
];

const findToken = (symbol: string): Token =>
  TOKENS.find((t) => t.symbol === symbol) ?? TOKENS[0];

const fmt = (n: number, decimals = 2): string =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const fmtUsd = (n: number): string => `$${fmt(n)}`;

// ──────────────────────────────────────────────
// Dropdown – token selector
// ──────────────────────────────────────────────
interface TokenDropdownProps {
  selected: string;
  onSelect: (symbol: string) => void;
  excludeSymbol?: string;
}

const TokenDropdown: React.FC<TokenDropdownProps> = ({
  selected,
  onSelect,
  excludeSymbol,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const token = findToken(selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#1C2432] hover:bg-[#25384F] border border-[#25384F] rounded-lg px-3 py-2 transition-colors"
      >
        <span className="text-base leading-none">{token.icon}</span>
        <span className="text-white font-semibold text-sm">{token.symbol}</span>
        <svg
          className={`w-3 h-3 text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-[#111820] border border-[#1C2432] rounded-lg shadow-xl overflow-hidden">
          {TOKENS.filter((t) => t.symbol !== excludeSymbol).map((t) => (
            <button
              key={t.symbol}
              type="button"
              onClick={() => {
                onSelect(t.symbol);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#1C2432] transition-colors ${
                t.symbol === selected ? 'bg-[#1C2432]/60' : ''
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <div className="flex flex-col">
                <span className="text-white text-sm font-semibold">{t.symbol}</span>
                <span className="text-[#64748B] text-[11px]">{t.name}</span>
              </div>
              <span className="ml-auto text-[#64748B] text-xs">{fmt(t.balance, 0)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Main swap panel
// ──────────────────────────────────────────────
const ProSwapPanel: React.FC = () => {
  // ---- state ------------------------------------------------
  const [fromToken, setFromToken]         = useState('NXS');
  const [toToken, setToToken]             = useState('USDC');
  const [fromAmount, setFromAmount]       = useState('');
  const [slippage, setSlippage]           = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [executionType, setExecutionType] = useState<'market' | 'limit'>('market');
  const [showSettings, setShowSettings]   = useState(false);

  const from = findToken(fromToken);
  const to   = findToken(toToken);

  // ---- derived amounts --------------------------------------
  const parsedFrom = parseFloat(fromAmount) || 0;

  const exchangeRate = useMemo(() => {
    if (to.price === 0) return 0;
    return from.price / to.price;
  }, [from.price, to.price]);

  const toAmount = useMemo(() => {
    if (parsedFrom === 0) return '';
    return (parsedFrom * exchangeRate).toFixed(6).replace(/\.?0+$/, '');
  }, [parsedFrom, exchangeRate]);

  const toAmountNum   = parseFloat(toAmount) || 0;
  const fromUsd       = parsedFrom * from.price;
  const toUsd         = toAmountNum * to.price;

  // Mock price impact: scales linearly with size (purely illustrative)
  const priceImpact = useMemo(() => {
    if (parsedFrom === 0) return 0;
    return Math.min(parsedFrom / from.balance * 2, 15);
  }, [parsedFrom, from.balance]);

  const minReceived = useMemo(() => {
    if (toAmountNum === 0) return 0;
    return toAmountNum * (1 - slippage / 100);
  }, [toAmountNum, slippage]);

  // ---- helpers ----------------------------------------------
  const impactColor =
    priceImpact < 1 ? 'text-[#25D695]' : priceImpact < 3 ? 'text-[#F59E0B]' : 'text-[#EF4444]';

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
  };

  const handleMax = () => {
    setFromAmount(from.balance.toString());
  };

  const handleSlippagePreset = (val: number) => {
    setSlippage(val);
    setCustomSlippage('');
  };

  const handleCustomSlippage = (val: string) => {
    setCustomSlippage(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0 && n <= 50) {
      setSlippage(n);
    }
  };

  const isValid = parsedFrom > 0 && parsedFrom <= from.balance;

  // ---- render -----------------------------------------------
  return (
    <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5 w-full max-w-[440px] select-none">
      {/* ──── Header ──── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-lg font-bold tracking-tight">Swap</h2>

        <div className="flex items-center gap-1 bg-[#0D1117] border border-[#1C2432] rounded-lg p-0.5">
          {(['market', 'limit'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setExecutionType(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                executionType === type
                  ? 'bg-[#1C2432] text-white'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ──── From input ──── */}
      <div className="bg-[#0D1117] border border-[#1C2432] rounded-lg p-4 focus-within:border-[#25D695]/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">
            From
          </span>
          <span className="text-[11px] text-[#64748B]">
            Balance:{' '}
            <span className="text-[#94A3B8]">{fmt(from.balance, 2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TokenDropdown
            selected={fromToken}
            onSelect={setFromToken}
            excludeSymbol={toToken}
          />

          <div className="flex-1 flex flex-col items-end">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (/^[0-9]*\.?[0-9]*$/.test(v)) setFromAmount(v);
              }}
              className="w-full bg-transparent text-right text-2xl font-bold text-white placeholder-[#2A3544] outline-none"
            />
            {parsedFrom > 0 && (
              <span className="text-[11px] text-[#64748B] mt-1">{fmtUsd(fromUsd)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleMax}
            className="text-[10px] font-bold text-[#25D695] bg-[#25D695]/10 hover:bg-[#25D695]/20 rounded px-2 py-0.5 transition-colors uppercase tracking-wider"
          >
            Max
          </button>
        </div>
      </div>

      {/* ──── Direction arrow ──── */}
      <div className="flex justify-center -my-2.5 relative z-10">
        <button
          type="button"
          onClick={handleFlip}
          className="bg-[#1C2432] border border-[#25384F] rounded-lg p-2 hover:bg-[#25384F] transition-colors group"
          title="Switch tokens"
        >
          <svg
            className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* ──── To input ──── */}
      <div className="bg-[#0D1117] border border-[#1C2432] rounded-lg p-4 focus-within:border-[#25D695]/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">
            To (estimated)
          </span>
          <span className="text-[11px] text-[#64748B]">
            Balance:{' '}
            <span className="text-[#94A3B8]">{fmt(to.balance, 2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TokenDropdown
            selected={toToken}
            onSelect={setToToken}
            excludeSymbol={fromToken}
          />

          <div className="flex-1 flex flex-col items-end">
            <span
              className={`w-full text-right text-2xl font-bold ${
                toAmount ? 'text-white' : 'text-[#2A3544]'
              }`}
            >
              {toAmount || '0.00'}
            </span>
            {toAmountNum > 0 && (
              <span className="text-[11px] text-[#64748B] mt-1">{fmtUsd(toUsd)}</span>
            )}
          </div>
        </div>
      </div>

      {/* ──── Route preview ──── */}
      {parsedFrom > 0 && (
        <div className="mt-3 bg-[#0D1117]/60 border border-[#1C2432] rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
            <svg className="w-3.5 h-3.5 text-[#25D695] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span>
              {from.symbol}{' '}
              <span className="text-[#25384F] mx-0.5">&rarr;</span>{' '}
              {to.symbol}{' '}
              <span className="text-[#25384F]">via</span>{' '}
              <span className="text-[#94A3B8]">XRPL DEX</span>
            </span>
            <span className="ml-auto text-[#94A3B8]">
              ~{fmt(toAmountNum)} {to.symbol}
            </span>
          </div>
        </div>
      )}

      {/* ──── Price info row ──── */}
      {parsedFrom > 0 && (
        <div className="mt-3 space-y-2 px-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Rate</span>
            <span className="text-[#94A3B8]">
              1 {from.symbol} = {fmt(exchangeRate, 6)} {to.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Price Impact</span>
            <span className={impactColor}>{priceImpact.toFixed(2)}%</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Min. Received</span>
            <span className="text-[#94A3B8]">
              {fmt(minReceived, 4)} {to.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748B]">Slippage Tolerance</span>
            <span className="text-[#94A3B8]">{slippage}%</span>
          </div>
        </div>
      )}

      {/* ──── Slippage settings (collapsible) ──── */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">Slippage Settings</span>
          <svg
            className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showSettings && (
          <div className="mt-3 flex items-center gap-2">
            {[0.1, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSlippagePreset(val)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  slippage === val && customSlippage === ''
                    ? 'bg-[#25D695]/10 border-[#25D695]/40 text-[#25D695]'
                    : 'bg-[#0D1117] border-[#1C2432] text-[#64748B] hover:border-[#25384F] hover:text-white'
                }`}
              >
                {val}%
              </button>
            ))}

            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                customSlippage !== ''
                  ? 'bg-[#25D695]/10 border-[#25D695]/40'
                  : 'bg-[#0D1117] border-[#1C2432]'
              }`}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^[0-9]*\.?[0-9]*$/.test(v)) handleCustomSlippage(v);
                }}
                className="w-14 bg-transparent text-white font-semibold placeholder-[#64748B] outline-none text-xs"
              />
              <span className="text-[#64748B]">%</span>
            </div>
          </div>
        )}
      </div>

      {/* ──── Swap button ──── */}
      <button
        type="button"
        disabled={!isValid}
        className={`mt-5 w-full rounded-xl py-3 font-semibold text-sm transition-all ${
          isValid
            ? 'bg-[#25D695] text-[#0B0F14] hover:brightness-110 active:scale-[0.98]'
            : 'bg-[#1C2432] text-[#64748B] cursor-not-allowed'
        }`}
      >
        {parsedFrom === 0
          ? 'Enter an amount'
          : parsedFrom > from.balance
          ? 'Insufficient balance'
          : 'Review Swap'}
      </button>

      {/* ──── Footer note ──── */}
      <p className="text-center text-[10px] text-[#64748B]/60 mt-3">
        Trades are routed through XRPL DEX for best execution
      </p>
    </div>
  );
};

export default ProSwapPanel;
