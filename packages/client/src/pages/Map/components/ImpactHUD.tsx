/**
 * ImpactHUD — Bottom-left animated stats overlay for the globe.
 * Shows: Total Liters, Tokens Minted, Active Sites, Carbon Offset, Active Bridges.
 * Collapses on mobile. Uses AnimatedCounter for smooth number interpolation.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { useMapStore } from '../store';
import { GLASS, HOLO } from '../hologramStyles';

interface StatItem {
  label: string;
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
}

// ─── Inline Icons ───────────────────────────────────────

function DropletIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1.5C6 1.5 2 5.5 2 7.5C2 9.7 3.8 11 6 11C8.2 11 10 9.7 10 7.5C10 5.5 6 1.5 6 1.5Z"
        stroke={HOLO.teal} strokeWidth="1" fill="none" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke={HOLO.active} strokeWidth="1" />
      <path d="M6 3.5V8.5M4.5 5H7.5" stroke={HOLO.active} strokeWidth="0.8" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="8" r="1" fill={HOLO.planned} />
      <path d="M3.5 6.5C4.2 5.8 5 5.5 6 5.5S7.8 5.8 8.5 6.5" stroke={HOLO.planned} strokeWidth="0.8" strokeLinecap="round" />
      <path d="M2 5C3.2 3.8 4.5 3 6 3S8.8 3.8 10 5" stroke={HOLO.planned} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 9.5C3 9.5 3 6 6 3C9 6 9 9.5 9 9.5" stroke="#4ADE80" strokeWidth="1" strokeLinecap="round" />
      <path d="M6 6V9.5" stroke="#4ADE80" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6.5 1.5L3 7h3l-0.5 3.5L9 5H6L6.5 1.5Z" stroke="#4ADE80" strokeWidth="0.8" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 8h10M3 8V5C3 3.9 4.3 3 6 3S9 3.9 9 5V8" stroke={HOLO.space} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────

export default function ImpactHUD() {
  const sites = useMapStore((s) => s.sites);
  const [collapsed, setCollapsed] = useState(false);

  const stats: StatItem[] = useMemo(() => {
    const activeSites = sites.filter((s) => s.status === 'ACTIVE').length;
    const totalLiters = sites.reduce((sum, s) => sum + (s.litersToday || 0), 0);
    const totalKwh = sites.reduce((sum, s) => sum + (s.energyKwhToday ?? 0), 0);
    // Derive from site data
    const tokensMinted = Math.round(totalLiters * 0.42); // rough ratio
    const carbonOffset = Math.round(totalLiters * 0.0018 + totalKwh * 0.0004); // kg CO2
    const activeBridges = Math.min(Math.floor(activeSites / 4), 8);

    return [
      {
        label: 'Total Liters',
        value: totalLiters,
        suffix: ' L',
        color: HOLO.teal,
        icon: <DropletIcon />,
      },
      {
        label: 'Total kWh',
        value: totalKwh,
        suffix: ' kWh',
        color: '#4ADE80',
        icon: <BoltIcon />,
      },
      {
        label: 'Tokens Minted',
        value: tokensMinted,
        color: HOLO.active,
        icon: <CoinIcon />,
      },
      {
        label: 'Active Sites',
        value: activeSites,
        color: HOLO.planned,
        icon: <SignalIcon />,
      },
      {
        label: 'Carbon Offset',
        value: carbonOffset,
        suffix: ' kg',
        color: '#4ADE80',
        icon: <LeafIcon />,
      },
      {
        label: 'Active Bridges',
        value: activeBridges,
        color: HOLO.space,
        icon: <BridgeIcon />,
      },
    ];
  }, [sites]);

  return (
    <div className="absolute bottom-14 left-3 z-20 pointer-events-auto">
      {/* Toggle button */}
      <button
        className="mb-1.5 text-[7px] font-mono text-nexus-400/30 uppercase tracking-widest hover:text-nexus-400/60 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? '▶ IMPACT' : '▼ IMPACT'}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg p-2 space-y-1.5 hidden sm:block"
            style={{
              background: GLASS.bg,
              backdropFilter: GLASS.blur,
              WebkitBackdropFilter: GLASS.blur,
              border: `1px solid ${GLASS.border}`,
              boxShadow: GLASS.shadow,
              minWidth: 150,
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="flex-shrink-0 opacity-70">{stat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[7px] font-mono text-white/30 uppercase tracking-wider truncate">
                    {stat.label}
                  </div>
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    className="text-[11px] font-mono font-semibold tabular-nums"
                    stiffness={60}
                    damping={18}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
