type ProgressVariant = 'nexus' | 'water' | 'energy' | 'green' | 'red' | 'gray';

const variantColors: Record<ProgressVariant, string> = {
  nexus: 'bg-nexus-500',
  water: 'bg-water-500',
  energy: 'bg-energy-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
};

interface ProgressBarProps {
  value: number; // 0-1
  variant?: ProgressVariant;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  variant = 'nexus',
  label,
  showPercent,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-gray-500">{label}</span>}
          {showPercent && <span className="text-xs text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantColors[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
