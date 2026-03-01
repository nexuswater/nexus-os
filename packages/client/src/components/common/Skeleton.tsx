interface SkeletonProps {
  className?: string;
  /** Width — accepts Tailwind class like "w-24" or inline px */
  w?: string;
  /** Height — accepts Tailwind class like "h-4" */
  h?: string;
  /** Round — makes it a circle */
  round?: boolean;
}

/** Animated skeleton placeholder for loading states. */
export function Skeleton({ className = '', w, h, round }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse rounded-md bg-[#1C2432]
        ${round ? '!rounded-full' : ''}
        ${w ?? ''} ${h ?? ''}
        ${className}
      `.trim()}
    />
  );
}

/** Pre-built skeleton patterns for common layouts. */

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-xl bg-[#111820] border border-[#1C2432] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton w="w-20" h="h-3" />
        <Skeleton w="w-5" h="h-5" round />
      </div>
      <Skeleton w="w-32" h="h-7" />
      <Skeleton w="w-24" h="h-3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0D1117] border border-[#1C2432]/50">
      <Skeleton w="w-8" h="h-8" round />
      <div className="flex-1 space-y-1.5">
        <Skeleton w="w-36" h="h-3.5" />
        <Skeleton w="w-24" h="h-2.5" />
      </div>
      <Skeleton w="w-16" h="h-5" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="p-5 rounded-xl bg-[#111820] border border-[#1C2432] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton w="w-28" h="h-3" />
        <div className="flex gap-2">
          <Skeleton w="w-8" h="h-5" />
          <Skeleton w="w-8" h="h-5" />
          <Skeleton w="w-8" h="h-5" />
        </div>
      </div>
      <div className="flex items-end gap-1 h-40">
        {[65, 40, 72, 50, 85, 38, 60, 78, 45, 90, 55, 70, 42, 80, 48, 62, 75, 52, 68, 58].map((pct, i) => (
          <div key={i} className="flex-1 animate-pulse rounded-sm bg-[#1C2432]" style={{ height: `${pct}%` }} />
        ))}
      </div>
    </div>
  );
}
