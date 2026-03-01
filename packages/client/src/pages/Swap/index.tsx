import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  useNexusUser, useNexusOrderbooks, useNexusBridges, useNexusTrades, useNexusActions,
} from '@/mock/useNexusStore';
import type { Token, BridgeToken, Chain } from '@/mock/seed';
import type { SwapQuote } from '@/mock/engines/swapEngine';
import ChainSelector from '@/components/crosschain/ChainSelector';
import {
  ArrowLeftRight, ArrowDownUp, Globe2, Zap, Shield, Clock,
  CheckCircle2, Loader2, AlertCircle, ChevronDown,
} from 'lucide-react';
import { TokenIcon, useToast } from '@/components/common';

type TabKey = 'swap' | 'bridge' | 'cross-chain';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'swap', label: 'Swap' }, { key: 'bridge', label: 'Bridge' }, { key: 'cross-chain', label: 'Cross-Chain' },
];
const ALL_TOKENS: Token[] = ['NXS','WTR','ENG','XRP','RLUSD','USDC','ETH'];
const BRIDGEABLE: BridgeToken[] = ['NXS','WTR','ENG','USDC'];
const STATUS_CLR: Record<string, string> = {
  INITIATED:'#F5C542', CONFIRMING:'#2ccfff', RELAYING:'#A78BFA', COMPLETED:'#25D695', FAILED:'#EF4444',
};

function totalBal(user: ReturnType<typeof useNexusUser>, t: Token) {
  return user.chainBalances.reduce((s, cb) => s + (cb.balances[t] ?? 0), 0);
}
function chainBal(user: ReturnType<typeof useNexusUser>, c: Chain, t: Token) {
  return user.chainBalances.find(x => x.chain === c)?.balances[t] ?? 0;
}
const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  return ms < 3_600_000 ? `${Math.floor(ms / 60_000)}m ago` : `${Math.floor(ms / 3_600_000)}h ago`;
}

/* shared input classes */
const inputCls = 'w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-lg font-bold tabular-nums placeholder:text-[#334155] focus:outline-none focus:border-[#25D695]/50';

function TokenSelect({ value, onChange, tokens, label }: {
  value: string; onChange: (v: string) => void; tokens: readonly string[]; label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* auto-flip: if dropdown would overflow viewport bottom, open upward */
  const [dropUp, setDropUp] = useState(false);
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 200);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">{label}</span>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-sm cursor-pointer transition-colors hover:border-[#25D69530] focus:outline-none focus:border-[#25D695]/50"
      >
        <span className="inline-flex items-center gap-2 font-medium"><TokenIcon symbol={value} size={18} />{value}</span>
        <ChevronDown size={14} className={`text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          className={`absolute z-50 left-0 right-0 bg-[#111820] border border-[#1C2432] rounded-lg shadow-2xl shadow-black/60 py-1 max-h-56 overflow-y-auto ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {tokens.map(t => (
            <button
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium transition-colors ${
                t === value
                  ? 'bg-[#25D695]/10 text-[#25D695]'
                  : 'text-[#94A3B8] hover:bg-[#161E2A] hover:text-white'
              }`}
            >
              <TokenIcon symbol={t} size={18} />{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  const ok = type === 'ok';
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-[11px] ${ok ? 'bg-[#25D695]/10 border border-[#25D695]/20 text-[#25D695]' : 'bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]'}`}>
      {ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {text}
    </div>
  );
}

/* ═══════════════════ SWAP TAB ═══════════════════ */

function SwapTab() {
  const user = useNexusUser();
  const trades = useNexusTrades();
  const orderbooks = useNexusOrderbooks();
  const { swap, swapQuote } = useNexusActions();
  const { toast } = useToast();
  const [tokenIn, setTokenIn] = useState<Token>('XRP');
  const [tokenOut, setTokenOut] = useState<Token>('NXS');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = parseFloat(amount);
    if (!a || a <= 0 || tokenIn === tokenOut) { setQuote(null); return; }
    try { setQuote(swapQuote(tokenIn, tokenOut, a)); setError(null); } catch { setQuote(null); }
  }, [amount, tokenIn, tokenOut, swapQuote]);

  const bal = totalBal(user, tokenIn);
  const ob = orderbooks.find(o => o.pair === `${tokenIn}/${tokenOut}` || o.pair === `${tokenOut}/${tokenIn}`);
  const recentTrades = useMemo(() => [...trades].reverse().slice(0, 10), [trades]);

  const exec = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || !quote) return;
    if (a > bal) { setError('Insufficient balance'); return; }
    try {
      swap(tokenIn, tokenOut, a);
      setSuccess(`Swapped ${fmt(a)} ${tokenIn} → ${fmt(quote.amountOut)} ${tokenOut}`);
      toast(`Swapped ${fmt(a)} ${tokenIn} → ${fmt(quote.amountOut)} ${tokenOut}`, 'success');
      setAmount(''); setQuote(null); setError(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) { setError(e?.message ?? 'Swap failed'); toast(e?.message ?? 'Swap failed', 'error'); }
  }, [amount, quote, tokenIn, tokenOut, bal, swap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2">
        <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1C2432]/60">
            <ArrowDownUp size={16} className="text-[#25D695]" />
            <span className="text-sm font-semibold text-white">Swap</span>
            {ob && <span className="ml-auto text-[10px] text-[#64748B] tabular-nums">Mid: {fmt(ob.midPrice, 4)} · Spread: {ob.spreadPct.toFixed(2)}%</span>}
          </div>
          <TokenSelect value={tokenIn} onChange={v => setTokenIn(v as Token)} tokens={ALL_TOKENS} label="You Pay" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748B]">Balance: <span className="text-[#94A3B8] tabular-nums">{fmt(bal)} {tokenIn}</span></span>
            <button onClick={() => setAmount(String(bal))} className="text-[10px] text-[#25D695] font-medium hover:text-[#1FBF84]">MAX</button>
          </div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
          <div className="flex justify-center -my-1">
            <button onClick={() => { setTokenIn(tokenOut); setTokenOut(tokenIn); }} className="p-2 bg-[#1C2432] border border-[#25384F] rounded-lg hover:bg-[#25384F] transition-colors">
              <ArrowDownUp size={14} className="text-[#64748B]" />
            </button>
          </div>
          <TokenSelect value={tokenOut} onChange={v => setTokenOut(v as Token)} tokens={ALL_TOKENS.filter(t => t !== tokenIn)} label="You Receive" />
          <div className="px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg">
            <span className="text-lg font-bold tabular-nums text-white">{quote ? fmt(quote.amountOut, 4) : '0.00'}</span>
            <span className="ml-2 text-sm text-[#64748B]">{tokenOut}</span>
          </div>

          {quote && (
            <div className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]/40 space-y-2 text-[11px]">
              {[
                ['Rate', `1 ${tokenIn} = ${fmt(quote.midPrice, 6)} ${tokenOut}`],
                ['You Receive', `${fmt(quote.amountOut, 4)} ${tokenOut}`, true],
                ['Price Impact', `${quote.priceImpact.toFixed(3)}%`, false, quote.priceImpact > 1],
                ['Fee', `${fmt(quote.fee, 4)} ${tokenIn}`],
                ['Route', quote.route.join(' → '), false, false, true],
                ['Slippage', `${quote.slippage.toFixed(2)}%`],
              ].map(([lbl, val, bold, warn, cyan]) => (
                <div key={lbl as string} className="flex justify-between text-[#94A3B8]">
                  <span>{lbl}</span>
                  <span className={`tabular-nums ${bold ? 'text-white font-semibold' : warn ? 'text-[#EF4444]' : cyan ? 'text-[#2ccfff]' : ''}`}>{val}</span>
                </div>
              ))}
            </div>
          )}

          {error && <Msg type="err" text={error} />}
          {success && <Msg type="ok" text={success} />}

          <button onClick={exec} disabled={!quote || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 bg-[#25D695] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#1FBF84] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Execute Swap
          </button>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="lg:col-span-3">
        <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="text-[#64748B] text-left border-b border-[#1C2432]">
                {['Pair','Side','Price','Amount','Total','Time'].map((h,i) => (
                  <th key={h} className={`pb-2 font-medium ${i >= 2 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {recentTrades.length === 0
                  ? <tr><td colSpan={6} className="py-8 text-center text-[#475569]">No trades yet. Execute a swap above.</td></tr>
                  : recentTrades.map(t => (
                    <tr key={t.id} className="border-b border-[#1C2432]/40 hover:bg-[#1C2432]/20">
                      <td className="py-2 text-white font-medium">{t.pair}</td>
                      <td className={`py-2 font-semibold ${t.side === 'BUY' ? 'text-[#25D695]' : 'text-[#EF4444]'}`}>{t.side}</td>
                      <td className="py-2 text-right text-[#94A3B8] tabular-nums">{fmt(t.price, 4)}</td>
                      <td className="py-2 text-right text-[#94A3B8] tabular-nums">{fmt(t.amount)}</td>
                      <td className="py-2 text-right text-white tabular-nums">{fmt(t.total)}</td>
                      <td className="py-2 text-right text-[#64748B]">{ago(t.ts)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ BRIDGE TAB ═══════════════════ */

function BridgeTab() {
  const user = useNexusUser();
  const bridges = useNexusBridges();
  const { bridge } = useNexusActions();
  const [fromChain, setFromChain] = useState<string>('XRPL');
  const [toChain, setToChain] = useState<string>('BASE');
  const [token, setToken] = useState<BridgeToken>('NXS');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const srcBal = chainBal(user, fromChain as Chain, token);
  const feeRate = token === 'USDC' ? 0.001 : token === 'NXS' ? 0.002 : 0.0015;
  const amt = parseFloat(amount) || 0;

  const exec = useCallback(() => {
    if (amt <= 0) return;
    if (amt > srcBal) { setError('Insufficient balance on source chain'); return; }
    if (fromChain === toChain) { setError('Source and destination must differ'); return; }
    try {
      bridge(token, amt, fromChain as Chain, toChain as Chain);
      setSuccess(`Bridge initiated: ${fmt(amt)} ${token} ${fromChain} → ${toChain}`);
      setAmount(''); setError(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) { setError(e?.message ?? 'Bridge failed'); }
  }, [amt, srcBal, fromChain, toChain, token, bridge]);

  const sorted = useMemo(() => [...bridges].reverse().slice(0, 15), [bridges]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="max-w-md mx-auto lg:mx-0 w-full">
        <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1C2432]/60">
            <Globe2 size={16} className="text-[#F5C542]" />
            <span className="text-sm font-semibold text-white">Bridge Transfer</span>
            <span className="text-[10px] text-[#475569] ml-auto">Same token, different chain</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ChainSelector label="From" value={fromChain} onChange={setFromChain} />
            <ChainSelector label="To" value={toChain} onChange={setToChain} />
          </div>
          <div className="flex justify-center -my-1">
            <button onClick={() => { setFromChain(toChain); setToChain(fromChain); }}
              className="p-2 bg-[#1C2432] border border-[#25384F] rounded-lg hover:bg-[#25384F] transition-colors">
              <ArrowDownUp size={14} className="text-[#64748B]" />
            </button>
          </div>
          <TokenSelect value={token} onChange={v => setToken(v as BridgeToken)} tokens={BRIDGEABLE} label="Token" />
          <span className="text-[10px] text-[#475569]">Balance on {fromChain}: <span className="text-[#94A3B8] tabular-nums">{fmt(srcBal)} {token}</span></span>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em]">Amount</span>
              <button onClick={() => setAmount(String(srcBal))} className="text-[10px] text-[#25D695] font-medium hover:text-[#1FBF84]">MAX</button>
            </div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#64748B] p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432]/40">
            <span className="flex items-center gap-1"><Clock size={10} /> ~120s</span>
            <span className="flex items-center gap-1 text-[#25D695]"><Shield size={10} /> 92%</span>
            <span className="flex items-center gap-1"><Zap size={10} /> Fee: {amt > 0 ? fmt(amt * feeRate, 4) : `${(feeRate * 100).toFixed(1)}%`}</span>
          </div>
          {error && <Msg type="err" text={error} />}
          {success && <Msg type="ok" text={success} />}
          <button onClick={exec} disabled={amt <= 0}
            className="w-full py-3 bg-[#F5C542] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#E5B53A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Bridge {token}
          </button>
        </div>
      </div>

      {/* Active Bridges */}
      <div>
        <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Active Bridges</h3>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {sorted.length === 0
              ? <p className="text-[11px] text-[#475569] py-8 text-center">No bridge transfers yet.</p>
              : sorted.map(b => (
                <div key={b.id} className="p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white font-semibold tabular-nums">{fmt(b.amount)} {b.token}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: STATUS_CLR[b.status], backgroundColor: `${STATUS_CLR[b.status]}15`, border: `1px solid ${STATUS_CLR[b.status]}30` }}>
                      {b.status === 'CONFIRMING' || b.status === 'RELAYING'
                        ? <span className="inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> {b.status}</span>
                        : b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                    <span>{b.sourceChain}</span><span className="text-[#25D695]">→</span><span>{b.destChain}</span>
                    <span className="ml-auto tabular-nums">{b.confirmations}/{b.requiredConfirmations} conf</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#475569]">
                    <span>Fee: {fmt(b.fee, 4)} {b.feeToken}</span><span>{ago(b.initiatedAt)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ CROSS-CHAIN TAB ═══════════════════ */

function CrossChainTab() {
  const user = useNexusUser();
  const { swap, swapQuote, bridge } = useNexusActions();
  const [fromChain, setFromChain] = useState<string>('XRPL');
  const [toChain, setToChain] = useState<string>('BASE');
  const [fromToken, setFromToken] = useState<Token>('XRP');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const srcBal = chainBal(user, fromChain as Chain, fromToken);

  const exec = useCallback(() => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    if (a > srcBal) { setError('Insufficient balance on source chain'); return; }
    setBusy(true); setError(null); setResult(null);
    try {
      if (fromToken !== toToken && fromChain === toChain) {
        swap(fromToken, toToken, a, fromChain as Chain);
        setResult(`Swapped ${fmt(a)} ${fromToken} → ${toToken} on ${fromChain}`);
      } else if (fromChain !== toChain && fromToken === toToken && BRIDGEABLE.includes(fromToken as BridgeToken)) {
        bridge(fromToken as BridgeToken, a, fromChain as Chain, toChain as Chain);
        setResult(`Bridging ${fmt(a)} ${fromToken} ${fromChain} → ${toChain}`);
      } else if (fromChain !== toChain) {
        const mid: BridgeToken = 'NXS';
        if (fromToken !== mid) swap(fromToken, mid, a, fromChain as Chain);
        const q = swapQuote(fromToken, mid, a);
        const bridgeAmt = fromToken === mid ? a : q.amountOut;
        bridge(mid, bridgeAmt, fromChain as Chain, toChain as Chain);
        setResult(`Cross-chain: ${fmt(a)} ${fromToken} → ${fmt(bridgeAmt)} NXS bridged ${fromChain} → ${toChain}`);
      }
      setAmount('');
      setTimeout(() => setResult(null), 5000);
    } catch (e: any) { setError(e?.message ?? 'Cross-chain execution failed'); }
    finally { setBusy(false); }
  }, [amount, srcBal, fromToken, toToken, fromChain, toChain, swap, swapQuote, bridge]);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[#111820] border border-[#1C2432] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1C2432]/60">
          <ArrowLeftRight size={16} className="text-[#2ccfff]" />
          <span className="text-sm font-semibold text-white">Cross-Chain Swap</span>
          <span className="text-[10px] text-[#475569] ml-auto">Any token → any chain</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChainSelector label="Source Chain" value={fromChain} onChange={setFromChain} />
          <ChainSelector label="Dest Chain" value={toChain} onChange={setToChain} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TokenSelect value={fromToken} onChange={v => setFromToken(v as Token)} tokens={ALL_TOKENS} label="From" />
          <TokenSelect value={toToken} onChange={v => setToToken(v as Token)} tokens={ALL_TOKENS} label="To" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em]">Amount</span>
            <span className="text-[10px] text-[#475569]">Bal: <span className="text-[#94A3B8] tabular-nums">{fmt(srcBal)}</span> {fromToken}</span>
          </div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div className="p-2.5 rounded-lg bg-[#0D1117] border border-[#1C2432]/40 space-y-1.5">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em]">Route Engine</span>
          <p className="text-[11px] text-[#475569]">Automatically finds optimal path: swap → bridge → swap. Routes through NXS as intermediary for cross-chain transfers.</p>
          <div className="flex items-center gap-3 text-[10px] text-[#64748B]">
            <span className="flex items-center gap-1"><Zap size={10} /> 1-3 steps</span>
            <span className="flex items-center gap-1"><Clock size={10} /> 10-180s</span>
            <span className="flex items-center gap-1"><Shield size={10} /> Retry logic</span>
          </div>
        </div>
        {error && <Msg type="err" text={error} />}
        {result && <Msg type="ok" text={result} />}
        <button onClick={exec} disabled={!amount || parseFloat(amount) <= 0 || busy}
          className="w-full py-3 bg-[#25D695] text-[#0B0F14] font-semibold rounded-xl hover:bg-[#1FBF84] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
          {busy ? <><Loader2 size={16} className="animate-spin" /> Executing...</> : 'Find Routes & Execute'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════ SWAP PAGE ═══════════════════ */

export default function SwapPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('swap');
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>Swap</h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">// protocol &gt; swap_engine</span>
        </div>
      </div>
      <div className="flex gap-0 border-b border-[#1C2432] mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-none px-4 sm:px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider font-mono rounded-t-md transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key ? 'bg-[#25D695]/10 text-[#25D695] border-b-2 border-[#25D695]' : 'text-[#64748B] border-b-2 border-transparent hover:text-[#94A3B8]'
            }`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === 'swap' && <SwapTab />}
      {activeTab === 'bridge' && <BridgeTab />}
      {activeTab === 'cross-chain' && <CrossChainTab />}
    </div>
  );
}
