import React, { useEffect, useRef } from 'react';
import { useNexusEvents } from '@/mock/useNexusStore';
import type { AppEvent } from '@/mock/engines/eventBus';

interface ActivityFeedProps {
  maxItems?: number;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  MINT: '#2ccfff', SWAP: '#22D3EE', BRIDGE: '#4ADE80',
  VOTE: '#F5C542', PROPOSAL: '#F5C542', ALERT: '#EF4444',
  VERIFY: '#25D695', EXPORT: '#94A3B8', RETIRE: '#F59E0B',
  REDEEM: '#F59E0B', LOAN: '#22D3EE', EMERGENCY: '#EF4444',
  MAINTENANCE: '#94A3B8', READING: '#25D695', SKILL_RUN: '#25D695',
};

const SEVERITY_COLORS: Record<string, string> = {
  info: '#64748B', warning: '#F59E0B', error: '#EF4444', success: '#25D695',
};

function tc(type: string) { return TYPE_COLORS[type] ?? '#64748B'; }
function sc(sev: string) { return SEVERITY_COLORS[sev] ?? '#64748B'; }

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  maxItems = 20,
  className = '',
}) => {
  const allEvents = useNexusEvents();
  const scrollRef = useRef<HTMLDivElement>(null);
  const events: AppEvent[] = allEvents.slice(-maxItems);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div
      className={['rounded-lg', className].filter(Boolean).join(' ')}
      style={{ backgroundColor: '#0D1117', border: '1px solid #1C2432' }}
    >
      {/* Header */}
      <div className="px-4 py-2" style={{ borderBottom: '1px solid #1C2432' }}>
        <span
          className="uppercase select-none"
          style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#64748B' }}
        >
          Activity Feed
        </span>
      </div>

      {/* Event list */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {events.length === 0 && (
          <div className="px-3 py-4 text-center font-mono" style={{ fontSize: '11px', color: '#64748B' }}>
            No activity recorded.
          </div>
        )}

        {events.map((event) => {
          const color = tc(event.type);
          const sevColor = sc(event.severity);
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 px-3 py-2 font-mono"
              style={{ fontSize: '11px', borderBottom: '1px solid rgba(28, 36, 50, 0.5)' }}
            >
              <span className="flex-shrink-0" style={{ color: '#64748B', minWidth: '60px' }}>
                {formatTime(event.timeISO)}
              </span>

              <span
                className="flex-shrink-0 uppercase rounded px-1.5 py-0.5"
                style={{
                  fontSize: '9px', letterSpacing: '0.08em', color,
                  backgroundColor: `${color}15`, border: `1px solid ${color}30`,
                  minWidth: '68px', textAlign: 'center',
                }}
              >
                {event.type}
              </span>

              <span className="flex-1" style={{ color: '#CBD5E1' }}>
                {event.message}
              </span>

              <span
                className="flex-shrink-0 inline-block w-[6px] h-[6px] rounded-full mt-[3px]"
                style={{ backgroundColor: sevColor, boxShadow: `0 0 4px ${sevColor}` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
