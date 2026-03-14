/**
 * ScoreRing — Apple Health-style circular progress indicator.
 * Used for Water Score, Energy Score, and Nexus Impact Score.
 * Fully responsive — uses CSS scaling on mobile.
 */

interface ScoreRingProps {
  /** Score value 0–100 */
  score: number;
  /** Ring label */
  label: string;
  /** Ring color */
  color: string;
  /** Size in px (rendered at this size, scaled via CSS) */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show label below? */
  showLabel?: boolean;
  /** Optional subtitle (e.g. "↑ 3 pts this week") */
  subtitle?: string;
  /** Subtitle color */
  subtitleColor?: string;
}

export function ScoreRing({
  score,
  label,
  color,
  size = 140,
  strokeWidth = 10,
  showLabel = true,
  subtitle,
  subtitleColor,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  // Dynamic font size based on ring size
  const fontSize = size >= 150 ? 'text-4xl' : size >= 120 ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/[0.06]"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`${fontSize} font-bold tabular-nums`}
            style={{ color }}
          >
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          <div className="text-xs sm:text-sm font-medium text-white/90">{label}</div>
          {subtitle && (
            <div
              className="text-[10px] sm:text-xs mt-0.5"
              style={{ color: subtitleColor || color }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * TripleScoreRings — Water + Energy + Impact Score displayed together.
 * Responsive: scales ring sizes on mobile to prevent overflow.
 */
interface TripleScoreRingsProps {
  waterScore: number;
  energyScore: number;
  impactScore: number;
  waterDelta?: string;
  energyDelta?: string;
  impactDelta?: string;
  /** Desktop size — mobile auto-scales to ~70% */
  size?: number;
}

export function TripleScoreRings({
  waterScore,
  energyScore,
  impactScore,
  waterDelta,
  energyDelta,
  impactDelta,
  size = 130,
}: TripleScoreRingsProps) {
  // Scale rings down on mobile via a wrapper with CSS transform
  // This is cleaner than passing two different sizes around
  const mobileSize = Math.round(size * 0.62);
  const mobileCenterSize = Math.round((size + 20) * 0.62);

  return (
    <>
      {/* Desktop: normal sizes */}
      <div className="hidden sm:flex items-center justify-center gap-10 py-4">
        <ScoreRing
          score={waterScore}
          label="Water Score"
          color="#00b8f0"
          size={size}
          subtitle={waterDelta}
        />
        <ScoreRing
          score={impactScore}
          label="Impact Score"
          color="#25D695"
          size={size + 20}
          strokeWidth={12}
          subtitle={impactDelta}
        />
        <ScoreRing
          score={energyScore}
          label="Energy Score"
          color="#f99d07"
          size={size}
          subtitle={energyDelta}
        />
      </div>
      {/* Mobile: smaller sizes */}
      <div className="flex sm:hidden items-center justify-center gap-3 py-3">
        <ScoreRing
          score={waterScore}
          label="Water"
          color="#00b8f0"
          size={mobileSize}
          strokeWidth={7}
          subtitle={waterDelta}
        />
        <ScoreRing
          score={impactScore}
          label="Impact"
          color="#25D695"
          size={mobileCenterSize}
          strokeWidth={9}
          subtitle={impactDelta}
        />
        <ScoreRing
          score={energyScore}
          label="Energy"
          color="#f99d07"
          size={mobileSize}
          strokeWidth={7}
          subtitle={energyDelta}
        />
      </div>
    </>
  );
}
