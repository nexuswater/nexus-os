/**
 * Hologram Theme Tokens
 * Shared constants for the globe hologram visual style.
 */

// ─── Color Palette (hex) ────────────────────────────────

export const HOLO = {
  // Primary hologram teal/green — matches nexus-400
  teal:       '#25D695',
  tealDim:    '#1a9e6e',
  tealGlow:   '#25D69544',

  // Status-mapped hologram colors
  active:     '#25D695',   // bright teal
  maintenance:'#F5C542',   // warm amber-yellow
  planned:    '#5B8DEF',   // soft blue
  offline:    '#E05272',   // dim magenta-red
  space:      '#88CCFF',   // pale cyan for orbital/lunar

  // UI chrome
  panelBg:    'rgba(10, 12, 18, 0.82)',
  panelBorder:'rgba(37, 214, 149, 0.12)',
  glassBg:    'rgba(15, 18, 28, 0.65)',
  scanline:   'rgba(37, 214, 149, 0.04)',

  // Globe
  atmosphere: '#25D695',
  globeDark:  '#0a0c12',
  gridLine:   'rgba(37, 214, 149, 0.06)',
} as const;

// ─── Beam / Pin Config ──────────────────────────────────

export const BEAM = {
  minHeight: 2.5,
  maxHeight: 12.0,
  radiusTop: 0.06,
  radiusBottom: 0.18,
  segments: 12,
  opacity: 0.82,
  flickerAmplitude: 0.1,
  flickerSpeed: 3.5,
} as const;

export const RING = {
  innerRadius: 0.35,
  outerRadius: 1.0,
  pulseScale: 3.0,
  pulseDuration: 2200, // ms
  baseOpacity: 0.65,
} as const;

export const CORE = {
  radius: 0.18,
  opacity: 0.95,
} as const;

// ─── Data Flow Arc Colors ────────────────────────────────
export const FLOW_COLORS = {
  WATER: '#25D695',    // neon teal
  ENERGY: '#4ADE80',   // electric green
  TOKEN: '#22D3EE',    // cyan
  EMERGENCY: '#F5C542', // warning amber
} as const;

// ─── Heatmap Gradient ────────────────────────────────────
export const HEAT_GRADIENT = {
  low: '#1E3A5F',      // deep blue
  medium: '#25D695',    // neon teal
  high: '#4ADE80',      // bright green
  critical: '#F5C542',  // soft yellow
} as const;

// ─── Atmosphere Glow ────────────────────────────────────
export const ATMOSPHERE = {
  innerGlowRadius: 101,
  outerHazeRadius: 115,
  fresnelPower: 3.0,
  innerOpacity: 0.18,
  outerOpacity: 0.06,
  color: '#25D695',
} as const;

// ─── Star Field Particles ───────────────────────────────
export const PARTICLES = {
  count: 500,
  minSize: 0.3,
  maxSize: 1.5,
  minAlpha: 0.08,
  maxAlpha: 0.5,
  driftSpeed: 0.015,
  twinkleSpeed: { min: 0.3, max: 1.8 },
  parallaxStrength: 0.02,
} as const;

// ─── Mint Explosion FX ─────────────────────────────────
export const MINT_BURST = {
  particleCount: 60,
  burstRadius: 8,
  burstDuration: 2500,
  coreFlashDuration: 400,
  ringExpansion: 12,
  colors: {
    WTR: '#25D695',
    ENG: '#4ADE80',
    NXS: '#22D3EE',
    DEFAULT: '#25D695',
  },
} as const;

// ─── Glass Morphism ─────────────────────────────────────
export const GLASS = {
  bg: 'rgba(10, 12, 18, 0.72)',
  bgHover: 'rgba(10, 12, 18, 0.82)',
  border: 'rgba(37, 214, 149, 0.08)',
  borderHover: 'rgba(37, 214, 149, 0.18)',
  blur: 'blur(16px) saturate(1.3)',
  shadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  shadowHover: '0 8px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(37, 214, 149, 0.04)',
} as const;

// ─── Cross-Chain Hub Locations ──────────────────────────
export const CHAIN_HUBS = {
  XRPL:     { lat: 37.79, lng: -122.39, label: 'XRPL', color: '#FFFFFF' },
  BASE:     { lat: 37.77, lng: -122.41, label: 'Base', color: '#3B82F6' },
  ARBITRUM: { lat: 40.71, lng: -74.01,  label: 'Arbitrum', color: '#28A0F0' },
  COREUM:   { lat: 47.38, lng: 8.54,    label: 'Coreum', color: '#25D695' },
} as const;

// ─── Status → visual mapping ────────────────────────────

export function statusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return HOLO.active;
    case 'MAINTENANCE': return HOLO.maintenance;
    case 'PLANNED': return HOLO.planned;
    case 'OFFLINE': return HOLO.offline;
    default: return HOLO.tealDim;
  }
}

export function statusIntensity(status: string): number {
  switch (status) {
    case 'ACTIVE': return 1.0;
    case 'MAINTENANCE': return 0.65;
    case 'PLANNED': return 0.45;
    case 'OFFLINE': return 0.25;
    default: return 0.5;
  }
}

// ─── Utility ─────────────────────────────────────────────

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function computeActivity(litersToday: number, alertsCount: number): number {
  return clamp01(litersToday / 8000) * 0.7 + clamp01(alertsCount / 5) * 0.3;
}

export function computeBeamHeight(activity: number): number {
  return lerp(BEAM.minHeight, BEAM.maxHeight, activity);
}
