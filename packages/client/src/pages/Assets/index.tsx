import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  useNexusBatches, useNexusReceipts, useNexusUser,
  useNexusKPIs, useNexusPrices, useNexusActions,
} from '@/mock/useNexusStore';
import { TerminalCard } from '@/components/terminal';
import { Droplets, Zap, DollarSign, TrendingUp, ChevronRight, ChevronDown, Leaf, Receipt, X } from 'lucide-react';
import { TokenIcon } from '@/components/common';
import type { MockBatch } from '@/mock/types';

/* ───────── helpers ───────── */
const fmt = (n: number, d = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtUSD = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Filter = 'ALL' | 'WTR' | 'ENG' | 'ACTIVE' | 'RETIRED';
const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' }, { key: 'WTR', label: 'WTR' }, { key: 'ENG', label: 'ENG' },
  { key: 'ACTIVE', label: 'Active' }, { key: 'RETIRED', label: 'Retired' },
];

const TOKEN_DISPLAY: Record<string, { label: string; color: string }> = {
  NXS: { label: '$NXS', color: '#25D695' }, WTR: { label: '$WTR', color: '#38BDF8' },
  ENG: { label: '$ENG', color: '#FACC15' }, XRP: { label: '$XRP', color: '#FFFFFF' },
  RLUSD: { label: '$RLUSD', color: '#34D399' }, USDC: { label: '$USDC', color: '#2775CA' },
  ETH: { label: '$ETH', color: '#627EEA' },
};

const ALL_TOKENS = ['NXS', 'XRP', 'RLUSD', 'WTR', 'ENG', 'ETH', 'USDC'] as const;

const CHAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  XRPL:     { label: 'XRPL',     color: '#FFFFFF', bg: 'rgba(255,255,255,0.06)' },
  BASE:     { label: 'Base',     color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  ARBITRUM: { label: 'Arbitrum', color: '#28A0F0', bg: 'rgba(40,160,240,0.08)' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'rgba(37,214,149,0.12)', text: '#25D695' },
  RETIRED: { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
  PENDING: { bg: 'rgba(250,204,21,0.12)', text: '#FACC15' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
};

/* ─── progress bar (inline) ─── */
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full mt-3" style={{ backgroundColor: '#1C2432' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

/* ──────── retire modal ──────── */
function RetireModal({ batch, onClose, onConfirm }: {
  batch: MockBatch; onClose: () => void; onConfirm: (n: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const max = batch.remainingValue;
  const valid = Number(amount) > 0 && Number(amount) <= max;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <TerminalCard title="Retire Credits" className="w-full max-w-md relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="space-y-4 mt-2">
          <div>
            <span className="terminal-label">Batch</span>
            <p className="text-sm text-white mt-1 font-mono">{batch.id}</p>
          </div>
          <div>
            <span className="terminal-label">Ticker</span>
            <p className="text-sm mt-1" style={{ color: batch.ticker === 'WTR' ? '#38BDF8' : '#FACC15' }}>
              {batch.ticker}
            </p>
          </div>
          <div>
            <span className="terminal-label">Amount to Retire (max {fmt(max)})</span>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min={1} max={max} value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="flex-1 bg-[#0B0F14] border border-[#1C2432] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:border-[#25D695] focus:outline-none transition-colors" />
              <button onClick={() => setAmount(String(max))}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#1C2432] text-[#25D695] hover:bg-[#25D695]/10 transition-colors">
                MAX
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-[#1C2432] text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              Cancel
            </button>
            <button disabled={!valid} onClick={() => valid && onConfirm(Number(amount))}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ backgroundColor: valid ? '#25D695' : '#25D69540', color: '#0B0F14' }}>
              Confirm Retire
            </button>
          </div>
        </div>
      </TerminalCard>
    </div>
  );
}

/* ════════════════ Assets page ════════════════ */
export default function Assets() {
  const batches = useNexusBatches();
  const receipts = useNexusReceipts();
  const user = useNexusUser();
  const kpis = useNexusKPIs();
  const prices = useNexusPrices();
  const actions = useNexusActions();

  const [filter, setFilter] = useState<Filter>('ALL');
  const [retireBatch, setRetireBatch] = useState<MockBatch | null>(null);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());

  const toggleToken = useCallback((tok: string) => {
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(tok)) next.delete(tok);
      else next.add(tok);
      return next;
    });
  }, []);

  /* price map */
  const priceMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of prices) m[p.token] = p.usd;
    return m;
  }, [prices]);

  /* KPI computations */
  const wtrB = useMemo(() => batches.filter((b) => b.ticker === 'WTR'), [batches]);
  const engB = useMemo(() => batches.filter((b) => b.ticker === 'ENG'), [batches]);
  const wtrMinted = useMemo(() => wtrB.reduce((s, b) => s + b.amountMinted, 0), [wtrB]);
  const engMinted = useMemo(() => engB.reduce((s, b) => s + b.amountMinted, 0), [engB]);
  const wtrRetired = useMemo(() => wtrB.reduce((s, b) => s + b.amountMinted * b.retiredFraction, 0), [wtrB]);
  const engRetired = useMemo(() => engB.reduce((s, b) => s + b.amountMinted * b.retiredFraction, 0), [engB]);
  const totalMinted = wtrMinted + engMinted;
  const totalRetired = wtrRetired + engRetired;
  const retirementPct = totalMinted > 0 ? (totalRetired / totalMinted) * 100 : 0;

  /* user balances across chains */
  const aggregated = useMemo(() => {
    const agg: Record<string, number> = {};
    for (const cb of user.chainBalances)
      for (const [tok, amt] of Object.entries(cb.balances)) agg[tok] = (agg[tok] ?? 0) + amt;
    return agg;
  }, [user]);

  /* receipt lookup */
  const receiptsByBatch = useMemo(() => {
    const m = new Set<string>();
    for (const r of receipts) m.add(r.batchId);
    return m;
  }, [receipts]);

  /* filtered batches */
  const filtered = useMemo(() => batches.filter((b) => {
    if (filter === 'WTR') return b.ticker === 'WTR';
    if (filter === 'ENG') return b.ticker === 'ENG';
    if (filter === 'ACTIVE') return b.status === 'ACTIVE';
    if (filter === 'RETIRED') return b.status === 'RETIRED';
    return true;
  }), [batches, filter]);

  /* actions */
  const handleRetire = useCallback((id: string, amt: number) => {
    actions.retire(id, amt);
    setRetireBatch(null);
  }, [actions]);

  const handleRedeem = useCallback((id: string) => actions.redeem(id), [actions]);

  /* ─────── render ─────── */
  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#64748B' }}>
        <Link to="/" className="hover:text-white transition-colors">Registry</Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: '#25D695' }}>Assets</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-6" style={{ color: '#FFF' }}>Assets</h1>

      {/* ═══ KPI cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TerminalCard title="Total WTR" glow>
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#38BDF8' }}>{fmt(wtrMinted)}</div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span style={{ color: '#38BDF8' }}>Active {fmt(wtrMinted - wtrRetired)}</span>
            <span style={{ color: '#64748B' }}>Retired {fmt(wtrRetired)}</span>
          </div>
          <Bar pct={wtrMinted > 0 ? (wtrRetired / wtrMinted) * 100 : 0} color="#38BDF8" />
        </TerminalCard>

        <TerminalCard title="Total ENG" glow>
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#FACC15' }}>{fmt(engMinted)}</div>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span style={{ color: '#FACC15' }}>Active {fmt(engMinted - engRetired)}</span>
            <span style={{ color: '#64748B' }}>Retired {fmt(engRetired)}</span>
          </div>
          <Bar pct={engMinted > 0 ? (engRetired / engMinted) * 100 : 0} color="#FACC15" />
        </TerminalCard>

        <TerminalCard title="Portfolio Value" glow>
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#25D695' }}>{fmtUSD(kpis.tvlUSD)}</div>
          <div className="text-xs mt-2" style={{ color: '#64748B' }}>Total Value Locked</div>
        </TerminalCard>

        <TerminalCard title="Retirement Progress" glow>
          <div className="text-2xl font-bold tabular-nums" style={{ color: '#25D695' }}>{retirementPct.toFixed(1)}%</div>
          <div className="text-xs mt-2" style={{ color: '#64748B' }}>
            {fmt(totalRetired)} / {fmt(totalMinted)} credits retired
          </div>
          <Bar pct={retirementPct} color="#25D695" />
        </TerminalCard>
      </div>

      {/* ═══ Cross-Chain Balances ═══ */}
      <TerminalCard title="Cross-Chain Balances" className="mb-6">
        <div className="space-y-1">
          {ALL_TOKENS.map((tok) => {
            const bal = aggregated[tok] ?? 0;
            if (bal <= 0) return null;
            const meta = TOKEN_DISPLAY[tok];
            const isStable = tok === 'RLUSD' || tok === 'USDC';
            const isEth = tok === 'ETH';
            const decimals = isStable ? 2 : isEth ? 4 : 0;
            const usdVal = bal * (priceMap[tok] ?? 0);
            const isOpen = expandedTokens.has(tok);

            // Per-chain breakdown for this token
            const chains = user.chainBalances
              .map((cb) => ({ chain: cb.chain, amount: cb.balances[tok] ?? 0 }))
              .filter((c) => c.amount > 0);

            return (
              <div key={tok}>
                {/* ── Token row (clickable) ── */}
                <button
                  onClick={() => toggleToken(tok)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-[#111820] group"
                  style={{ backgroundColor: isOpen ? '#0F1419' : 'transparent' }}
                >
                  {/* Expand chevron */}
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0"
                    style={{
                      color: '#475569',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />

                  {/* Token icon + label */}
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <TokenIcon symbol={tok} size={20} />
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Chain badges (compact) */}
                  <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0">
                    {chains.map((c) => {
                      const cm = CHAIN_META[c.chain] ?? { label: c.chain, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' };
                      return (
                        <span
                          key={c.chain}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide"
                          style={{ backgroundColor: cm.bg, color: cm.color, border: `1px solid ${cm.color}20` }}
                        >
                          {cm.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Total balance */}
                  <div className="text-right ml-auto">
                    <div className="text-sm font-bold tabular-nums text-white">
                      {fmt(bal, decimals)}
                    </div>
                    <div className="text-[11px] tabular-nums" style={{ color: '#64748B' }}>
                      {fmtUSD(usdVal)}
                    </div>
                  </div>
                </button>

                {/* ── Expanded: per-chain breakdown ── */}
                {isOpen && (
                  <div className="ml-3 sm:ml-9 mr-1 sm:mr-3 mb-2 mt-0.5 rounded-lg overflow-hidden" style={{ backgroundColor: '#0B0F14', border: '1px solid #1C2432' }}>
                    {chains.map((c, idx) => {
                      const cm = CHAIN_META[c.chain] ?? { label: c.chain, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' };
                      const chainUsd = c.amount * (priceMap[tok] ?? 0);
                      const pct = bal > 0 ? (c.amount / bal) * 100 : 0;
                      return (
                        <div
                          key={c.chain}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5"
                          style={{ borderTop: idx > 0 ? '1px solid #1C2432' : 'none' }}
                        >
                          {/* Chain indicator dot + name */}
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-[70px] sm:min-w-[100px]">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cm.color }} />
                            <span className="text-[11px] sm:text-xs font-medium" style={{ color: cm.color }}>
                              {cm.label}
                            </span>
                          </div>

                          {/* Distribution bar */}
                          <div className="flex-1 hidden sm:block">
                            <div className="h-1 rounded-full" style={{ backgroundColor: '#1C2432' }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: cm.color, opacity: 0.6 }}
                              />
                            </div>
                          </div>

                          {/* Percentage */}
                          <span className="text-[11px] tabular-nums w-8 sm:w-10 text-right ml-auto sm:ml-0" style={{ color: '#64748B' }}>
                            {pct.toFixed(0)}%
                          </span>

                          {/* Chain balance */}
                          <div className="text-right">
                            <div className="text-[11px] sm:text-xs font-semibold tabular-nums text-white">
                              {fmt(c.amount, decimals)}
                            </div>
                            <div className="text-[10px] tabular-nums" style={{ color: '#64748B' }}>
                              {fmtUSD(chainUsd)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </TerminalCard>

      {/* ═══ Filter Tabs ═══ */}
      <div className="flex items-center gap-2 mb-4">
        {FILTER_OPTIONS.map((o) => (
          <button key={o.key} onClick={() => setFilter(o.key)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: filter === o.key ? '#25D695' : '#111820',
              color: filter === o.key ? '#0B0F14' : '#64748B',
              border: `1px solid ${filter === o.key ? '#25D695' : '#1C2432'}`,
            }}>
            {o.label}
          </button>
        ))}
        <span className="ml-auto text-xs tabular-nums" style={{ color: '#64748B' }}>
          {filtered.length} batch{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* ═══ Batch Table ═══ */}
      <TerminalCard title="Credit Batches">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2432' }}>
                {['ID', 'Ticker', 'Region', 'Status', 'Minted', 'Remaining', 'Retirement', 'Actions'].map((h) => (
                  <th key={h} className="terminal-label text-left px-5 pb-3" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-sm" style={{ color: '#64748B' }}>
                  No batches match the current filter.
                </td></tr>
              )}
              {filtered.map((b) => {
                const pct = b.retiredFraction * 100;
                const ss = STATUS_STYLES[b.status] ?? STATUS_STYLES.ACTIVE;
                const tc = b.ticker === 'WTR' ? '#38BDF8' : '#FACC15';
                const hasReceipt = receiptsByBatch.has(b.id);
                return (
                  <tr key={b.id} className="group hover:bg-[#0B0F14] transition-colors"
                    style={{ borderBottom: '1px solid #1C2432' }}>
                    <td className="px-5 py-3 font-mono text-xs text-white">{b.id.slice(0, 12)}...</td>
                    <td className="px-5 py-3 font-semibold" style={{ color: tc }}>
                      <span className="inline-flex items-center gap-1">
                        <TokenIcon symbol={b.ticker} size={16} />
                        {b.ticker}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#94A3B8' }}>{b.region}</td>
                    <td className="px-5 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: ss.bg, color: ss.text }}>{b.status}</span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-white">{fmt(b.amountMinted)}</td>
                    <td className="px-5 py-3 tabular-nums" style={{ color: '#94A3B8' }}>{fmt(b.remainingValue)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#1C2432', minWidth: 60 }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#25D695' : tc }} />
                        </div>
                        <span className="text-[11px] tabular-nums w-10 text-right" style={{ color: '#64748B' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {b.status === 'ACTIVE' && (
                          <button onClick={() => setRetireBatch(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors hover:brightness-125"
                            style={{ backgroundColor: 'rgba(37,214,149,0.12)', color: '#25D695', border: '1px solid rgba(37,214,149,0.25)' }}>
                            <Leaf className="w-3 h-3" /> Retire
                          </button>
                        )}
                        {b.status === 'RETIRED' && (
                          <button onClick={() => handleRedeem(b.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors hover:brightness-125"
                            style={{ backgroundColor: 'rgba(148,163,184,0.12)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.25)' }}>
                            <DollarSign className="w-3 h-3" /> Redeem
                          </button>
                        )}
                        {hasReceipt && (
                          <Link to={`/vault?batch=${b.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors hover:brightness-125"
                            style={{ backgroundColor: 'rgba(37,214,149,0.08)', color: '#25D695', border: '1px solid rgba(37,214,149,0.15)' }}>
                            <Receipt className="w-3 h-3" /> Receipt
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TerminalCard>

      {/* retire modal */}
      {retireBatch && (
        <RetireModal batch={retireBatch} onClose={() => setRetireBatch(null)}
          onConfirm={(amt) => handleRetire(retireBatch.id, amt)} />
      )}
    </div>
  );
}
