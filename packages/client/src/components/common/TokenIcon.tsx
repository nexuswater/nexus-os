/**
 * TokenIcon — renders branded SVG icons for each platform token.
 *
 * Usage:  <TokenIcon symbol="NXS" size={20} />
 *
 * Supported symbols: NXS, WTR, ENG, RLUSD, USDC, XRP
 * Falls back to a generic circle + symbol text for unknown tokens.
 */

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

/* ─── NXS — Nexus logo: green droplet with lightning bolt inside ─── */
function NXSIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nxs-grad" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34EDAC" />
          <stop offset="1" stopColor="#1AAF78" />
        </linearGradient>
      </defs>
      {/* Droplet shape */}
      <path
        d="M32 4C32 4 12 28 12 40C12 51.046 20.954 60 32 60C43.046 60 52 51.046 52 40C52 28 32 4 32 4Z"
        fill="url(#nxs-grad)"
      />
      {/* Lightning bolt — white */}
      <path
        d="M35 22L24 38H31L28 50L40 32H33L35 22Z"
        fill="white"
      />
    </svg>
  );
}

/* ─── WTR — Water credit: clean blue droplet ─── */
function WTRIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 4C32 4 12 28 12 40C12 51.046 20.954 60 32 60C43.046 60 52 51.046 52 40C52 28 32 4 32 4Z"
        fill="#38BDF8"
      />
    </svg>
  );
}

/* ─── ENG — Energy credit: clean lightning bolt ─── */
function ENGIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M38 4L14 36H28L22 60L50 24H34L38 4Z"
        fill="#FACC15"
      />
    </svg>
  );
}

/* ─── RLUSD — Ripple triskelion: blue circle, white triskelion ─── */
function RLUSDIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 226.777 226.777" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="113.389" cy="113.389" r="113.389" fill="#0085FF" />
      <path
        d="M160.899 163.96c-7.365 12.656-23.905 17.119-36.941 9.97-13.037-7.149-17.635-23.205-10.268-35.862 3.068-5.272 1.153-11.96-4.28-14.941-5.356-2.937-12.132-1.166-15.261 3.941h-.002v-.021c-.044.078-.083.155-.128.232-7.365 12.656-23.904 17.12-36.94 9.97-13.038-7.149-17.636-23.207-10.271-35.86 7.367-12.657 23.905-17.12 36.944-9.969 4.357 2.39 7.765 5.779 10.107 9.7v-.014l.002-.002c3.248 5.032 10.055 6.654 15.341 3.603 5.362-3.095 7.125-9.824 3.936-15.03-7.651-12.494-3.42-28.645 9.451-36.072 12.869-7.428 29.506-3.321 37.159 9.172 7.651 12.495 3.422 28.645-9.451 36.073a27.612 27.612 0 0 1-13.697 3.694l.012.005v.002c-6.175.207-11.081 5.161-11.007 11.191.073 6.11 5.239 11.008 11.533 10.936l-.039.021a27.627 27.627 0 0 1 13.533 3.401c13.034 7.151 17.632 23.206 10.267 35.86z"
        fill="white"
      />
    </svg>
  );
}

/* ─── USDC — official Circle USD Coin logo ─── */
function USDCIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 2000 2000" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z" fill="#2775CA" />
      <path d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z" fill="white" />
      <path d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z" fill="white" />
    </svg>
  );
}

/* ─── XRP — official XRP logo in circle ─── */
function XRPIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#000000" />
      {/* Official XRP X mark scaled to fill circle */}
      <g transform="translate(8, 12) scale(0.094)">
        <path d="M437,0h74L357,152.48c-55.77,55.19-146.19,55.19-202,0L.94,0H75L192,115.83a91.11,91.11,0,0,0,127.91,0Z" fill="white" />
        <path d="M74.05,424H0L155,270.58c55.77-55.19,146.19-55.19,202,0L512,424H438L320,307.23a91.11,91.11,0,0,0-127.91,0Z" fill="white" />
      </g>
    </svg>
  );
}

/* ─── ETH — blue circle with white diamond ─── */
function ETHIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#627EEA" />
      {/* Diamond top-left */}
      <path d="M32 8L18 32L32 26V8Z" fill="white" opacity="0.6" />
      {/* Diamond top-right */}
      <path d="M32 8L46 32L32 26V8Z" fill="white" />
      {/* Diamond mid-left */}
      <path d="M18 32L32 26V38L18 32Z" fill="white" opacity="0.6" />
      {/* Diamond mid-right */}
      <path d="M46 32L32 26V38L46 32Z" fill="white" opacity="0.85" />
      {/* Diamond bottom-left */}
      <path d="M18 35L32 56V41L18 35Z" fill="white" opacity="0.6" />
      {/* Diamond bottom-right */}
      <path d="M46 35L32 56V41L46 35Z" fill="white" />
    </svg>
  );
}

/* ─── Fallback icon for unknown tokens ─── */
function FallbackIcon({ symbol, size }: { symbol: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#1C2432" stroke="#25384F" strokeWidth="2" />
      <text
        x="32" y="37"
        textAnchor="middle"
        fill="#94A3B8"
        fontSize={symbol.length > 3 ? '12' : '16'}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {symbol.slice(0, 4)}
      </text>
    </svg>
  );
}

/* ─── Main export ─── */
const ICON_MAP: Record<string, React.FC<{ size: number }>> = {
  NXS: NXSIcon,
  WTR: WTRIcon,
  ENG: ENGIcon,
  RLUSD: RLUSDIcon,
  USDC: USDCIcon,
  XRP: XRPIcon,
  ETH: ETHIcon,
};

export default function TokenIcon({ symbol, size = 20, className }: TokenIconProps) {
  const Icon = ICON_MAP[symbol.toUpperCase()];
  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 ${className ?? ''}`}>
      {Icon ? <Icon size={size} /> : <FallbackIcon symbol={symbol} size={size} />}
    </span>
  );
}
