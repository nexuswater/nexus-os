/**
 * Globe Mock Data
 * 40+ hand-crafted sites + deterministic procedural generation to ~500 total.
 * Structured to swap to real API later: replace fetchSites() body.
 */

export type NexusSiteType = 'AWG' | 'GREYWATER' | 'RAIN' | 'UTILITY' | 'EMERGENCY' | 'SPACE';

export interface NexusSite {
  id: string;
  name: string;
  type: NexusSiteType;
  lat: number;
  lng: number;
  region: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE' | 'PLANNED';
  lastUpdateISO: string;
  litersToday: number;
  liters7d: number;
  waterQuality?: { tds?: number; uvStatus?: 'OK' | 'WARN' | 'FAIL' };
  energyKwhToday?: number;
  wtrMintedBatchIds?: string[];
  engMintedBatchIds?: string[];
  esgScore?: number;
  alerts?: Array<{ level: 'INFO' | 'WARN' | 'CRIT'; message: string; timeISO: string }>;
}

export interface MintBatch {
  id: string;
  ticker: 'WTR' | 'ENG';
  amount: number;
  mintedISO: string;
  installation: string;
  location: string;
  region: string;
  retirementMonths: number;
}

export interface ActivityEvent {
  id: string;
  type: 'iot_reading' | 'batch_mint' | 'alert' | 'status_change';
  siteId: string;
  siteName: string;
  message: string;
  timeISO: string;
  level?: 'INFO' | 'WARN' | 'CRIT';
}

// ─── Deterministic PRNG (mulberry32) ─────────────────────
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Mock Sites (original 40) ────────────────────────────

const HAND_CRAFTED_SITES: NexusSite[] = [
  // ── US ─────────────
  { id: 'site_phoenix_01', name: 'Phoenix AWG Alpha', type: 'AWG', lat: 33.45, lng: -112.07, region: 'Phoenix, AZ', status: 'ACTIVE', lastUpdateISO: '2026-02-25T11:00:00Z', litersToday: 6200, liters7d: 42800, waterQuality: { tds: 42, uvStatus: 'OK' }, esgScore: 94, wtrMintedBatchIds: ['batch_wtr_001'], alerts: [] },
  { id: 'site_phoenix_02', name: 'Phoenix AWG Bravo', type: 'AWG', lat: 33.52, lng: -111.93, region: 'Phoenix, AZ', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:45:00Z', litersToday: 5800, liters7d: 39100, waterQuality: { tds: 38, uvStatus: 'OK' }, esgScore: 91, alerts: [] },
  { id: 'site_austin_01', name: 'Austin Greywater Hub', type: 'GREYWATER', lat: 30.27, lng: -97.74, region: 'Austin, TX', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:30:00Z', litersToday: 4100, liters7d: 28700, waterQuality: { tds: 65, uvStatus: 'OK' }, esgScore: 87, alerts: [] },
  { id: 'site_denver_01', name: 'Denver Solar Array', type: 'UTILITY', lat: 39.74, lng: -104.99, region: 'Denver, CO', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 0, liters7d: 0, energyKwhToday: 892, engMintedBatchIds: ['batch_eng_001'], esgScore: 96, alerts: [] },
  { id: 'site_portland_01', name: 'Portland Rain Harvest', type: 'RAIN', lat: 45.52, lng: -122.68, region: 'Portland, OR', status: 'MAINTENANCE', lastUpdateISO: '2026-02-25T08:00:00Z', litersToday: 1200, liters7d: 18400, waterQuality: { tds: 28, uvStatus: 'WARN' }, esgScore: 82, alerts: [{ level: 'WARN', message: 'UV lamp approaching end-of-life', timeISO: '2026-02-25T08:00:00Z' }] },
  { id: 'site_maui_01', name: 'Maui AWG Station', type: 'AWG', lat: 20.80, lng: -156.32, region: 'Maui, HI', status: 'ACTIVE', lastUpdateISO: '2026-02-25T11:15:00Z', litersToday: 7800, liters7d: 54600, waterQuality: { tds: 30, uvStatus: 'OK' }, esgScore: 98, wtrMintedBatchIds: ['batch_wtr_002', 'batch_wtr_003'], alerts: [] },
  { id: 'site_la_01', name: 'LA Emergency Deploy', type: 'EMERGENCY', lat: 34.05, lng: -118.24, region: 'Los Angeles, CA', status: 'ACTIVE', lastUpdateISO: '2026-02-25T09:30:00Z', litersToday: 3400, liters7d: 15200, waterQuality: { tds: 55, uvStatus: 'OK' }, esgScore: 78, alerts: [{ level: 'INFO', message: 'Emergency deployment running nominal', timeISO: '2026-02-25T09:30:00Z' }] },
  { id: 'site_miami_01', name: 'Miami Rain Collector', type: 'RAIN', lat: 25.76, lng: -80.19, region: 'Miami, FL', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 2900, liters7d: 22100, esgScore: 85, alerts: [] },
  { id: 'site_nyc_01', name: 'NYC Greywater Pilot', type: 'GREYWATER', lat: 40.71, lng: -74.01, region: 'New York, NY', status: 'PLANNED', lastUpdateISO: '2026-02-20T00:00:00Z', litersToday: 0, liters7d: 0, esgScore: 0, alerts: [] },
  { id: 'site_detroit_01', name: 'Detroit Community AWG', type: 'AWG', lat: 42.33, lng: -83.05, region: 'Detroit, MI', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:15:00Z', litersToday: 3100, liters7d: 21700, waterQuality: { tds: 47, uvStatus: 'OK' }, esgScore: 89, alerts: [] },
  { id: 'site_seattle_01', name: 'Seattle Rain Grid', type: 'RAIN', lat: 47.61, lng: -122.33, region: 'Seattle, WA', status: 'ACTIVE', lastUpdateISO: '2026-02-25T09:45:00Z', litersToday: 3800, liters7d: 26600, esgScore: 90, alerts: [] },
  { id: 'site_vegas_01', name: 'Las Vegas AWG Desert', type: 'AWG', lat: 36.17, lng: -115.14, region: 'Las Vegas, NV', status: 'ACTIVE', lastUpdateISO: '2026-02-25T11:00:00Z', litersToday: 5400, liters7d: 37800, waterQuality: { tds: 35, uvStatus: 'OK' }, esgScore: 93, alerts: [] },
  // ── Europe ────────
  { id: 'site_zurich_01', name: 'Zurich Utility Partner', type: 'UTILITY', lat: 47.38, lng: 8.54, region: 'Zurich, CH', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 0, liters7d: 0, energyKwhToday: 1240, esgScore: 97, alerts: [] },
  { id: 'site_london_01', name: 'London Greywater Pilot', type: 'GREYWATER', lat: 51.51, lng: -0.13, region: 'London, UK', status: 'ACTIVE', lastUpdateISO: '2026-02-25T09:00:00Z', litersToday: 2800, liters7d: 19600, esgScore: 86, alerts: [] },
  { id: 'site_barcelona_01', name: 'Barcelona AWG Med', type: 'AWG', lat: 41.39, lng: 2.17, region: 'Barcelona, ES', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:30:00Z', litersToday: 4500, liters7d: 31500, waterQuality: { tds: 40, uvStatus: 'OK' }, esgScore: 92, alerts: [] },
  { id: 'site_amsterdam_01', name: 'Amsterdam Rain Hub', type: 'RAIN', lat: 52.37, lng: 4.90, region: 'Amsterdam, NL', status: 'ACTIVE', lastUpdateISO: '2026-02-25T08:30:00Z', litersToday: 1900, liters7d: 13300, esgScore: 88, alerts: [] },
  { id: 'site_berlin_01', name: 'Berlin Emergency Unit', type: 'EMERGENCY', lat: 52.52, lng: 13.41, region: 'Berlin, DE', status: 'OFFLINE', lastUpdateISO: '2026-02-22T18:00:00Z', litersToday: 0, liters7d: 4200, esgScore: 60, alerts: [{ level: 'CRIT', message: 'Unit offline — power supply failure', timeISO: '2026-02-22T18:00:00Z' }] },
  { id: 'site_oslo_01', name: 'Oslo Rain Harvest', type: 'RAIN', lat: 59.91, lng: 10.75, region: 'Oslo, NO', status: 'ACTIVE', lastUpdateISO: '2026-02-25T07:00:00Z', litersToday: 1400, liters7d: 9800, esgScore: 91, alerts: [] },
  // ── Africa ────────
  { id: 'site_nairobi_01', name: 'Nairobi AWG Station', type: 'AWG', lat: -1.29, lng: 36.82, region: 'Nairobi, KE', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 8200, liters7d: 57400, waterQuality: { tds: 50, uvStatus: 'OK' }, esgScore: 95, wtrMintedBatchIds: ['batch_wtr_004'], alerts: [] },
  { id: 'site_capetown_01', name: 'Cape Town Emergency', type: 'EMERGENCY', lat: -33.93, lng: 18.42, region: 'Cape Town, ZA', status: 'ACTIVE', lastUpdateISO: '2026-02-25T09:00:00Z', litersToday: 5100, liters7d: 35700, esgScore: 88, alerts: [] },
  { id: 'site_lagos_01', name: 'Lagos Community AWG', type: 'AWG', lat: 6.52, lng: 3.38, region: 'Lagos, NG', status: 'ACTIVE', lastUpdateISO: '2026-02-25T08:00:00Z', litersToday: 6700, liters7d: 46900, waterQuality: { tds: 58, uvStatus: 'OK' }, esgScore: 90, alerts: [] },
  // ── Asia / Pacific ─
  { id: 'site_tokyo_01', name: 'Tokyo Utility Grid', type: 'UTILITY', lat: 35.68, lng: 139.69, region: 'Tokyo, JP', status: 'ACTIVE', lastUpdateISO: '2026-02-25T11:00:00Z', litersToday: 0, liters7d: 0, energyKwhToday: 2100, esgScore: 98, alerts: [] },
  { id: 'site_mumbai_01', name: 'Mumbai AWG Delta', type: 'AWG', lat: 19.08, lng: 72.88, region: 'Mumbai, IN', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 7200, liters7d: 50400, waterQuality: { tds: 62, uvStatus: 'OK' }, esgScore: 86, alerts: [] },
  { id: 'site_sydney_01', name: 'Sydney Rain Network', type: 'RAIN', lat: -33.87, lng: 151.21, region: 'Sydney, AU', status: 'ACTIVE', lastUpdateISO: '2026-02-25T09:00:00Z', litersToday: 2600, liters7d: 18200, esgScore: 93, alerts: [] },
  { id: 'site_singapore_01', name: 'Singapore Greywater', type: 'GREYWATER', lat: 1.35, lng: 103.82, region: 'Singapore, SG', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:30:00Z', litersToday: 3500, liters7d: 24500, esgScore: 95, alerts: [] },
  { id: 'site_jakarta_01', name: 'Jakarta Emergency AWG', type: 'AWG', lat: -6.21, lng: 106.85, region: 'Jakarta, ID', status: 'MAINTENANCE', lastUpdateISO: '2026-02-24T18:00:00Z', litersToday: 800, liters7d: 28000, waterQuality: { tds: 70, uvStatus: 'WARN' }, esgScore: 75, alerts: [{ level: 'WARN', message: 'Filter replacement overdue', timeISO: '2026-02-24T18:00:00Z' }] },
  { id: 'site_dubai_01', name: 'Dubai AWG Premium', type: 'AWG', lat: 25.20, lng: 55.27, region: 'Dubai, AE', status: 'ACTIVE', lastUpdateISO: '2026-02-25T11:00:00Z', litersToday: 9500, liters7d: 66500, waterQuality: { tds: 25, uvStatus: 'OK' }, esgScore: 99, wtrMintedBatchIds: ['batch_wtr_005', 'batch_wtr_006'], alerts: [] },
  // ── Americas (South) ─
  { id: 'site_saopaulo_01', name: 'Sao Paulo Greywater', type: 'GREYWATER', lat: -23.55, lng: -46.63, region: 'Sao Paulo, BR', status: 'ACTIVE', lastUpdateISO: '2026-02-25T08:00:00Z', litersToday: 3200, liters7d: 22400, esgScore: 84, alerts: [] },
  { id: 'site_lima_01', name: 'Lima AWG Andes', type: 'AWG', lat: -12.05, lng: -77.04, region: 'Lima, PE', status: 'ACTIVE', lastUpdateISO: '2026-02-25T07:00:00Z', litersToday: 4800, liters7d: 33600, waterQuality: { tds: 44, uvStatus: 'OK' }, esgScore: 88, alerts: [] },
  { id: 'site_bogota_01', name: 'Bogota Rain Harvest', type: 'RAIN', lat: 4.71, lng: -74.07, region: 'Bogota, CO', status: 'ACTIVE', lastUpdateISO: '2026-02-25T06:00:00Z', litersToday: 2100, liters7d: 14700, esgScore: 83, alerts: [] },
  // ── Islands ────────
  { id: 'site_fiji_01', name: 'Fiji Island AWG', type: 'AWG', lat: -17.77, lng: 177.95, region: 'Suva, FJ', status: 'ACTIVE', lastUpdateISO: '2026-02-25T10:00:00Z', litersToday: 6800, liters7d: 47600, waterQuality: { tds: 32, uvStatus: 'OK' }, esgScore: 96, alerts: [] },
  { id: 'site_bermuda_01', name: 'Bermuda Rain Pilot', type: 'RAIN', lat: 32.30, lng: -64.78, region: 'Bermuda', status: 'PLANNED', lastUpdateISO: '2026-02-15T00:00:00Z', litersToday: 0, liters7d: 0, esgScore: 0, alerts: [] },
  { id: 'site_iceland_01', name: 'Reykjavik Geo-Utility', type: 'UTILITY', lat: 64.14, lng: -21.94, region: 'Reykjavik, IS', status: 'ACTIVE', lastUpdateISO: '2026-02-25T06:00:00Z', litersToday: 0, liters7d: 0, energyKwhToday: 3200, esgScore: 99, alerts: [] },
  // ── Space (planned) ─
  { id: 'site_orbital_01', name: 'Nexus Orbital Alpha', type: 'SPACE', lat: 28.57, lng: -80.65, region: 'LEO (Kennedy)', status: 'PLANNED', lastUpdateISO: '2026-01-01T00:00:00Z', litersToday: 0, liters7d: 0, esgScore: 0, alerts: [] },
  { id: 'site_lunar_01', name: 'Nexus Lunar Base', type: 'SPACE', lat: -0.67, lng: 23.47, region: 'Moon (Tranquility)', status: 'PLANNED', lastUpdateISO: '2026-01-01T00:00:00Z', litersToday: 0, liters7d: 0, esgScore: 0, alerts: [] },
  { id: 'site_mars_01', name: 'Nexus Mars Outpost', type: 'SPACE', lat: 4.59, lng: -137.44, region: 'Mars (Jezero)', status: 'PLANNED', lastUpdateISO: '2026-01-01T00:00:00Z', litersToday: 0, liters7d: 0, esgScore: 0, alerts: [] },
];

// ─── Procedural Generation Seed Data ─────────────────────

const REGION_CLUSTERS: { region: string; lat: number; lng: number; spread: number; weight: number }[] = [
  // Africa — high water scarcity
  { region: 'Sub-Saharan Africa', lat: 0, lng: 25, spread: 20, weight: 3 },
  { region: 'North Africa', lat: 30, lng: 10, spread: 12, weight: 1.5 },
  { region: 'East Africa', lat: -5, lng: 38, spread: 8, weight: 2 },
  { region: 'West Africa', lat: 10, lng: -5, spread: 10, weight: 2 },
  // Asia
  { region: 'South Asia', lat: 22, lng: 78, spread: 12, weight: 3 },
  { region: 'Southeast Asia', lat: 5, lng: 110, spread: 15, weight: 2.5 },
  { region: 'Central Asia', lat: 42, lng: 65, spread: 10, weight: 1 },
  { region: 'East Asia', lat: 35, lng: 120, spread: 10, weight: 2 },
  // Americas
  { region: 'Central America', lat: 15, lng: -88, spread: 8, weight: 1.5 },
  { region: 'Andes', lat: -15, lng: -70, spread: 12, weight: 1.5 },
  { region: 'Caribbean', lat: 18, lng: -72, spread: 6, weight: 1 },
  { region: 'US Southwest', lat: 34, lng: -112, spread: 6, weight: 2 },
  { region: 'US Midwest', lat: 40, lng: -90, spread: 8, weight: 1 },
  // Europe
  { region: 'Mediterranean', lat: 38, lng: 15, spread: 12, weight: 1.5 },
  { region: 'Northern Europe', lat: 58, lng: 15, spread: 8, weight: 1 },
  { region: 'Eastern Europe', lat: 50, lng: 25, spread: 8, weight: 1 },
  // Middle East
  { region: 'Gulf States', lat: 24, lng: 50, spread: 6, weight: 2 },
  { region: 'Levant', lat: 33, lng: 36, spread: 5, weight: 1.5 },
  // Oceania
  { region: 'Pacific Islands', lat: -15, lng: 170, spread: 15, weight: 1.5 },
  { region: 'Australia', lat: -28, lng: 135, spread: 12, weight: 1 },
];

const SITE_TYPES: NexusSiteType[] = ['AWG', 'AWG', 'AWG', 'GREYWATER', 'GREYWATER', 'RAIN', 'RAIN', 'UTILITY', 'EMERGENCY'];
const STATUSES: NexusSite['status'][] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'MAINTENANCE', 'PLANNED', 'OFFLINE'];
const PREFIXES: Record<NexusSiteType, string[]> = {
  AWG: ['AWG', 'Atmospheric', 'Fog Collector', 'Desert AWG', 'Coastal AWG', 'Community AWG', 'Solar AWG', 'Micro AWG'],
  GREYWATER: ['Greywater', 'Recycling Hub', 'Water Reclaim', 'Treatment', 'Filtration'],
  RAIN: ['Rain Harvest', 'Rainwater', 'Cistern', 'Catchment', 'Monsoon Collect'],
  UTILITY: ['Solar Array', 'Wind Farm', 'Micro Grid', 'Utility Hub', 'Energy Station'],
  EMERGENCY: ['Emergency Deploy', 'Crisis Unit', 'Rapid Response', 'Disaster Relief', 'Field Station'],
  SPACE: ['Orbital', 'Lunar Base', 'Mars Station'],
};

const ALERT_MESSAGES: Record<string, string[]> = {
  WARN: [
    'Filter replacement overdue',
    'UV lamp approaching end-of-life',
    'TDS reading above threshold',
    'Pump efficiency degraded 15%',
    'Humidity sensor calibration needed',
    'Solar panel output below expected',
  ],
  CRIT: [
    'Unit offline — power supply failure',
    'Water quality critical — TDS > 500 ppm',
    'Connection lost — last ping 6h ago',
    'Flood sensor triggered',
  ],
};

function generateGlobeSites(targetCount: number): NexusSite[] {
  const rng = mulberry32(42); // Deterministic seed
  const toGenerate = targetCount - HAND_CRAFTED_SITES.length;
  if (toGenerate <= 0) return [];

  // Build weighted region list
  const weightedRegions: typeof REGION_CLUSTERS = [];
  for (const cluster of REGION_CLUSTERS) {
    const count = Math.ceil(cluster.weight);
    for (let i = 0; i < count; i++) weightedRegions.push(cluster);
  }

  const generated: NexusSite[] = [];

  for (let i = 0; i < toGenerate; i++) {
    // Pick a cluster
    const cluster = weightedRegions[Math.floor(rng() * weightedRegions.length)];
    const lat = cluster.lat + (rng() - 0.5) * cluster.spread * 2;
    const lng = cluster.lng + (rng() - 0.5) * cluster.spread * 2;
    // Clamp latitude
    const clampedLat = Math.max(-70, Math.min(70, lat));

    const type = SITE_TYPES[Math.floor(rng() * SITE_TYPES.length)];
    const status = STATUSES[Math.floor(rng() * STATUSES.length)];
    const prefixes = PREFIXES[type];
    const prefix = prefixes[Math.floor(rng() * prefixes.length)];
    const siteNum = String(i + 100).padStart(3, '0');
    const id = `site_gen_${siteNum}`;
    const name = `${cluster.region} ${prefix} ${siteNum}`;

    const isActive = status === 'ACTIVE';
    const isWater = ['AWG', 'GREYWATER', 'RAIN'].includes(type);
    const isEnergy = type === 'UTILITY';

    const litersToday = isActive && isWater ? Math.floor(rng() * 9000 + 500) : 0;
    const liters7d = litersToday > 0 ? litersToday * Math.floor(rng() * 4 + 5) : 0;
    const energyKwhToday = isActive && isEnergy ? Math.floor(rng() * 3000 + 200) : undefined;
    const esgScore = status === 'PLANNED' ? 0 : Math.floor(rng() * 30 + 65);

    // Water quality for water sites
    const waterQuality = isWater && isActive
      ? { tds: Math.floor(rng() * 70 + 20), uvStatus: rng() > 0.12 ? 'OK' as const : 'WARN' as const }
      : undefined;

    // Random WTR batches for active water sites
    const wtrMintedBatchIds = isActive && isWater && rng() > 0.6
      ? [`batch_gen_wtr_${siteNum}`]
      : undefined;

    const engMintedBatchIds = isActive && isEnergy && rng() > 0.5
      ? [`batch_gen_eng_${siteNum}`]
      : undefined;

    // Alerts
    const alerts: NexusSite['alerts'] = [];
    if (status === 'MAINTENANCE' && rng() > 0.3) {
      const msgs = ALERT_MESSAGES.WARN;
      alerts.push({ level: 'WARN', message: msgs[Math.floor(rng() * msgs.length)], timeISO: '2026-02-24T12:00:00Z' });
    }
    if (status === 'OFFLINE' && rng() > 0.2) {
      const msgs = ALERT_MESSAGES.CRIT;
      alerts.push({ level: 'CRIT', message: msgs[Math.floor(rng() * msgs.length)], timeISO: '2026-02-23T08:00:00Z' });
    }

    // Day offset for lastUpdateISO
    const hoursAgo = status === 'PLANNED' ? 720 : Math.floor(rng() * 48);
    const updateDate = new Date(Date.now() - hoursAgo * 3600 * 1000);

    generated.push({
      id,
      name,
      type,
      lat: clampedLat,
      lng,
      region: cluster.region,
      status,
      lastUpdateISO: updateDate.toISOString(),
      litersToday,
      liters7d,
      waterQuality,
      energyKwhToday,
      wtrMintedBatchIds,
      engMintedBatchIds,
      esgScore,
      alerts,
    });
  }

  return generated;
}

// ─── Combined Sites (40 hand-crafted + 460 generated = 500) ──
export const MOCK_SITES: NexusSite[] = [
  ...HAND_CRAFTED_SITES,
  ...generateGlobeSites(500),
];

// ─── Mock Batches ────────────────────────────────────────

export const MOCK_BATCHES: MintBatch[] = [
  { id: 'batch_wtr_001', ticker: 'WTR', amount: 5000, mintedISO: '2026-02-20T12:00:00Z', installation: 'site_phoenix_01', location: 'Phoenix, AZ', region: 'US-SW', retirementMonths: 12 },
  { id: 'batch_wtr_002', ticker: 'WTR', amount: 8000, mintedISO: '2026-02-18T10:00:00Z', installation: 'site_maui_01', location: 'Maui, HI', region: 'US-HI', retirementMonths: 12 },
  { id: 'batch_wtr_003', ticker: 'WTR', amount: 3500, mintedISO: '2026-02-22T14:00:00Z', installation: 'site_maui_01', location: 'Maui, HI', region: 'US-HI', retirementMonths: 12 },
  { id: 'batch_wtr_004', ticker: 'WTR', amount: 12000, mintedISO: '2026-02-24T08:00:00Z', installation: 'site_nairobi_01', location: 'Nairobi, KE', region: 'AF-EA', retirementMonths: 12 },
  { id: 'batch_wtr_005', ticker: 'WTR', amount: 9000, mintedISO: '2026-02-23T16:00:00Z', installation: 'site_dubai_01', location: 'Dubai, AE', region: 'ME', retirementMonths: 12 },
  { id: 'batch_wtr_006', ticker: 'WTR', amount: 6500, mintedISO: '2026-02-25T06:00:00Z', installation: 'site_dubai_01', location: 'Dubai, AE', region: 'ME', retirementMonths: 12 },
  { id: 'batch_eng_001', ticker: 'ENG', amount: 4200, mintedISO: '2026-02-21T09:00:00Z', installation: 'site_denver_01', location: 'Denver, CO', region: 'US-MT', retirementMonths: 12 },
];

// ─── Mock Activity Events ────────────────────────────────

export const MOCK_EVENTS: ActivityEvent[] = [
  { id: 'evt_001', type: 'iot_reading', siteId: 'site_dubai_01', siteName: 'Dubai AWG Premium', message: 'Produced 950 L in last hour — peak output', timeISO: '2026-02-25T11:00:00Z' },
  { id: 'evt_002', type: 'batch_mint', siteId: 'site_dubai_01', siteName: 'Dubai AWG Premium', message: 'Minted 6,500 WTR (batch_wtr_006)', timeISO: '2026-02-25T06:00:00Z' },
  { id: 'evt_003', type: 'alert', siteId: 'site_berlin_01', siteName: 'Berlin Emergency Unit', message: 'CRITICAL: Unit offline — power supply failure', timeISO: '2026-02-22T18:00:00Z', level: 'CRIT' },
  { id: 'evt_004', type: 'iot_reading', siteId: 'site_nairobi_01', siteName: 'Nairobi AWG Station', message: 'Daily output 8,200 L — new record for this site', timeISO: '2026-02-25T10:00:00Z' },
  { id: 'evt_005', type: 'batch_mint', siteId: 'site_nairobi_01', siteName: 'Nairobi AWG Station', message: 'Minted 12,000 WTR (batch_wtr_004)', timeISO: '2026-02-24T08:00:00Z' },
  { id: 'evt_006', type: 'alert', siteId: 'site_portland_01', siteName: 'Portland Rain Harvest', message: 'UV lamp approaching end-of-life — schedule replacement', timeISO: '2026-02-25T08:00:00Z', level: 'WARN' },
  { id: 'evt_007', type: 'status_change', siteId: 'site_jakarta_01', siteName: 'Jakarta Emergency AWG', message: 'Status changed to MAINTENANCE — filter replacement', timeISO: '2026-02-24T18:00:00Z', level: 'WARN' },
  { id: 'evt_008', type: 'iot_reading', siteId: 'site_maui_01', siteName: 'Maui AWG Station', message: 'Water quality TDS: 30 ppm — excellent', timeISO: '2026-02-25T11:15:00Z' },
  { id: 'evt_009', type: 'batch_mint', siteId: 'site_denver_01', siteName: 'Denver Solar Array', message: 'Minted 4,200 ENG (batch_eng_001)', timeISO: '2026-02-21T09:00:00Z' },
  { id: 'evt_010', type: 'iot_reading', siteId: 'site_phoenix_01', siteName: 'Phoenix AWG Alpha', message: 'Humidity sensor optimal at 62% — max efficiency', timeISO: '2026-02-25T11:00:00Z' },
];

// ─── API shim (swap body for real fetch later) ───────────

export async function fetchSites(): Promise<NexusSite[]> {
  // TODO: Replace with real API call: fetch(`${API}/map/sites`)
  await new Promise(r => setTimeout(r, 300));
  return MOCK_SITES;
}

export async function fetchEvents(): Promise<ActivityEvent[]> {
  await new Promise(r => setTimeout(r, 200));
  return MOCK_EVENTS;
}
