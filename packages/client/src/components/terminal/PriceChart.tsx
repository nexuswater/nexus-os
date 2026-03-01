import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface OHLCVCandle {
  time: string;          // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceChartProps {
  pair?: string;
  className?: string;
  height?: number;
  /** Current live price — used as fallback when OHLCV fetch fails */
  livePrice?: number;
  /** GeckoTerminal pool id for live OHLCV data (e.g. "NXS.rNexus…_XRP") */
  poolId?: string;
  /** GeckoTerminal network slug (default: "xrpl") */
  network?: string;
}

type RangeKey = '1W' | '1M' | '3M' | 'ALL';

/* ------------------------------------------------------------------ */
/*  GeckoTerminal OHLCV fetcher                                       */
/* ------------------------------------------------------------------ */

const GECKO_TERMINAL = 'https://api.geckoterminal.com/api/v2';
const OHLCV_REFRESH = 5 * 60_000; // refresh every 5 minutes

async function fetchOHLCV(
  network: string,
  poolId: string,
  days: number = 90,
): Promise<OHLCVCandle[] | null> {
  try {
    const res = await fetch(
      `${GECKO_TERMINAL}/networks/${network}/pools/${encodeURIComponent(poolId)}/ohlcv/day?limit=${days}&currency=usd`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const list: number[][] = json?.data?.attributes?.ohlcv_list;
    if (!list || !Array.isArray(list) || list.length === 0) return null;

    // GeckoTerminal returns newest-first → reverse for chronological order
    const sorted = [...list].reverse();

    // Deduplicate by date string
    const seen = new Set<string>();
    const candles: OHLCVCandle[] = [];

    for (const [ts, open, high, low, close, volume] of sorted) {
      const date = new Date(ts * 1000);
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candles.push({ time: key, open, high, low, close, volume });
    }

    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Mock data generator (fallback)                                    */
/* ------------------------------------------------------------------ */

function generateMockOHLCV(days: number = 90): OHLCVCandle[] {
  const candles: OHLCVCandle[] = [];
  const now = new Date();

  let price = 2.40;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const timeStr = `${yyyy}-${mm}-${dd}`;

    const open = price;
    const changePct = (Math.random() - 0.485) * 0.06;
    const close = +(open * (1 + changePct)).toFixed(4);

    const wickUp = Math.random() * 0.015 * open;
    const wickDown = Math.random() * 0.015 * open;
    const high = +(Math.max(open, close) + wickUp).toFixed(4);
    const low = +(Math.min(open, close) - wickDown).toFixed(4);

    const volume = Math.round(50_000 + Math.random() * 450_000);

    candles.push({ time: timeStr, open, high, low, close, volume });
    price = close;
  }

  return candles;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function filterByRange(data: OHLCVCandle[], range: RangeKey): OHLCVCandle[] {
  if (range === 'ALL') return data;

  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case '1W':
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case '1M':
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case '3M':
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
    default:
      return data;
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((c) => c.time >= cutoffStr);
}

function formatPrice(n: number): string {
  if (n >= 1) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toPrecision(4);
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const RANGES: RangeKey[] = ['1W', '1M', '3M', 'ALL'];

export default function PriceChart({
  pair = 'NXS/USD',
  className = '',
  height = 350,
  livePrice,
  poolId,
  network = 'xrpl',
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [activeRange, setActiveRange] = useState<RangeKey>('ALL');

  /* ---- Live OHLCV from GeckoTerminal ---- */

  const [liveOHLCV, setLiveOHLCV] = useState<OHLCVCandle[] | null>(null);

  useEffect(() => {
    if (!poolId) return;
    let cancelled = false;

    async function load() {
      const data = await fetchOHLCV(network, poolId!, 90);
      if (!cancelled && data) setLiveOHLCV(data);
    }

    load();
    const interval = setInterval(load, OHLCV_REFRESH);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [poolId, network]);

  /* ---- Mock fallback (only used if no live data) ---- */

  const rawMockData = useMemo(() => generateMockOHLCV(90), []);

  const mockDataScaled = useMemo(() => {
    if (!livePrice || livePrice <= 0 || rawMockData.length === 0) return rawMockData;
    const lastClose = rawMockData[rawMockData.length - 1].close;
    if (lastClose <= 0) return rawMockData;
    const scale = livePrice / lastClose;
    return rawMockData.map((c) => ({
      ...c,
      open: c.open * scale,
      high: c.high * scale,
      low: c.low * scale,
      close: c.close * scale,
    }));
  }, [rawMockData, livePrice]);

  /* ---- Resolved data: live → mock fallback ---- */

  const allData = liveOHLCV && liveOHLCV.length > 0 ? liveOHLCV : mockDataScaled;

  const visibleData = useMemo(
    () => filterByRange(allData, activeRange),
    [allData, activeRange],
  );

  // Derive header values from the visible slice
  const currentPrice = visibleData.length > 0 ? visibleData[visibleData.length - 1].close : 0;
  const prevClose =
    visibleData.length > 1
      ? visibleData[visibleData.length - 2].close
      : visibleData.length > 0
        ? visibleData[0].open
        : 0;
  const changePct = prevClose !== 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
  const isPositive = changePct >= 0;
  const isLive = !!(liveOHLCV && liveOHLCV.length > 0);

  /* ---- chart creation / cleanup ---- */

  const buildChart = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Tear down any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0D1117' },
        textColor: '#64748B',
        fontFamily:
          "'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1C2432' },
        horzLines: { color: '#1C2432' },
      },
      crosshair: {
        vertLine: { color: '#25D695', labelBackgroundColor: '#1C2432' },
        horzLine: { color: '#25D695', labelBackgroundColor: '#1C2432' },
      },
      rightPriceScale: {
        borderColor: '#1C2432',
      },
      timeScale: {
        borderColor: '#1C2432',
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    /* ---- Candlestick series ---- */

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#25D695',
      downColor: '#EF4444',
      borderUpColor: '#25D695',
      borderDownColor: '#EF4444',
      wickUpColor: '#25D695',
      wickDownColor: '#EF4444',
    });

    candleSeriesRef.current = candleSeries;

    /* ---- Volume histogram series ---- */

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeriesRef.current = volumeSeries;

    // Fit content once initially
    chart.timeScale().fitContent();

    /* ---- ResizeObserver ---- */

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          chart.applyOptions({ width });
        }
      }
    });

    ro.observe(container);

    // Hide TradingView attribution logo
    const tvLink = container.querySelector('a[href*="tradingview"]') as HTMLElement | null;
    if (tvLink) tvLink.style.display = 'none';

    // Store the observer on the container for cleanup
    (container as any).__ro = ro;
  }, [height]);

  // Create the chart once on mount
  useEffect(() => {
    buildChart();

    return () => {
      const container = chartContainerRef.current;
      if (container && (container as any).__ro) {
        ((container as any).__ro as ResizeObserver).disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [buildChart]);

  // Update series data whenever visibleData changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    // Dynamic price format based on magnitude (handles micro-prices like $0.00006)
    const cp = visibleData.length > 0 ? visibleData[visibleData.length - 1].close : 1;
    const precision = cp < 0.0001 ? 10 : cp < 0.01 ? 8 : cp < 1 ? 6 : 4;
    const minMove = cp < 0.0001 ? 1e-10 : cp < 0.01 ? 1e-8 : cp < 1 ? 1e-6 : 1e-4;

    candleSeriesRef.current.applyOptions({
      priceFormat: { type: 'price', precision, minMove },
    });

    const candleData: CandlestickData<Time>[] = visibleData.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData: HistogramData<Time>[] = visibleData.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? '#25D69530' : '#EF444430',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current?.timeScale().fitContent();
  }, [visibleData]);

  /* ---- Render ---- */

  return (
    <div
      className={`bg-[#0D1117] border border-[#1C2432] rounded-xl overflow-hidden ${className}`}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* Left: pair + price + change */}
        <div className="flex items-baseline gap-3">
          <span className="text-white font-bold text-sm tracking-wide">
            {pair}
          </span>
          <span
            className="text-white text-2xl font-semibold tabular-nums"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            ${formatPrice(currentPrice)}
          </span>
          <span
            className={`text-sm font-medium tabular-nums ${
              isPositive ? 'text-[#25D695]' : 'text-[#EF4444]'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPct(changePct)}
          </span>
          {isLive && (
            <span className="text-[9px] text-[#475569] font-mono uppercase tracking-wider">LIVE</span>
          )}
        </div>

        {/* Right: range selector */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeRange === r
                  ? 'bg-[#25D695]/10 text-[#25D695]'
                  : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1C2432]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Chart ---- */}
      <div className="relative">
        <div ref={chartContainerRef} style={{ width: '100%', height }} />
        {/* Nexus branding — replaces TradingView watermark */}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 pointer-events-none opacity-30">
          <svg width="16" height="16" viewBox="0 0 64 64" fill="none">
            <defs>
              <linearGradient id="nxs-chart" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#34EDAC" />
                <stop offset="1" stopColor="#1AAF78" />
              </linearGradient>
            </defs>
            <path d="M32 4C32 4 12 28 12 40C12 51.046 20.954 60 32 60C43.046 60 52 51.046 52 40C52 28 32 4 32 4Z" fill="url(#nxs-chart)" />
            <path d="M35 22L24 38H31L28 50L40 32H33L35 22Z" fill="white" />
          </svg>
          <span className="text-[10px] font-semibold text-white/60 tracking-wide">NexusOS</span>
        </div>
      </div>
    </div>
  );
}
