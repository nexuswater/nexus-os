import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, Waves, Gauge, RotateCcw, ShieldCheck, Users,
  Droplets, Zap, Coins, Archive, MapPin, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react';
import { TerminalCard } from '@/components/terminal';
import {
  useNexusKPIs,
  useNexusBatches,
  useNexusReceipts,
  useNexusPools,
  useNexusProposals,
} from '@/mock/useNexusStore';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function pctString(n: number): string {
  return n.toFixed(1) + '%';
}

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */

export default function Impact() {
  const kpis = useNexusKPIs();
  const batches = useNexusBatches();
  const receipts = useNexusReceipts();
  const pools = useNexusPools();
  const proposals = useNexusProposals();

  /* ── Derived KPIs ────────────────────────────────────── */

  const liquidityDepth = useMemo(
    () => pools.reduce((sum, p) => sum + p.totalSupply, 0),
    [pools],
  );

  const redemptionRate = useMemo(() => {
    const totalMinted = kpis.totalMintedWTR + kpis.totalMintedENG;
    const totalRetired = kpis.totalRetiredWTR + kpis.totalRetiredENG;
    return totalMinted > 0 ? (totalRetired / totalMinted) * 100 : 0;
  }, [kpis]);

  const daoParticipation = useMemo(() => {
    const activeOrFinished = proposals.filter(
      p => p.status === 'ACTIVE' || p.status === 'PASSED' || p.status === 'FAILED' || p.status === 'EXECUTED',
    );
    if (activeOrFinished.length === 0) return 0;
    const avgRatio = activeOrFinished.reduce((sum, p) => {
      return sum + (p.quorum > 0 ? p.totalVoters / p.quorum : 0);
    }, 0) / activeOrFinished.length;
    return Math.min(avgRatio * 100, 100);
  }, [proposals]);

  /* ── Regional issuance from batches ────────────────── */

  const regionalData = useMemo(() => {
    const regionMap = new Map<string, { wtrMinted: number; engMinted: number; count: number }>();
    for (const b of batches) {
      const r = b.region || 'UNKNOWN';
      const existing = regionMap.get(r) ?? { wtrMinted: 0, engMinted: 0, count: 0 };
      existing.count += 1;
      if (b.ticker === 'WTR') existing.wtrMinted += b.amountMinted;
      else if (b.ticker === 'ENG') existing.engMinted += b.amountMinted;
      regionMap.set(r, existing);
    }
    return Array.from(regionMap.entries())
      .map(([region, data]) => ({ region, ...data }))
      .sort((a, b) => (b.wtrMinted + b.engMinted) - (a.wtrMinted + a.engMinted));
  }, [batches]);

  /* ── Token flow: minted vs retired ─────────────────── */

  const tokenFlow = useMemo(() => {
    const wtrMinted = kpis.totalMintedWTR;
    const engMinted = kpis.totalMintedENG;
    const wtrRetired = kpis.totalRetiredWTR;
    const engRetired = kpis.totalRetiredENG;
    return { wtrMinted, engMinted, wtrRetired, engRetired };
  }, [kpis]);

  /* ── Average verification from receipts ────────────── */
  const avgVerification = useMemo(() => {
    if (receipts.length === 0) return kpis.avgVerificationScore;
    return receipts.reduce((s, r) => s + r.verificationScore, 0) / receipts.length;
  }, [receipts, kpis.avgVerificationScore]);

  /* ── 6 KPI card definitions ────────────────────────── */

  const kpiCards = [
    {
      label: 'Total Value Locked',
      value: formatUSD(kpis.tvlUSD),
      icon: <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: 'text-[#25D695]',
    },
    {
      label: 'Liquidity Depth',
      value: formatUSD(liquidityDepth),
      icon: <Waves className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: 'text-blue-400',
    },
    {
      label: 'Mint Velocity',
      value: formatNumber(kpis.totalBatches),
      sub: 'batches',
      icon: <Gauge className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: 'text-[#25D695]',
    },
    {
      label: 'Redemption Rate',
      value: pctString(redemptionRate),
      icon: <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: redemptionRate > 20 ? 'text-amber-400' : 'text-[#25D695]',
    },
    {
      label: 'Oracle Trust Score',
      value: String(Math.round(avgVerification * 10) / 10),
      sub: '/100',
      icon: <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: avgVerification >= 90 ? 'text-[#25D695]' : 'text-amber-400',
    },
    {
      label: 'DAO Participation',
      value: pctString(daoParticipation),
      icon: <Users className="w-3.5 h-3.5" strokeWidth={1.5} />,
      accent: daoParticipation >= 60 ? 'text-[#25D695]' : 'text-amber-400',
    },
  ];

  /* ---- Main render ---- */
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Analytics</h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 mt-1 font-mono">
            {'// intelligence > analytics_engine'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D695]" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Live</span>
          </div>
          <Link
            to="/impact/dashboard"
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:text-[#25D695] transition-colors"
          >
            Full Dashboard
            <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  TOP KPI ROW                                                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {kpiCards.map(kpi => (
          <div
            key={kpi.label}
            className="bg-[#111820] border border-[#1C2432] rounded-md px-4 py-3.5"
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-gray-600">{kpi.icon}</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 leading-none">
                {kpi.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-xl font-semibold tabular-nums leading-none ${kpi.accent}`}>
                {kpi.value}
              </span>
            </div>
            {kpi.sub && (
              <span className="text-[9px] text-gray-600 mt-1 block">{kpi.sub}</span>
            )}
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  MIDDLE ROW: Token Flow + Regional Issuance                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* ---- Token Flow ---- */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-md">
          <div className="px-4 py-3 border-b border-[#1C2432] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                Token Flow &mdash; Minted vs Retired
              </span>
            </div>
            <span className="text-[9px] font-mono text-gray-600">cumulative</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {/* WTR Minted */}
              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets className="w-3 h-3 text-blue-400" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    WTR Minted
                  </span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-blue-400">
                  {formatNumber(tokenFlow.wtrMinted)}
                </span>
              </div>

              {/* WTR Retired */}
              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Archive className="w-3 h-3 text-blue-400/50" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    WTR Retired
                  </span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-blue-400/60">
                  {formatNumber(tokenFlow.wtrRetired)}
                </span>
              </div>

              {/* ENG Minted */}
              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    ENG Minted
                  </span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-amber-400">
                  {formatNumber(tokenFlow.engMinted)}
                </span>
              </div>

              {/* ENG Retired */}
              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Archive className="w-3 h-3 text-amber-400/50" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    ENG Retired
                  </span>
                </div>
                <span className="text-lg font-semibold tabular-nums text-amber-400/60">
                  {formatNumber(tokenFlow.engRetired)}
                </span>
              </div>
            </div>

            {/* Summary bar */}
            <div className="mt-3 pt-3 border-t border-[#1C2432] flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-600">
                {kpis.totalBatches} batches / {kpis.totalReceipts} receipts
              </span>
              <span className="text-[9px] font-mono text-gray-600">
                net active: {formatNumber((tokenFlow.wtrMinted - tokenFlow.wtrRetired) + (tokenFlow.engMinted - tokenFlow.engRetired))}
              </span>
            </div>
          </div>
        </div>

        {/* ---- Regional Issuance ---- */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-md">
          <div className="px-4 py-3 border-b border-[#1C2432] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                Regional Issuance
              </span>
            </div>
            <span className="text-[9px] font-mono text-gray-600">
              {regionalData.length} region{regionalData.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-0 px-4 py-2 border-b border-[#1C2432]">
              {['Region', 'Batches', 'WTR Minted', 'ENG Minted'].map(col => (
                <span
                  key={col}
                  className="text-[9px] uppercase tracking-[0.12em] text-gray-600 font-medium"
                >
                  {col}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {regionalData.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <span className="text-[10px] text-gray-600 font-mono">No batch data available</span>
              </div>
            ) : (
              regionalData.map((row, i) => (
                <div
                  key={row.region}
                  className={`grid grid-cols-4 gap-0 px-4 py-2.5 ${
                    i < regionalData.length - 1 ? 'border-b border-[#1C2432]/50' : ''
                  } hover:bg-[#1C2432]/20 transition-colors`}
                >
                  <span className="text-[11px] font-mono font-medium text-[#25D695]">
                    {row.region}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-gray-300">
                    {row.count}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-blue-400">
                    {formatNumber(row.wtrMinted)}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-amber-400">
                    {formatNumber(row.engMinted)}
                  </span>
                </div>
              ))
            )}

            {/* Table footer */}
            <div className="px-4 py-2 border-t border-[#1C2432] flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-600">
                {regionalData.length} active regions
              </span>
              <span className="text-[9px] font-mono text-gray-600">
                avg verification {Math.round(avgVerification * 10) / 10}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM ROW: Lending Pools + Receipts Summary                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ---- Lending Pools ---- */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-md">
          <div className="px-4 py-3 border-b border-[#1C2432] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                Lending Pool Depth
              </span>
            </div>
            <span className="text-[9px] font-mono text-gray-600">
              {pools.length} pool{pools.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-0 px-4 py-2 border-b border-[#1C2432]">
              {['Pool', 'Supply', 'Borrowed', 'Util %', 'APR'].map(col => (
                <span
                  key={col}
                  className="text-[9px] uppercase tracking-[0.12em] text-gray-600 font-medium"
                >
                  {col}
                </span>
              ))}
            </div>

            {pools.map((pool, i) => (
              <div
                key={pool.id}
                className={`grid grid-cols-5 gap-0 px-4 py-2.5 ${
                  i < pools.length - 1 ? 'border-b border-[#1C2432]/50' : ''
                } hover:bg-[#1C2432]/20 transition-colors`}
              >
                <span className="text-[11px] font-mono font-medium text-[#25D695]">
                  {pool.token}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-gray-300">
                  {formatNumber(pool.totalSupply)}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-gray-400">
                  {formatNumber(pool.totalBorrowed)}
                </span>
                <span className={`text-[11px] font-mono tabular-nums ${
                  pool.utilization > 0.8 ? 'text-red-400' : pool.utilization > 0.6 ? 'text-amber-400' : 'text-[#25D695]'
                }`}>
                  {(pool.utilization * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] font-mono tabular-nums text-gray-300">
                  {(pool.supplyAPR * 100).toFixed(2)}%
                </span>
              </div>
            ))}

            <div className="px-4 py-2 border-t border-[#1C2432] flex items-center justify-between">
              <span className="text-[9px] font-mono text-gray-600">
                total supply {formatUSD(liquidityDepth)}
              </span>
              <span className="text-[9px] font-mono text-gray-600">
                avg util {pools.length > 0 ? (pools.reduce((s, p) => s + p.utilization, 0) / pools.length * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

        {/* ---- Receipt Verification Summary ---- */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-md">
          <div className="px-4 py-3 border-b border-[#1C2432] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400">
                Verification Summary
              </span>
            </div>
            <span className="text-[9px] font-mono text-gray-600">
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 block mb-1.5">
                  Avg Score
                </span>
                <span className={`text-lg font-semibold tabular-nums ${
                  avgVerification >= 90 ? 'text-[#25D695]' : avgVerification >= 70 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {(Math.round(avgVerification * 10) / 10).toFixed(1)}
                </span>
                <span className="text-[9px] text-gray-600 ml-1">/100</span>
              </div>

              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 block mb-1.5">
                  High Risk
                </span>
                <span className="text-lg font-semibold tabular-nums text-red-400">
                  {receipts.filter(r => r.verificationScore < 70).length}
                </span>
                <span className="text-[9px] text-gray-600 ml-1">receipts</span>
              </div>

              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 block mb-1.5">
                  WTR Receipts
                </span>
                <span className="text-lg font-semibold tabular-nums text-blue-400">
                  {receipts.filter(r => r.ticker === 'WTR').length}
                </span>
              </div>

              <div className="bg-[#0B0F14] border border-[#1C2432] rounded px-3.5 py-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 block mb-1.5">
                  ENG Receipts
                </span>
                <span className="text-lg font-semibold tabular-nums text-amber-400">
                  {receipts.filter(r => r.ticker === 'ENG').length}
                </span>
              </div>
            </div>

            {/* Receipt distribution bar */}
            {receipts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#1C2432]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] uppercase tracking-[0.12em] text-gray-600">
                    Score Distribution
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-[#1C2432]">
                  <div
                    className="bg-[#25D695] transition-all"
                    style={{
                      width: `${(receipts.filter(r => r.verificationScore >= 90).length / receipts.length) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-400 transition-all"
                    style={{
                      width: `${(receipts.filter(r => r.verificationScore >= 70 && r.verificationScore < 90).length / receipts.length) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-400 transition-all"
                    style={{
                      width: `${(receipts.filter(r => r.verificationScore < 70).length / receipts.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-[9px] font-mono text-[#25D695]">
                    {receipts.filter(r => r.verificationScore >= 90).length} excellent
                  </span>
                  <span className="text-[9px] font-mono text-amber-400">
                    {receipts.filter(r => r.verificationScore >= 70 && r.verificationScore < 90).length} moderate
                  </span>
                  <span className="text-[9px] font-mono text-red-400">
                    {receipts.filter(r => r.verificationScore < 70).length} flagged
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Bottom timestamp bar ---- */}
      <div className="mt-4 flex items-center justify-between py-3 border-t border-[#1C2432]">
        <span className="text-[9px] font-mono text-gray-700">
          analytics_engine v2.1.0 // nexus protocol
        </span>
        <span className="text-[9px] font-mono text-gray-700">
          {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}
