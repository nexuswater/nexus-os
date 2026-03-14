/**
 * MetricCard — Large-number metric with label and optional delta.
 * Apple Health-inspired: clean, airy, number-forward.
 */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  /** The main value to display */
  value: string;
  /** Short label (e.g. "Gallons Saved") */
  label: string;
  /** Optional delta text (e.g. "+12% this month") */
  delta?: string;
  /** Positive / negative / neutral delta */
  deltaDirection?: 'up' | 'down' | 'neutral';
  /** Accent color */
  color?: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Compact variant */
  compact?: boolean;
}

export function MetricCard({
  value,
  label,
  delta,
  deltaDirection = 'neutral',
  color,
  icon,
  compact = false,
}: MetricCardProps) {
  const deltaColors = {
    up: 'text-[#25D695]',
    down: 'text-[#EF4444]',
    neutral: 'text-[#64748B]',
  };

  const DeltaIcon = deltaDirection === 'up' ? TrendingUp : deltaDirection === 'down' ? TrendingDown : Minus;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color || '#25D695'}15` }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-lg font-bold text-white tabular-nums leading-tight">{value}</div>
          <div className="text-xs text-[#64748B] truncate">{label}</div>
        </div>
        {delta && (
          <div className={`text-xs font-medium ml-auto shrink-0 flex items-center gap-0.5 ${deltaColors[deltaDirection]}`}>
            <DeltaIcon size={10} />
            {delta}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">{label}</span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color || '#25D695'}12` }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white tabular-nums leading-none mb-1" style={{ color: color || 'white' }}>
        {value}
      </div>
      {delta && (
        <div className={`text-xs font-medium flex items-center gap-1 mt-2 ${deltaColors[deltaDirection]}`}>
          <DeltaIcon size={11} />
          {delta}
        </div>
      )}
    </div>
  );
}
