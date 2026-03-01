import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar, StatusBadge } from '@/components/common';
import { TerminalCard, ActivityFeed, PriceChart, PortfolioPanel } from '@/components/terminal';
import { useWallet, useLivePrices } from '@/hooks';
import {
  useNexusKPIs,
  useNexusUser,
  useNexusProposals,
} from '@/mock/useNexusStore';
import { Vote, ArrowRight, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { TokenIcon } from '@/components/common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sum a specific token across all chains in the user's balances. */
function sumTokenAcrossChains(
  chainBalances: { chain: string; balances: Record<string, number> }[],
  token: string,
): number {
  return chainBalances.reduce((total, cb) => total + (cb.balances[token] ?? 0), 0);
}

/** Format large USD values as $XX.XM or $X.XXB */
function fmtUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Home() {
  const { session } = useWallet();
  const kpis = useNexusKPIs();
  const user = useNexusUser();
  const allProposals = useNexusProposals();
  const { prices: livePrices, loading: pricesLoading, getPrice } = useLivePrices();

  // Derived data
  const nxsBalance = useMemo(
    () => sumTokenAcrossChains(user.chainBalances, 'NXS'),
    [user.chainBalances],
  );

  const activeProposals = useMemo(
    () => allProposals.filter(p => p.status === 'ACTIVE'),
    [allProposals],
  );

  const wtrActive = kpis.totalMintedWTR - kpis.totalRetiredWTR;
  const engActive = kpis.totalMintedENG - kpis.totalRetiredENG;

  const nxsPrice = getPrice('NXS');
  const xrpPrice = getPrice('XRP');
  const rlusdPrice = getPrice('RLUSD');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Terminal</h1>
          <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">
            // protocol &gt; dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          <span className="text-[10px] text-[#475569] font-mono">XRPL Testnet</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger-children">
        <TerminalCard glow statusDot="active">
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">NXS</span>
            <TokenIcon symbol="NXS" size={18} />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {nxsBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Governance Token</div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">WTR</span>
            <TokenIcon symbol="WTR" size={18} />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {kpis.totalMintedWTR.toLocaleString()}
          </div>
          <div className="text-[11px] text-water-400 mt-0.5">
            Active: {wtrActive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">ENG</span>
            <TokenIcon symbol="ENG" size={18} />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {kpis.totalMintedENG.toLocaleString()}
          </div>
          <div className="text-[11px] text-energy-400 mt-0.5">
            Active: {engActive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </TerminalCard>

        <TerminalCard glow>
          <div className="flex items-center justify-between mb-2">
            <span className="terminal-label">TVL</span>
            <DollarSign size={14} className="text-[#25D695]" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {fmtUSD(kpis.tvlUSD)}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Total Value Locked</div>
        </TerminalCard>
      </div>

      {/* Live Price Ticker Strip */}
      <div className="flex items-center gap-3 sm:gap-5 mb-4 px-1 overflow-x-auto scrollbar-hide">
        {pricesLoading && livePrices.length === 0 ? (
          <div className="flex items-center gap-2 text-[#475569] text-xs">
            <Loader2 size={12} className="animate-spin" /> Fetching live prices…
          </div>
        ) : (
          <>
            {/* NXS */}
            {nxsPrice && (
              <div className="flex items-center gap-2.5 shrink-0">
                <TokenIcon symbol="NXS" size={20} />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white">NXS</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    ${nxsPrice.usd < 0.01 ? nxsPrice.usd.toPrecision(4) : nxsPrice.usd.toFixed(2)}
                  </span>
                  {nxsPrice.change24h !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${nxsPrice.change24h >= 0 ? 'text-[#25D695]' : 'text-[#EF4444]'}`}>
                      {nxsPrice.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {nxsPrice.change24h >= 0 ? '+' : ''}{nxsPrice.change24h.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[9px] text-[#475569]">LIVE</span>
                </div>
              </div>
            )}
            <div className="w-px h-5 bg-[#1C2432] shrink-0" />
            {/* XRP */}
            {xrpPrice && (
              <div className="flex items-center gap-2.5 shrink-0">
                <TokenIcon symbol="XRP" size={20} />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white">XRP</span>
                  <span className="text-sm font-bold text-white tabular-nums">${xrpPrice.usd.toFixed(2)}</span>
                  <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${xrpPrice.change24h >= 0 ? 'text-[#25D695]' : 'text-[#EF4444]'}`}>
                    {xrpPrice.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {xrpPrice.change24h >= 0 ? '+' : ''}{xrpPrice.change24h.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-[#475569]">LIVE</span>
                </div>
              </div>
            )}
            <div className="w-px h-5 bg-[#1C2432] shrink-0" />
            {/* RLUSD */}
            {rlusdPrice && (
              <div className="flex items-center gap-2.5 shrink-0">
                <TokenIcon symbol="RLUSD" size={20} />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white">RLUSD</span>
                  <span className="text-sm font-bold text-white tabular-nums">${rlusdPrice.usd.toFixed(4)}</span>
                  {rlusdPrice.change24h !== 0 ? (
                    <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${rlusdPrice.change24h >= 0 ? 'text-[#25D695]' : 'text-[#EF4444]'}`}>
                      {rlusdPrice.change24h >= 0 ? '+' : ''}{rlusdPrice.change24h.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#475569] tabular-nums">peg</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main grid: Chart + Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <div className="lg:col-span-3">
          <PriceChart
            pair="NXS/USD"
            height={340}
            livePrice={nxsPrice?.usd}
            poolId="NXS.rNexusA23ZQdtejTCeHZZaiKoJRsrnXboq_XRP"
            network="xrpl"
          />
        </div>
        <div className="lg:col-span-2">
          <PortfolioPanel />
        </div>
      </div>

      {/* Bottom row: Proposals + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <TerminalCard title="Active Proposals" className="lg:col-span-2" padding="md">
          {activeProposals.length === 0 ? (
            <p className="text-sm text-[#475569]">No active proposals.</p>
          ) : (
            <div className="space-y-2.5">
              {activeProposals.map(p => {
                const totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
                const forPct = totalVotes > 0 ? p.votesFor / totalVotes : 0;
                return (
                  <Link
                    key={p.id}
                    to={`/governance/proposals/${p.id}`}
                    className="block p-3 interactive-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-white">{p.title}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <ProgressBar value={forPct} variant="nexus" showPercent />
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#475569]">
                      <span>{p.totalVoters} voters</span>
                      <span>{totalVotes.toLocaleString()} VP cast</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <Link
            to="/governance/proposals"
            className="flex items-center gap-1 text-xs text-[#25D695] hover:text-[#1FBF84] mt-3"
          >
            View all proposals <ArrowRight size={12} />
          </Link>
        </TerminalCard>

        <div className="lg:col-span-1">
          <ActivityFeed maxItems={12} />
        </div>
      </div>

      {/* Quick Actions */}
      <TerminalCard title="Quick Actions" padding="md">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/registry"
            className="px-4 py-2 text-xs font-medium bg-[#0D1117] text-[#94A3B8] rounded-lg border border-[#1C2432] hover:border-[#25D69530] hover:text-white transition-all btn-press"
          >
            View Batches
          </Link>
          <Link
            to="/swap"
            className="px-4 py-2 text-xs font-medium bg-[#0D1117] text-[#94A3B8] rounded-lg border border-[#1C2432] hover:border-[#25D69530] hover:text-white transition-all btn-press"
          >
            Trade
          </Link>
          <Link
            to="/governance"
            className="px-4 py-2 text-xs font-medium bg-[#0D1117] text-[#94A3B8] rounded-lg border border-[#1C2432] hover:border-[#25D69530] hover:text-white transition-all btn-press"
          >
            <Vote size={12} className="inline mr-1.5 -mt-0.5" />Vote
          </Link>
          {session?.wallet.eligibility.mint_enabled && (
            <Link
              to="/registry"
              className="px-4 py-2 text-xs font-medium bg-[#25D695]/10 text-[#25D695] rounded-lg border border-[#25D695]/20 hover:bg-[#25D695]/20 transition-all"
            >
              Mint Tokens
            </Link>
          )}
        </div>
      </TerminalCard>
    </div>
  );
}
