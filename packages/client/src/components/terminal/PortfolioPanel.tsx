import { useState } from 'react';
import { TokenIcon } from '@/components/common';

/* ─── Mock Holdings Data ─── */
const HOLDINGS = [
  { token: 'NXS', name: 'Nexus', balance: 24750, value: 59895, change24h: 3.2, allocation: 42, chain: 'XRPL' as const },
  { token: 'WTR', name: 'Water Credit', balance: 3200, value: 2720, change24h: -1.5, allocation: 19, chain: 'XRPL' as const },
  { token: 'ENG', name: 'Energy Credit', balance: 1800, value: 2016, change24h: 0.8, allocation: 14, chain: 'XRPL' as const },
  { token: 'XRP', name: 'XRP', balance: 5000, value: 10900, change24h: 5.1, allocation: 8, chain: 'XRPL' as const },
  { token: 'USDC', name: 'USD Coin', balance: 12000, value: 12000, change24h: 0, allocation: 8, chain: 'BASE' as const },
  { token: 'RLUSD', name: 'Ripple USD', balance: 8500, value: 8500, change24h: 0, allocation: 6, chain: 'XRPL' as const },
  { token: 'ETH', name: 'Ethereum', balance: 1.2, value: 3840, change24h: 2.1, allocation: 3, chain: 'BASE' as const },
];

/* ─── Helpers ─── */
const CHAIN_COLORS: Record<string, { bg: string; text: string }> = {
  XRPL: { bg: 'bg-teal-500/10', text: 'text-teal-400' },
  BASE: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatBalance(n: number): string {
  if (n < 10) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function changeColor(val: number): string {
  if (val > 0) return 'text-[#25D695]';
  if (val < 0) return 'text-red-400';
  return 'text-[#475569]';
}

function changePrefix(val: number): string {
  if (val > 0) return '+';
  return '';
}

/* ─── Component ─── */
export default function PortfolioPanel() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const totalValue = HOLDINGS.reduce((sum, h) => sum + h.value, 0);

  return (
    <div className="bg-[#111820] border border-[#1C2432] rounded-xl overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 flex items-baseline justify-between">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#64748B]"
          style={{ letterSpacing: '0.08em' }}
        >
          Portfolio
        </span>
        <span className="text-2xl font-semibold text-white tabular-nums tracking-tight">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Column Headers */}
          <thead>
            <tr className="border-b border-[#1C2432]">
              {['Token', 'Balance', 'Value', '24h %', 'Allocation', 'Chain'].map((col) => (
                <th
                  key={col}
                  className={`px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#475569] whitespace-nowrap ${
                    col === 'Token' ? 'text-left' : 'text-right'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {HOLDINGS.map((h, i) => {
              const chain = CHAIN_COLORS[h.chain] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400' };

              return (
                <tr
                  key={h.token}
                  className={`border-b border-[#1C2432]/50 transition-colors duration-100 ${
                    hoveredRow === i ? 'bg-[#161E2A]' : ''
                  }`}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Token */}
                  <td className="px-5 py-3 text-left whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <TokenIcon symbol={h.token} size={18} />
                      <span className="font-semibold text-white">{h.token}</span>
                      <span className="text-xs text-[#64748B]">{h.name}</span>
                    </span>
                  </td>

                  {/* Balance */}
                  <td className="px-5 py-3 text-right whitespace-nowrap tabular-nums text-white">
                    {formatBalance(h.balance)}
                  </td>

                  {/* Value */}
                  <td className="px-5 py-3 text-right whitespace-nowrap tabular-nums text-[#CBD5E1]">
                    {formatCurrency(h.value)}
                  </td>

                  {/* 24h Change */}
                  <td className={`px-5 py-3 text-right whitespace-nowrap tabular-nums font-medium ${changeColor(h.change24h)}`}>
                    {changePrefix(h.change24h)}{h.change24h.toFixed(1)}%
                  </td>

                  {/* Allocation Bar */}
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-xs tabular-nums text-[#64748B]">{h.allocation}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-[#1C2432] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#25D695]"
                          style={{ width: `${h.allocation}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Chain Badge */}
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${chain.bg} ${chain.text}`}
                    >
                      {h.chain}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Total Row ── */}
          <tfoot>
            <tr className="border-t border-[#1C2432]">
              <td className="px-5 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#475569]">Total</span>
              </td>
              <td />
              <td className="px-5 py-3 text-right tabular-nums font-semibold text-white">
                {formatCurrency(totalValue)}
              </td>
              <td />
              <td className="px-5 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs tabular-nums text-[#64748B]">100%</span>
                  <div className="w-16 h-1.5 rounded-full bg-[#25D695]" />
                </div>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
