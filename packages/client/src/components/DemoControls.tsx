/**
 * DemoControls — floating panel for controlling mock data simulation.
 * Hidden behind a ⚙️ gear icon in the bottom-right corner.
 * Controls: event speed, auto-toggles, seed reset, event replay, role selector.
 */

import { useState, useCallback } from 'react';
import { useNexusDemoSpeed, useNexusEvents, useNexusStore, nexusActions } from '@/mock/useNexusStore';
import type { DemoSpeed } from '@/mock/engines/clock';

const SPEED_OPTIONS: { label: string; value: DemoSpeed; desc: string }[] = [
  { label: 'OFF', value: 'off', desc: 'No auto-events' },
  { label: 'LOW', value: 'low', desc: '1 event / 10s' },
  { label: 'MED', value: 'med', desc: '1 event / 4s' },
  { label: 'HIGH', value: 'high', desc: '1 event / 1.5s' },
];

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const [resetFlash, setResetFlash] = useState(false);
  const [replayFlash, setReplayFlash] = useState(false);

  const demoSpeed = useNexusDemoSpeed();
  const version = useNexusStore(s => s.version);
  const events = useNexusEvents();
  const eventsCount = events.length;

  const handleReset = useCallback(() => {
    nexusActions.resetSeed();
    setResetFlash(true);
    setTimeout(() => setResetFlash(false), 800);
  }, []);

  const handleReplay = useCallback(() => {
    nexusActions.replayEvents(50);
    setReplayFlash(true);
    setTimeout(() => setReplayFlash(false), 800);
  }, []);

  return (
    <>
      {/* Gear toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`
          fixed bottom-5 right-5 z-50
          w-11 h-11 rounded-full
          flex items-center justify-center
          border transition-all duration-200
          ${open
            ? 'bg-[#25D695] border-[#25D695] text-[#0B0F14] shadow-lg shadow-[#25D695]/30'
            : 'bg-[#111820] border-[#1C2432] text-[#6B7280] hover:border-[#25D695]/40 hover:text-[#25D695]'
          }
        `}
        title="Demo Controls"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-72 rounded-lg border border-[#1C2432] bg-[#0B0F14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C2432]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${demoSpeed !== 'off' ? 'bg-[#25D695] animate-pulse' : 'bg-[#6B7280]'}`} />
              <span className="text-xs font-semibold text-white tracking-wider uppercase font-['Sora']">Demo Controls</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#6B7280] font-mono">
              <span>v{version}</span>
              <span>•</span>
              <span>{eventsCount} evt</span>
            </div>
          </div>

          {/* Event Speed */}
          <div className="px-4 py-3 border-b border-[#1C2432]/60">
            <label className="block text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 font-['Sora']">Event Rate</label>
            <div className="grid grid-cols-4 gap-1">
              {SPEED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => nexusActions.setDemoSpeed(opt.value)}
                  className={`
                    px-2 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wide
                    transition-all duration-150
                    ${demoSpeed === opt.value
                      ? opt.value === 'off'
                        ? 'bg-[#1C2432] text-white border border-[#2A3444]'
                        : 'bg-[#25D695]/15 text-[#25D695] border border-[#25D695]/30'
                      : 'bg-[#111820] text-[#6B7280] border border-[#1C2432] hover:border-[#2A3444] hover:text-[#9CA3AF]'
                    }
                  `}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[9px] text-[#4B5563] font-mono">
              {SPEED_OPTIONS.find(o => o.value === demoSpeed)?.desc}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-[#1C2432]/60">
            <label className="block text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 font-['Sora']">Quick Actions</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReset}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px] font-medium
                  transition-all duration-200 border
                  ${resetFlash
                    ? 'bg-[#F5C542]/15 border-[#F5C542]/30 text-[#F5C542]'
                    : 'bg-[#111820] border-[#1C2432] text-[#9CA3AF] hover:border-[#F5C542]/30 hover:text-[#F5C542]'
                  }
                `}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset Seed
              </button>

              <button
                onClick={handleReplay}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[11px] font-medium
                  transition-all duration-200 border
                  ${replayFlash
                    ? 'bg-[#5B8DEF]/15 border-[#5B8DEF]/30 text-[#5B8DEF]'
                    : 'bg-[#111820] border-[#1C2432] text-[#9CA3AF] hover:border-[#5B8DEF]/30 hover:text-[#5B8DEF]'
                  }
                `}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Replay 50
              </button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="px-4 py-3">
            <label className="block text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 font-['Sora']">Live Stats</label>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Events" value={eventsCount} />
              <StatBox label="Ticks" value={version} />
              <StatBox
                label="Speed"
                value={demoSpeed === 'off' ? '—' : demoSpeed.toUpperCase()}
                active={demoSpeed !== 'off'}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatBox({ label, value, active }: { label: string; value: string | number; active?: boolean }) {
  return (
    <div className="bg-[#111820] rounded px-2 py-1.5 text-center border border-[#1C2432]/50">
      <div className={`text-sm font-mono font-bold ${active ? 'text-[#25D695]' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[8px] text-[#6B7280] uppercase tracking-wider">{label}</div>
    </div>
  );
}
