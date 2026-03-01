type StatusColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'cyan' | 'orange';

const colorMap: Record<StatusColor, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  yellow: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  gray: 'bg-gray-500/10 text-gray-400 ring-gray-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
};

const statusColorMap: Record<string, StatusColor> = {
  approved: 'green',
  active: 'blue',
  executed: 'green',
  pending: 'yellow',
  in_review: 'yellow',
  queued: 'cyan',
  draft: 'gray',
  rejected: 'red',
  defeated: 'red',
  expired: 'gray',
  suspended: 'red',
  sold: 'green',
  cancelled: 'gray',
};

interface StatusBadgeProps {
  status: string;
  color?: StatusColor;
}

export function StatusBadge({ status, color }: StatusBadgeProps) {
  const c = color ?? statusColorMap[status] ?? 'gray';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset ${colorMap[c]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
