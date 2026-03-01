/** Mock OHLCV generator for price charts */

export interface OHLCVCandle {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SparklineData {
  prices: number[];
  timestamps: string[];
}

// Generate 90 days of OHLCV data for a token pair
export function generateOHLCV(pair: string, days = 90): OHLCVCandle[] {
  // Use pair to seed a deterministic-ish starting price
  const pairPrices: Record<string, number> = {
    'NXS/USD': 2.40,
    'WTR/USD': 0.85,
    'ENG/USD': 1.12,
    'XRP/USD': 2.18,
    'NXS/XRP': 1.10,
  };
  let price = pairPrices[pair] ?? 1.0;
  const candles: OHLCVCandle[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const change = (Math.random() - 0.48) * 0.06; // slight uptrend bias
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = 50000 + Math.random() * 450000;
    
    candles.push({
      time: dateStr,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: Math.round(volume),
    });
    
    price = close;
  }
  return candles;
}

// Generate 7-day sparkline
export function generateSparkline(token: string): SparklineData {
  const basePrices: Record<string, number> = {
    NXS: 2.40,
    WTR: 0.85,
    ENG: 1.12,
    XRP: 2.18,
    USDC: 1.0,
    RLUSD: 1.0,
  };
  let price = basePrices[token] ?? 1.0;
  const prices: number[] = [];
  const timestamps: string[] = [];
  const now = new Date();
  
  for (let i = 168; i >= 0; i--) { // hourly for 7 days
    const date = new Date(now);
    date.setHours(date.getHours() - i);
    timestamps.push(date.toISOString());
    price *= 1 + (Math.random() - 0.49) * 0.01;
    prices.push(Number(price.toFixed(4)));
  }
  return { prices, timestamps };
}

// Activity feed mock
export interface ActivityEvent {
  id: string;
  type: 'oracle' | 'mint' | 'swap' | 'governance' | 'system';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export function generateActivityFeed(count = 30): ActivityEvent[] {
  const templates: Array<{ type: ActivityEvent['type']; messages: string[]; severity: ActivityEvent['severity'] }> = [
    { type: 'oracle', messages: ['Water meter reading: 847L processed', 'IoT sensor sync: Site Lagos-AWG-01', 'TDS reading 142ppm — within spec', 'UV sterilization cycle complete'], severity: 'info' },
    { type: 'mint', messages: ['Batch WTR-2026-0047 minted: 1,200 WTR', 'Verification approved: Site Nairobi-GW-03', 'ENG batch pending oracle confirmation', 'MRV pipeline: 3 submissions queued'], severity: 'info' },
    { type: 'swap', messages: ['Swap executed: 500 NXS → 1,090 XRP', 'Limit order filled: 200 WTR @ $0.87', 'Bridge transfer: 1000 NXS XRPL→Base', 'DEX liquidity: NXS/XRP pool +$12.4k'], severity: 'info' },
    { type: 'governance', messages: ['Proposal NXP-42 passed (87% approval)', 'New proposal: Expand African AWG Network', 'Delegation received: +5,000 VP from 0xA3..F1', 'Treasury disbursement: 50,000 NXS approved'], severity: 'info' },
    { type: 'system', messages: ['XRPL Testnet: Block 84,291,004', 'Base L2 sync: 142ms latency', 'Agent AutoYield optimized: +2.3% APR'], severity: 'info' },
    { type: 'oracle', messages: ['Sensor offline: Mumbai-RAIN-02 (24h)', 'Anomaly detected: flow rate spike Site-07'], severity: 'warning' },
    { type: 'system', messages: ['Bridge congestion: Axelar GMP delay 120s', 'High gas: Base L2 fees elevated'], severity: 'warning' },
  ];
  
  const events: ActivityEvent[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    const msg = tmpl.messages[Math.floor(Math.random() * tmpl.messages.length)];
    events.push({
      id: `evt_${i.toString(36)}`,
      type: tmpl.type,
      message: msg,
      timestamp: new Date(now - i * 120000 - Math.random() * 60000).toISOString(),
      severity: tmpl.severity,
    });
  }
  return events.reverse();
}
