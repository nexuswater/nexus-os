/**
 * Nexus Terminal Theme Configuration
 * Institutional DEX design tokens — Bloomberg Terminal + Uniswap v3 aesthetic.
 *
 * Primary accent: Nexus emerald green (#25D695)
 * Background: Ultra-dark terminal (#0B0F14)
 * Typography: Sora (headings/body) + JetBrains Mono (numbers/code)
 */

// ─── Background Layers ──────────────────────────────────

export const BG = {
  /** Ultra-dark base background */
  base: '#0B0F14',
  /** Card / panel surface */
  card: '#111820',
  /** Elevated / hover card surface */
  cardHover: '#161E2A',
  /** Input / well surface */
  input: '#0D1117',
  /** Modal / overlay backdrop */
  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

// ─── Accent Colors ──────────────────────────────────────

export const ACCENT = {
  /** Primary nexus emerald */
  primary: '#25D695',
  /** Hover state */
  primaryHover: '#1FBF84',
  /** Dim / subtle */
  dim: '#25D69520',
  /** Bright glow (for edge-lit effects) */
  glow: 'rgba(37, 214, 149, 0.06)',
  /** Badge / tag background */
  tag: 'rgba(37, 214, 149, 0.12)',
} as const;

// ─── Border Colors ──────────────────────────────────────

export const BORDER = {
  /** Default card/panel border */
  default: '#1C2432',
  /** Hover / focus state */
  hover: '#25D69540',
  /** Separator (lighter) */
  separator: '#1A2030',
  /** Active / selected */
  active: '#25D69560',
} as const;

// ─── Text Colors ────────────────────────────────────────

export const TEXT = {
  /** Primary text (headings, values) */
  primary: '#F1F5F9',
  /** Secondary text (labels, descriptions) */
  secondary: '#64748B',
  /** Muted text (timestamps, hints) */
  muted: '#334155',
  /** Disabled text */
  disabled: '#1E293B',
} as const;

// ─── Semantic Colors ────────────────────────────────────

export const SEMANTIC = {
  /** Success / positive */
  success: '#25D695',
  /** Warning / caution */
  warning: '#F5C542',
  /** Error / negative */
  error: '#EF4444',
  /** Info / neutral */
  info: '#5B8DEF',
  /** Water token (WTR) */
  water: '#00b8f0',
  /** Energy token (ENG) */
  energy: '#f99d07',
  /** Up / profit */
  up: '#25D695',
  /** Down / loss */
  down: '#EF4444',
} as const;

// ─── Chart Colors ───────────────────────────────────────

export const CHART = {
  /** Candlestick up */
  candleUp: '#25D695',
  /** Candlestick down */
  candleDown: '#EF4444',
  /** Grid lines */
  grid: '#1C2432',
  /** Crosshair */
  crosshair: '#64748B',
  /** Volume bars */
  volume: 'rgba(37, 214, 149, 0.15)',
  /** Area fill */
  area: 'rgba(37, 214, 149, 0.08)',
  /** Line */
  line: '#25D695',
} as const;

// ─── Spacing / Radius ───────────────────────────────────

export const RADIUS = {
  /** Cards, panels */
  card: '12px',
  /** Buttons, inputs */
  button: '8px',
  /** Pills, badges */
  pill: '9999px',
  /** Small elements */
  sm: '6px',
} as const;

// ─── Animation ──────────────────────────────────────────

export const MOTION = {
  /** Fast micro-interactions */
  fast: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  /** Standard transitions */
  standard: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  /** Entry animations */
  enter: { duration: 0.35, ease: [0, 0, 0.2, 1] },
  /** Stagger delay between items */
  stagger: 0.04,
} as const;

// ─── Combined Theme Export ──────────────────────────────

export const THEME = {
  bg: BG,
  accent: ACCENT,
  border: BORDER,
  text: TEXT,
  semantic: SEMANTIC,
  chart: CHART,
  radius: RADIUS,
  motion: MOTION,
} as const;

export default THEME;
