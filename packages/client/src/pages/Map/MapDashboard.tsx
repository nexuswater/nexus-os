/**
 * MapDashboard — Hologram 3D Globe Mission Control v2
 *
 * Desktop: Globe left 70% | Right 30% glass panels | Bottom activity feed
 * Mobile: Globe full width top | Bottom sheet panels
 *
 * v2: ParticleField star background, glass morphism panels, enhanced HUD
 * v2.1: Live mint explosions, toast notifications, EventBus bridge
 * v2.2: Impact HUD, heatmap legend, cross-chain arc visualization
 */
import { useEffect, Suspense, lazy } from 'react';
import { useMapStore } from './store';
import { fetchSites, fetchEvents } from './mockData';
import KPIBar from './components/KPIBar';
import FiltersPanel from './components/FiltersPanel';
import SiteDetailDrawer from './components/SiteDetailDrawer';
import VerificationVault from './components/VerificationVault';
import ActivityFeed from './components/ActivityFeed';
import ParticleField from './components/ParticleField';
import MintToast from './components/MintToast';
import ImpactHUD from './components/ImpactHUD';
import HeatmapLegend from './components/HeatmapLegend';
import TimelineScrubber from './components/TimelineScrubber';
import { useEventBusSubscription } from './hooks/useEventBusSubscription';
import { HOLO, GLASS } from './hologramStyles';

// Lazy load the heavy globe component
const GlobeView = lazy(() => import('./components/GlobeView'));

function GlobeFallback() {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-[#060810] flex items-center justify-center">
      {/* Scanlines placeholder */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(37,214,149,0.02) 0px, rgba(37,214,149,0.02) 1px, transparent 1px, transparent 4px)',
        }}
      />
      <div className="flex flex-col items-center gap-3 z-10">
        <div className="w-10 h-10 border-2 border-nexus-400/40 border-t-nexus-400 rounded-full animate-spin" />
        <span className="text-[10px] font-mono text-nexus-400/50 tracking-widest uppercase">
          Initializing Globe
        </span>
      </div>
    </div>
  );
}

/** Shared glass panel styles */
const glassPanel = {
  background: GLASS.bg,
  backdropFilter: GLASS.blur,
  WebkitBackdropFilter: GLASS.blur,
  border: `1px solid ${GLASS.border}`,
  boxShadow: GLASS.shadow,
} as const;

const glassPanelActive = {
  ...glassPanel,
  borderColor: GLASS.borderHover,
  boxShadow: GLASS.shadowHover,
} as const;

export default function MapDashboard() {
  const setSites = useMapStore((s) => s.setSites);
  const setEvents = useMapStore((s) => s.setEvents);
  const setLoading = useMapStore((s) => s.setLoading);
  const loading = useMapStore((s) => s.loading);
  const selectedSiteId = useMapStore((s) => s.selectedSiteId);
  const vaultReceiptId = useMapStore((s) => s.vaultReceiptId);

  // Bridge EventBus → map store (mint explosions + toasts)
  useEventBusSubscription();

  // Dev helper: expose store for testing mint explosions / toasts
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__mapStore = useMapStore;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sites, events] = await Promise.all([fetchSites(), fetchEvents()]);
      setSites(sites);
      setEvents(events);
      setLoading(false);
    }
    load();
  }, [setSites, setEvents, setLoading]);

  return (
    <div className="space-y-3 -mt-2">
      {/* Toast notifications — fixed position overlay */}
      <MintToast />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: HOLO.teal }}
            />
            Mission Control
          </h1>
          <p className="text-[11px] text-gray-600 font-mono tracking-wide">
            NEXUS GLOBAL WATER & ENERGY NETWORK — LIVE TELEMETRY — {!loading && <span className="text-nexus-400/60">{useMapStore.getState().sites.length} NODES</span>}
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Globe — takes 70% on desktop */}
        <div className="lg:w-[70%] lg:flex-shrink-0">
          <div className="relative h-[420px] lg:h-[540px]">
            {/* Star field background behind globe */}
            <ParticleField />
            <div className="relative z-[1] w-full h-full">
              <Suspense fallback={<GlobeFallback />}>
                {!loading && <GlobeView />}
                {loading && <GlobeFallback />}
              </Suspense>
            </div>
            {/* Impact HUD — bottom-left inside globe area */}
            {!loading && <ImpactHUD />}
            {/* Heatmap legend — bottom-right inside globe area */}
            {!loading && <HeatmapLegend />}
            {/* Timeline scrubber — bottom of globe area */}
            {!loading && <TimelineScrubber />}
          </div>
        </div>

        {/* Right panels — 30% on desktop — Glass morphism */}
        <div className="lg:w-[30%] space-y-3">
          {/* KPI cards */}
          <KPIBar />

          {/* Filters */}
          <div
            className="p-3 rounded-xl transition-all duration-300"
            style={glassPanel}
          >
            <FiltersPanel />
          </div>

          {/* Site detail / Verification vault — conditional render */}
          <div
            className="p-3 rounded-xl min-h-[200px] transition-all duration-300 overflow-y-auto max-h-[400px]"
            style={(selectedSiteId || vaultReceiptId) ? glassPanelActive : glassPanel}
          >
            {vaultReceiptId ? <VerificationVault /> : <SiteDetailDrawer />}
          </div>
        </div>
      </div>

      {/* Activity feed — bottom */}
      <ActivityFeed />
    </div>
  );
}
