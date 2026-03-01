/**
 * TimelineScrubber — Horizontal timeline slider at bottom of globe area.
 * Spans 30 days → now. Play/pause auto-advances via interval.
 * Glass styling with JetBrains Mono timestamp display.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, Clock } from 'lucide-react';
import { useMapStore } from '../store';
import { GLASS, HOLO } from '../hologramStyles';

// ─── Timeline Config ─────────────────────────────────────

const TIMELINE_DAYS = 30;
const PLAYBACK_SPEED = 0.003; // position increment per frame (~30s real = 1 day)

// ─── Helpers ─────────────────────────────────────────────

/** Convert 0-1 position to Date */
function positionToDate(pos: number): Date {
  const now = Date.now();
  const daysAgo = TIMELINE_DAYS * (1 - pos);
  return new Date(now - daysAgo * 86400000);
}

/** Format date for display */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format days ago label */
function daysAgoLabel(pos: number): string {
  const days = Math.round(TIMELINE_DAYS * (1 - pos));
  if (days === 0) return 'NOW';
  if (days === 1) return '1 DAY AGO';
  return `${days} DAYS AGO`;
}

// ─── Component ──────────────────────────────────────────

export default function TimelineScrubber() {
  const timelinePosition = useMapStore((s) => s.timelinePosition);
  const isPlaying = useMapStore((s) => s.isPlaying);
  const setTimelinePosition = useMapStore((s) => s.setTimelinePosition);
  const togglePlayback = useMapStore((s) => s.togglePlayback);

  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const isDragging = useRef(false);

  // Playback animation
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();

    function tick() {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const current = useMapStore.getState().timelinePosition;
      const next = current + PLAYBACK_SPEED * dt;

      if (next >= 1) {
        setTimelinePosition(1);
        togglePlayback(); // Stop at end
        return;
      }

      setTimelinePosition(next);
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, setTimelinePosition, togglePlayback]);

  // Mouse/touch drag handler
  const handleDrag = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const pos = (clientX - rect.left) / rect.width;
      setTimelinePosition(Math.max(0, Math.min(1, pos)));
    },
    [setTimelinePosition],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      handleDrag(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [handleDrag],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      handleDrag(e.clientX);
    },
    [handleDrag],
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const jumpToNow = useCallback(() => {
    setTimelinePosition(1);
    if (isPlaying) togglePlayback();
  }, [setTimelinePosition, isPlaying, togglePlayback]);

  const currentDate = positionToDate(timelinePosition);

  // Tick marks (every 5 days)
  const ticks = Array.from({ length: 7 }, (_, i) => i / 6);

  return (
    <div
      className="absolute bottom-2 left-3 right-3 z-20 rounded-lg px-3 py-2 hidden sm:block"
      style={{
        background: GLASS.bg,
        backdropFilter: GLASS.blur,
        WebkitBackdropFilter: GLASS.blur,
        border: `1px solid ${GLASS.border}`,
        boxShadow: GLASS.shadow,
      }}
    >
      {/* Top row: controls + timestamp */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={togglePlayback}
            className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-nexus-400/10"
            style={{ color: isPlaying ? HOLO.maintenance : HOLO.teal }}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>

          {/* Jump to Now */}
          <button
            onClick={jumpToNow}
            className="flex items-center gap-1 text-[8px] font-mono text-gray-600 hover:text-nexus-400 transition-colors uppercase tracking-wider"
          >
            <SkipForward size={8} />
            Now
          </button>
        </div>

        {/* Timestamp display */}
        <div className="flex items-center gap-2">
          <Clock size={8} className="text-nexus-400/40" />
          <span className="text-[9px] font-mono text-white/70 tabular-nums">
            {formatDate(currentDate)}
          </span>
          <span className="text-[9px] font-mono text-nexus-400/50 tabular-nums">
            {formatTime(currentDate)}
          </span>
          <span
            className="text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: timelinePosition >= 0.98 ? HOLO.teal : HOLO.planned,
              background: timelinePosition >= 0.98 ? 'rgba(37,214,149,0.08)' : 'rgba(91,141,239,0.08)',
              border: `1px solid ${timelinePosition >= 0.98 ? 'rgba(37,214,149,0.15)' : 'rgba(91,141,239,0.15)'}`,
            }}
          >
            {daysAgoLabel(timelinePosition)}
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-4 cursor-pointer select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded-full bg-gray-800/60" />

        {/* Filled track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full"
          style={{
            width: `${timelinePosition * 100}%`,
            background: `linear-gradient(90deg, ${HOLO.planned}44, ${HOLO.teal})`,
            boxShadow: `0 0 8px ${HOLO.teal}33`,
          }}
        />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-px h-2"
            style={{
              left: `${t * 100}%`,
              background: 'rgba(255,255,255,0.08)',
            }}
          />
        ))}

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform"
          style={{
            left: `${timelinePosition * 100}%`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2"
            style={{
              borderColor: HOLO.teal,
              background: HOLO.globeDark,
              boxShadow: `0 0 8px ${HOLO.teal}66, 0 0 16px ${HOLO.teal}22`,
            }}
          />
        </div>
      </div>

      {/* Bottom scale labels */}
      <div className="flex justify-between mt-0.5">
        <span className="text-[6px] font-mono text-white/15">-30d</span>
        <span className="text-[6px] font-mono text-white/15">-20d</span>
        <span className="text-[6px] font-mono text-white/15">-10d</span>
        <span className="text-[6px] font-mono text-white/15">NOW</span>
      </div>
    </div>
  );
}
