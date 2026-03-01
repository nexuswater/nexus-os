/**
 * MintToast — Glass-morphism toast notifications for mint/bridge/alert events.
 *
 * Fixed position top-right. AnimatePresence for enter/exit.
 * Max 3 visible. Auto-dismiss 5s. Click → flyTo site on globe.
 */
import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../store';
import type { ToastNotification } from '../store';
import { GLASS, HOLO, MINT_BURST } from '../hologramStyles';

// ─── Icons ──────────────────────────────────────────────

function MintIcon({ ticker }: { ticker?: string }) {
  const color = ticker
    ? (MINT_BURST.colors as Record<string, string>)[ticker] || MINT_BURST.colors.DEFAULT
    : HOLO.teal;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" opacity="0.8" />
      <path d="M8 4v8M4 8h8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BridgeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12M10 5l3 3-3 3" stroke={HOLO.space} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 13H2L8 2Z" stroke={HOLO.maintenance} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7v2.5" stroke={HOLO.maintenance} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill={HOLO.maintenance} />
    </svg>
  );
}

function TypeIcon({ type, ticker }: { type: ToastNotification['type']; ticker?: string }) {
  switch (type) {
    case 'MINT': return <MintIcon ticker={ticker} />;
    case 'BRIDGE': return <BridgeIcon />;
    case 'ALERT': return <AlertIcon />;
  }
}

function typeBorderColor(type: ToastNotification['type']): string {
  switch (type) {
    case 'MINT': return HOLO.teal;
    case 'BRIDGE': return HOLO.space;
    case 'ALERT': return HOLO.maintenance;
  }
}

// ─── Toast Item ─────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
  onClickFlyTo,
}: {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onClickFlyTo: (lat: number, lng: number) => void;
}) {
  // Auto-dismiss after 5s
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const hasFlyTo = toast.lat != null && toast.lng != null;
  const borderColor = typeBorderColor(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="relative overflow-hidden rounded-lg cursor-pointer group"
      style={{
        background: GLASS.bg,
        backdropFilter: GLASS.blur,
        WebkitBackdropFilter: GLASS.blur,
        border: `1px solid rgba(${borderColor === HOLO.teal ? '37,214,149' : borderColor === HOLO.space ? '136,204,255' : '245,197,66'},0.2)`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 12px ${borderColor}15`,
        minWidth: 240,
        maxWidth: 320,
      }}
      onClick={() => {
        if (hasFlyTo) onClickFlyTo(toast.lat!, toast.lng!);
        onDismiss(toast.id);
      }}
    >
      {/* Glow accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${borderColor}60 50%, transparent 100%)`,
        }}
      />

      <div className="flex items-start gap-2.5 p-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          <TypeIcon type={toast.type} ticker={toast.ticker} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold text-white/90 uppercase tracking-wide">
              {toast.title}
            </span>
            {toast.ticker && (
              <span
                className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                style={{
                  color: borderColor,
                  background: `${borderColor}12`,
                  border: `1px solid ${borderColor}20`,
                }}
              >
                {toast.ticker}
              </span>
            )}
          </div>
          <p className="text-[9px] font-mono text-white/45 mt-0.5 truncate">
            {toast.message}
          </p>
          {hasFlyTo && (
            <span className="text-[7px] font-mono text-nexus-400/30 uppercase tracking-widest mt-1 block group-hover:text-nexus-400/60 transition-colors">
              click to locate →
            </span>
          )}
        </div>

        {/* Dismiss */}
        <button
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Countdown bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ background: `${borderColor}40` }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ─── Toast Container ────────────────────────────────────

export default function MintToast() {
  const toastQueue = useMapStore((s) => s.toastQueue);
  const dismissToast = useMapStore((s) => s.dismissToast);
  const selectSite = useMapStore((s) => s.selectSite);
  const sites = useMapStore((s) => s.sites);

  // Only show the latest 3
  const visible = toastQueue.slice(-3);

  const handleFlyTo = useCallback(
    (lat: number, lng: number) => {
      // Find the closest site to fly to it
      let closest: string | null = null;
      let minDist = Infinity;
      for (const site of sites) {
        const dist = Math.abs(site.lat - lat) + Math.abs(site.lng - lng);
        if (dist < minDist) {
          minDist = dist;
          closest = site.id;
        }
      }
      if (closest) selectSite(closest);
    },
    [sites, selectSite],
  );

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {visible.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onClickFlyTo={handleFlyTo}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
