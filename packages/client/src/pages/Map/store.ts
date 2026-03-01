/**
 * Globe Map Zustand Store
 * v2 — includes mint event queue + toast notification queue
 */

import { create } from 'zustand';
import type { NexusSite, NexusSiteType, ActivityEvent } from './mockData';

export type TimeRange = '24h' | '7d' | '30d' | 'all';
export type FlowType = 'water' | 'energy' | 'tokens' | 'emergency';
export type HeatmapMode = 'liters' | 'alerts' | 'esg';
export type ProjectionMode = 'earth' | 'orbital' | 'lunar';

interface FlowToggles {
  water: boolean;
  energy: boolean;
  tokens: boolean;
  emergency: boolean;
}

// ─── Mint Explosion Event (for globe 3D bursts) ─────────
export interface MintEventForGlobe {
  id: string;
  lat: number;
  lng: number;
  ticker: string;
  amount: number;
  timestamp: number; // Date.now()
}

// ─── Toast Notification ──────────────────────────────────
export interface ToastNotification {
  id: string;
  type: 'MINT' | 'BRIDGE' | 'ALERT';
  title: string;
  message: string;
  ticker?: string;
  amount?: number;
  lat?: number;
  lng?: number;
  timestamp: number;
}

// ─── Bridge Event (for cross-chain arc animation) ────────
export interface BridgeEventForGlobe {
  id: string;
  fromChain: string; // e.g. 'XRPL'
  toChain: string;   // e.g. 'BASE'
  token: string;
  amount: number;
  timestamp: number;
}

interface MapState {
  // Data
  sites: NexusSite[];
  events: ActivityEvent[];
  loading: boolean;

  // Selection
  selectedSiteId: string | null;
  hoveredSiteId: string | null;

  // Filters
  visibleTypes: Set<NexusSiteType>;
  timeRange: TimeRange;
  showArcs: boolean;
  showHeatmap: boolean;
  searchQuery: string;

  // Data flow arcs
  flowToggles: FlowToggles;

  // Heatmap
  heatmapMode: HeatmapMode;

  // Projection
  projection: ProjectionMode;

  // Mint explosions
  mintEvents: MintEventForGlobe[];

  // Bridge events (for cross-chain arcs)
  bridgeEvents: BridgeEventForGlobe[];

  // Toast queue
  toastQueue: ToastNotification[];

  // Verification vault
  vaultReceiptId: string | null;

  // Agent layer
  showAgentLayer: boolean;

  // Timeline scrubber
  timelinePosition: number; // 0-1 (0 = 30 days ago, 1 = now)
  isPlaying: boolean;

  // Actions
  setSites: (sites: NexusSite[]) => void;
  setEvents: (events: ActivityEvent[]) => void;
  setLoading: (v: boolean) => void;
  selectSite: (id: string | null) => void;
  hoverSite: (id: string | null) => void;
  toggleType: (type: NexusSiteType) => void;
  setTimeRange: (range: TimeRange) => void;
  toggleArcs: () => void;
  toggleHeatmap: () => void;
  setSearchQuery: (q: string) => void;
  toggleFlow: (flow: FlowType) => void;
  setHeatmapMode: (mode: HeatmapMode) => void;
  setProjection: (p: ProjectionMode) => void;

  // Mint + Toast + Bridge actions
  pushMintEvent: (evt: MintEventForGlobe) => void;
  clearMintEvent: (id: string) => void;
  pushBridgeEvent: (evt: BridgeEventForGlobe) => void;
  clearBridgeEvent: (id: string) => void;
  pushToast: (toast: ToastNotification) => void;
  dismissToast: (id: string) => void;

  // Vault + Agent layer actions
  setVaultReceipt: (id: string | null) => void;
  toggleAgentLayer: () => void;

  // Timeline actions
  setTimelinePosition: (pos: number) => void;
  togglePlayback: () => void;
}

const ALL_TYPES = new Set<NexusSiteType>(['AWG', 'GREYWATER', 'RAIN', 'UTILITY', 'EMERGENCY', 'SPACE']);

export const useMapStore = create<MapState>((set) => ({
  sites: [],
  events: [],
  loading: true,
  selectedSiteId: null,
  hoveredSiteId: null,
  visibleTypes: new Set(ALL_TYPES),
  timeRange: '7d',
  showArcs: true,
  showHeatmap: false,
  searchQuery: '',
  flowToggles: { water: true, energy: true, tokens: true, emergency: true },
  heatmapMode: 'liters',
  projection: 'earth',
  mintEvents: [],
  bridgeEvents: [],
  toastQueue: [],
  vaultReceiptId: null,
  showAgentLayer: true,
  timelinePosition: 1, // Start at "now"
  isPlaying: false,

  setSites: (sites) => set({ sites }),
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  selectSite: (id) => set({ selectedSiteId: id }),
  hoverSite: (id) => set({ hoveredSiteId: id }),
  toggleType: (type) =>
    set((s) => {
      const next = new Set(s.visibleTypes);
      next.has(type) ? next.delete(type) : next.add(type);
      return { visibleTypes: next };
    }),
  setTimeRange: (timeRange) => set({ timeRange }),
  toggleArcs: () => set((s) => ({ showArcs: !s.showArcs })),
  toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleFlow: (flow) =>
    set((s) => ({
      flowToggles: { ...s.flowToggles, [flow]: !s.flowToggles[flow] },
    })),
  setHeatmapMode: (heatmapMode) => set({ heatmapMode }),
  setProjection: (projection) => set({ projection }),

  // Mint explosion — push event, auto-remove after 3s via consumer
  pushMintEvent: (evt) =>
    set((s) => ({ mintEvents: [...s.mintEvents, evt] })),
  clearMintEvent: (id) =>
    set((s) => ({ mintEvents: s.mintEvents.filter((e) => e.id !== id) })),

  // Bridge events — for cross-chain arc animation
  pushBridgeEvent: (evt) =>
    set((s) => ({ bridgeEvents: [...s.bridgeEvents, evt] })),
  clearBridgeEvent: (id) =>
    set((s) => ({ bridgeEvents: s.bridgeEvents.filter((e) => e.id !== id) })),

  // Toast notifications — max 3 visible, FIFO
  pushToast: (toast) =>
    set((s) => {
      const queue = [...s.toastQueue, toast];
      // Keep only most recent 5 (display component limits to 3 visible)
      return { toastQueue: queue.slice(-5) };
    }),
  dismissToast: (id) =>
    set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),

  // Verification vault
  setVaultReceipt: (id) => set({ vaultReceiptId: id }),

  // Agent layer
  toggleAgentLayer: () => set((s) => ({ showAgentLayer: !s.showAgentLayer })),

  // Timeline
  setTimelinePosition: (pos) => set({ timelinePosition: Math.max(0, Math.min(1, pos)) }),
  togglePlayback: () => set((s) => ({ isPlaying: !s.isPlaying })),
}));
