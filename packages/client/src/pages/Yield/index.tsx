import { useState, useMemo } from 'react';
import {
  useNexusPools,
  useNexusLoans,
  useNexusActions,
} from '@/mock/useNexusStore';
import type { LendingPool, LoanPosition } from '@/mock/types';
import type { Token } from '@/mock/seed';
import { TokenIcon } from '@/components/common';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function healthColor(hf: number): string {
  if (hf >= 2) return '#25D695';
  if (hf >= 1.2) return '#F5A623';
  return '#E5484D';
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return '<1h ago';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function UtilBar({ value }: { value: number }) {
  const w = Math.min(value * 100, 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#1C2432' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${w}%`, background: '#F5A623' }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Supply Modal                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function SupplyModal({
  pool,
  onClose,
}: {
  pool: LendingPool;
  onClose: () => void;
}) {
  const actions = useNexusActions();
  const [collateral, setCollateral] = useState('');
  const [borrow, setBorrow] = useState('');
  const [done, setDone] = useState(false);

  function submit() {
    const cAmt = Number(collateral);
    const bAmt = Number(borrow);
    if (!cAmt || cAmt <= 0 || !bAmt || bAmt <= 0) return;
    actions.createLoan(pool.token as Token, cAmt, pool.token as Token, bAmt);
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-xl"
        style={{ background: '#111820', border: '1px solid #1C2432' }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2" style={{ color: '#25D695' }}>Loan Created</div>
            <p className="text-sm" style={{ color: '#8B95A5' }}>
              Supplied {collateral} {pool.token} collateral, borrowed {borrow} {pool.token}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1C2432', color: '#C9D1D9' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-1">
              Supply to {pool.name}
            </h3>
            <p className="text-xs mb-5" style={{ color: '#8B95A5' }}>
              Supply APR: {pct(pool.supplyAPR)} &middot; Borrow APR: {pct(pool.borrowAPR)}
            </p>

            <label className="block text-xs mb-1" style={{ color: '#8B95A5' }}>
              Collateral Amount ({pool.token})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full mb-4 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
              style={{ background: '#0B0F14', border: '1px solid #1C2432' }}
            />

            <label className="block text-xs mb-1" style={{ color: '#8B95A5' }}>
              Borrow Amount ({pool.token})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={borrow}
              onChange={(e) => setBorrow(e.target.value)}
              className="w-full mb-5 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
              style={{ background: '#0B0F14', border: '1px solid #1C2432' }}
            />

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={!collateral || !borrow}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: '#25D695' }}
              >
                Confirm Supply
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: '#1C2432', color: '#C9D1D9' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Repay Modal                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function RepayModal({
  loan,
  pools,
  onClose,
}: {
  loan: LoanPosition;
  pools: LendingPool[];
  onClose: () => void;
}) {
  const actions = useNexusActions();
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState(false);
  const pool = pools.find((p) => p.id === loan.poolId);

  function submit() {
    const a = Number(amount);
    if (!a || a <= 0) return;
    actions.repayLoan(loan.id, a);
    setDone(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-xl"
        style={{ background: '#111820', border: '1px solid #1C2432' }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-2" style={{ color: '#25D695' }}>Repayment Submitted</div>
            <p className="text-sm" style={{ color: '#8B95A5' }}>
              Repaid {amount} {loan.token} on loan {loan.id.slice(0, 8)}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1C2432', color: '#C9D1D9' }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-1">
              Repay Loan &mdash; {pool?.name ?? loan.token}
            </h3>
            <p className="text-xs mb-4" style={{ color: '#8B95A5' }}>
              Borrowed: {fmt(loan.borrowedAmount)} {loan.token} &middot; Health: {loan.healthFactor.toFixed(2)}
            </p>

            <label className="block text-xs mb-1" style={{ color: '#8B95A5' }}>
              Repay Amount ({loan.token})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mb-5 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
              style={{ background: '#0B0F14', border: '1px solid #1C2432' }}
            />

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={!amount}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-40"
                style={{ background: '#25D695' }}
              >
                Confirm Repay
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: '#1C2432', color: '#C9D1D9' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export default function Yield() {
  const pools = useNexusPools();
  const loans = useNexusLoans();

  const [supplyPool, setSupplyPool] = useState<LendingPool | null>(null);
  const [repayLoan, setRepayLoan] = useState<LoanPosition | null>(null);

  /* ── Summary KPIs ── */
  const summary = useMemo(() => {
    const totalTVL = pools.reduce((s, p) => s + p.totalSupply, 0);
    const totalBorrowed = pools.reduce((s, p) => s + p.totalBorrowed, 0);
    const avgUtil =
      pools.length > 0
        ? pools.reduce((s, p) => s + p.utilization, 0) / pools.length
        : 0;
    return { totalTVL, totalBorrowed, avgUtil };
  }, [pools]);

  /* ── Pool lookup for loan table ── */
  const poolMap = useMemo(
    () => new Map(pools.map((p) => [p.id, p])),
    [pools],
  );

  return (
    <div className="min-h-screen px-4 py-6 md:px-8" style={{ background: '#0B0F14' }}>
      {/* ─── Header ─── */}
      <h1
        className="text-2xl font-bold tracking-tight mb-1"
        style={{ color: '#25D695' }}
      >
        Liquidity
      </h1>
      <p className="text-sm mb-8" style={{ color: '#8B95A5' }}>
        Supply collateral, borrow assets, and manage positions across NEXUS lending pools.
      </p>

      {/* ─── Summary Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total TVL', value: fmt(summary.totalTVL), accent: '#25D695' },
          { label: 'Avg Utilization', value: pct(summary.avgUtil), accent: '#F5A623' },
          { label: 'Total Borrowed', value: fmt(summary.totalBorrowed), accent: '#E5484D' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5"
            style={{ background: '#111820', border: '1px solid #1C2432' }}
          >
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8B95A5' }}>
              {s.label}
            </div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: s.accent }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Lending Pools ─── */}
      <h2 className="text-lg font-semibold text-white mb-4">Lending Pools</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="rounded-xl p-5 flex flex-col"
            style={{ background: '#111820', border: '1px solid #1C2432' }}
          >
            {/* Token / Name */}
            <div className="flex items-center gap-3 mb-4">
              <TokenIcon symbol={pool.token} size={36} />
              <div>
                <div className="text-sm font-semibold text-white">{pool.name}</div>
                <div className="text-xs" style={{ color: '#8B95A5' }}>
                  CF {(pool.collateralFactor * 100).toFixed(0)}% &middot; LT{' '}
                  {(pool.liquidationThreshold * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 text-xs">
              <div>
                <span style={{ color: '#8B95A5' }}>TVL</span>
                <div className="text-sm font-semibold text-white tabular-nums">
                  {fmt(pool.totalSupply)}
                </div>
              </div>
              <div>
                <span style={{ color: '#8B95A5' }}>Available</span>
                <div className="text-sm font-semibold text-white tabular-nums">
                  {fmt(pool.availableLiquidity)}
                </div>
              </div>
              <div>
                <span style={{ color: '#8B95A5' }}>Supply APR</span>
                <div className="text-sm font-semibold tabular-nums" style={{ color: '#25D695' }}>
                  {pct(pool.supplyAPR)}
                </div>
              </div>
              <div>
                <span style={{ color: '#8B95A5' }}>Borrow APR</span>
                <div className="text-sm font-semibold tabular-nums" style={{ color: '#F5A623' }}>
                  {pct(pool.borrowAPR)}
                </div>
              </div>
            </div>

            {/* Utilization bar */}
            <div className="mb-1 flex items-center justify-between text-xs" style={{ color: '#8B95A5' }}>
              <span>Utilization</span>
              <span className="tabular-nums">{pct(pool.utilization)}</span>
            </div>
            <UtilBar value={pool.utilization} />

            {/* Supply button */}
            <button
              onClick={() => setSupplyPool(pool)}
              className="mt-auto pt-4 w-full py-2 rounded-lg text-sm font-semibold text-black"
              style={{ background: '#25D695' }}
            >
              Supply
            </button>
          </div>
        ))}
      </div>

      {/* ─── Active Positions ─── */}
      <h2 className="text-lg font-semibold text-white mb-4">Active Positions</h2>

      {loans.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center text-sm"
          style={{ background: '#111820', border: '1px solid #1C2432', color: '#8B95A5' }}
        >
          No active loan positions. Supply collateral to a pool to get started.
        </div>
      ) : (
        <div
          className="rounded-xl overflow-x-auto mb-10"
          style={{ background: '#111820', border: '1px solid #1C2432' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2432' }}>
                {['Pool', 'Collateral', 'Borrowed', 'Health Factor', 'Interest Accrued', 'Opened', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
                      style={{ color: '#8B95A5' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const pool = poolMap.get(loan.poolId);
                return (
                  <tr
                    key={loan.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: '1px solid #1C2432' }}
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {pool?.name ?? loan.poolId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-white">
                      {fmt(loan.collateralAmount)}{' '}
                      <span style={{ color: '#8B95A5' }}>{loan.collateralToken}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-white">
                      {fmt(loan.borrowedAmount)}{' '}
                      <span style={{ color: '#8B95A5' }}>{loan.token}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: healthColor(loan.healthFactor) }}>
                      {loan.healthFactor.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: '#F5A623' }}>
                      {fmt(loan.interestAccrued)} {loan.token}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8B95A5' }}>
                      {timeSince(loan.openedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRepayLoan(loan)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold"
                        style={{ background: '#1C2432', color: '#25D695' }}
                      >
                        Repay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Modals ─── */}
      {supplyPool && (
        <SupplyModal pool={supplyPool} onClose={() => setSupplyPool(null)} />
      )}
      {repayLoan && (
        <RepayModal loan={repayLoan} pools={pools} onClose={() => setRepayLoan(null)} />
      )}
    </div>
  );
}
