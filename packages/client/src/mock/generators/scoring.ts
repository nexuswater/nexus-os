/**
 * Mock data generators for the Nexus Home & Facility Scoring system.
 * Generates: Subjects, BillSummaries, IoTSummaries, Scores, Certificates,
 * MarketplaceProducts, RegionBenchmarks, LeaderboardEntries.
 */

import type { Rng } from '../seed';
import { pick, randInt, randFloat, round, uuid, hexId, daysAgo, monthsAgo, chance } from '../seed';
import type {
  Subject, SubjectKind, SubjectScore, Certificate, ScoreTier,
  MarketplaceProduct, ProductCategory, RegionBenchmark, LeaderboardEntry,
  BillSummary, IoTSummary, ScoreDomain,
} from '@nexus/shared';
import { calculateScore, DEFAULT_RUBRICS } from '@nexus/shared';

// ─── Subject Generator ──────────────────────────────────

const STREET_NAMES = [
  'Oak Lane', 'Maple Drive', 'Cedar Avenue', 'Pine Street', 'Elm Court',
  'Birch Boulevard', 'Willow Way', 'Aspen Place', 'Spruce Circle', 'Sequoia Road',
  'Mesa Verde Dr', 'Riverside Blvd', 'Canyon Creek Rd', 'Desert Bloom Ave', 'Harbor View Ln',
];

const CITY_STATE_MAP: { city: string; state: string; region: string; country: string }[] = [
  { city: 'Phoenix', state: 'AZ', region: 'US-AZ', country: 'US' },
  { city: 'Austin', state: 'TX', region: 'US-TX', country: 'US' },
  { city: 'Denver', state: 'CO', region: 'US-CO', country: 'US' },
  { city: 'Portland', state: 'OR', region: 'US-OR', country: 'US' },
  { city: 'San Diego', state: 'CA', region: 'US-CA', country: 'US' },
  { city: 'Miami', state: 'FL', region: 'US-FL', country: 'US' },
  { city: 'Las Vegas', state: 'NV', region: 'US-NV', country: 'US' },
  { city: 'Honolulu', state: 'HI', region: 'US-HI', country: 'US' },
  { city: 'Nairobi', state: 'NBI', region: 'KE-NBI', country: 'KE' },
  { city: 'Cape Town', state: 'WC', region: 'ZA-CPT', country: 'ZA' },
  { city: 'Barcelona', state: 'CT', region: 'ES-BCN', country: 'ES' },
  { city: 'Amsterdam', state: 'NH', region: 'NL-AMS', country: 'NL' },
  { city: 'Sydney', state: 'NSW', region: 'AU-SYD', country: 'AU' },
  { city: 'Dubai', state: 'DXB', region: 'AE-DXB', country: 'AE' },
  { city: 'Singapore', state: 'SG', region: 'SG-SIN', country: 'SG' },
];

const RES_NAMES = [
  'Sunridge Residence', 'Desert Oasis Home', 'Lakewood Estate', 'Green Valley House',
  'Pacific View Condo', 'Mountain Crest Home', 'Coral Springs Villa', 'Pine Ridge Cabin',
  'River Bend Cottage', 'Skyline Penthouse', 'Mesa Gardens', 'Cedar Falls House',
  'Bayside Bungalow', 'Sunset Hills Home', 'Terra Nova Residence',
];

const COMM_NAMES = [
  'Nexus Innovation Hub', 'WaterTech Office Park', 'SolarEdge Data Center',
  'GreenLeaf Distribution', 'AquaPure Processing', 'EcoGrid Campus',
  'HydroFlow Warehouse', 'CleanStar Manufacturing', 'TerraVault Labs',
  'OceanView Business Center',
];

export function generateSubjects(rng: Rng): Subject[] {
  const subjects: Subject[] = [];

  // 15 residential + 10 commercial
  for (let i = 0; i < 25; i++) {
    const kind: SubjectKind = i < 15 ? 'RESIDENTIAL' : (i < 22 ? 'COMMERCIAL' : 'INDUSTRIAL');
    const loc = pick(rng, CITY_STATE_MAP);
    const street = pick(rng, STREET_NAMES);
    const names = kind === 'RESIDENTIAL' ? RES_NAMES : COMM_NAMES;

    subjects.push({
      id: `subj-${hexId(rng, 8)}`,
      ownerId: `user-${hexId(rng, 6)}`,
      kind,
      name: pick(rng, names),
      address: {
        line1: `${randInt(rng, 100, 9999)} ${street}`,
        city: loc.city,
        state: loc.state,
        postalCode: String(randInt(rng, 10000, 99999)),
        country: loc.country,
        regionCode: loc.region,
      },
      sqft: kind === 'RESIDENTIAL'
        ? randInt(rng, 800, 4000)
        : randInt(rng, 5000, 50000),
      yearBuilt: randInt(rng, 1970, 2024),
      occupants: kind === 'RESIDENTIAL'
        ? randInt(rng, 1, 6)
        : randInt(rng, 10, 200),
      status: chance(rng, 0.9) ? 'ACTIVE' : 'PENDING',
      tags: kind === 'RESIDENTIAL'
        ? ['single-family', 'suburban']
        : ['office', 'tech'],
      createdAt: monthsAgo(randInt(rng, 3, 18)),
      updatedAt: daysAgo(randInt(rng, 0, 30)),
    });
  }

  return subjects;
}

// ─── Bill Summaries Generator ───────────────────────────

export function generateBillSummaries(rng: Rng, subjectId: string, kind: SubjectKind): BillSummary[] {
  const bills: BillSummary[] = [];
  const months = randInt(rng, 6, 18);
  const isResidential = kind === 'RESIDENTIAL';

  for (let m = 0; m < months; m++) {
    // Water bill
    const waterUsage = isResidential
      ? randFloat(rng, 2000, 8000) // gallons/month
      : randFloat(rng, 10000, 80000);

    bills.push({
      billId: `bill-w-${hexId(rng, 6)}`,
      type: 'WATER',
      periodStart: monthsAgo(m + 1),
      periodEnd: monthsAgo(m),
      usageValue: round(waterUsage),
      usageUnit: 'gallons',
      amountUSD: round(waterUsage * randFloat(rng, 0.003, 0.008)),
      verified: chance(rng, 0.7),
      fraudScore: randInt(rng, 0, chance(rng, 0.1) ? 80 : 30),
    });

    // Energy bill
    const energyUsage = isResidential
      ? randFloat(rng, 500, 2000) // kWh/month
      : randFloat(rng, 5000, 50000);

    bills.push({
      billId: `bill-e-${hexId(rng, 6)}`,
      type: 'ENERGY',
      periodStart: monthsAgo(m + 1),
      periodEnd: monthsAgo(m),
      usageValue: round(energyUsage),
      usageUnit: 'kWh',
      amountUSD: round(energyUsage * randFloat(rng, 0.08, 0.18)),
      verified: chance(rng, 0.65),
      fraudScore: randInt(rng, 0, chance(rng, 0.08) ? 75 : 25),
    });
  }

  return bills;
}

// ─── IoT Summaries Generator ────────────────────────────

const IOT_TYPES = ['AWG', 'SOLAR_FARM', 'WATER_METER', 'ENERGY_METER', 'GREYWATER_RECYCLING', 'SMART_METER'];

export function generateIoTSummaries(rng: Rng, _subjectId: string): IoTSummary[] {
  const count = randInt(rng, 0, 5);
  const devices: IoTSummary[] = [];

  for (let i = 0; i < count; i++) {
    const type = pick(rng, IOT_TYPES);
    devices.push({
      deviceId: `iot-${hexId(rng, 6)}`,
      type,
      lastReading: randFloat(rng, 10, 500),
      unit: type.includes('WATER') || type === 'AWG' || type === 'GREYWATER_RECYCLING' ? 'gallons' : 'kWh',
      readingsLast30d: randInt(rng, 20, 720),
      anomalyCount: randInt(rng, 0, chance(rng, 0.15) ? 10 : 2),
      verified: chance(rng, 0.75),
    });
  }

  return devices;
}

// ─── Full Score Generation ──────────────────────────────

export interface ScoredSubject {
  subject: Subject;
  bills: BillSummary[];
  devices: IoTSummary[];
  score: SubjectScore;
}

export function generateScoredSubjects(rng: Rng): ScoredSubject[] {
  const subjects = generateSubjects(rng);
  const scored: ScoredSubject[] = [];

  for (const subject of subjects) {
    const bills = generateBillSummaries(rng, subject.id, subject.kind);
    const devices = generateIoTSummaries(rng, subject.id);
    const rubric = DEFAULT_RUBRICS[subject.kind] ?? DEFAULT_RUBRICS['RESIDENTIAL'];

    const score = calculateScore(rubric, {
      subject,
      bills,
      iotDevices: devices,
      meta: {
        renewableSources: randInt(rng, 0, 3),
        alternateSources: randInt(rng, 0, 4),
        demandResponsePrograms: subject.kind !== 'RESIDENTIAL' ? randInt(rng, 0, 3) : 0,
      },
    });

    scored.push({ subject, bills, devices, score });
  }

  return scored;
}

// ─── Certificate Generator ──────────────────────────────

export function generateCertificates(rng: Rng, scoredSubjects: ScoredSubject[]): Certificate[] {
  return scoredSubjects
    .filter(s => s.score.tier !== 'UNRATED')
    .map(s => ({
      id: `cert-${hexId(rng, 8)}`,
      subjectId: s.subject.id,
      subjectName: s.subject.name,
      scoreId: s.score.id,
      overallScore: s.score.overallScore,
      tier: s.score.tier,
      domains: s.score.domains.map(d => ({ domain: d.domain, score: d.score })),
      issuedAt: s.score.calculatedAt,
      expiresAt: s.score.expiresAt,
      status: 'ACTIVE' as const,
      verificationHash: hexId(rng, 32),
      verificationUrl: `https://nexus.os/verify/cert-${hexId(rng, 8)}`,
      issuerName: 'Nexus Water DAO',
      txHash: `0x${hexId(rng, 64)}`,
    }));
}

// ─── Marketplace Products Generator ─────────────────────

const PRODUCTS: { name: string; cat: ProductCategory; domain: ScoreDomain; desc: string }[] = [
  { name: 'SunPower M-Series 440W Panel', cat: 'SOLAR', domain: 'ENERGY', desc: 'High-efficiency monocrystalline solar panel with 22.8% cell efficiency.' },
  { name: 'Enphase IQ8+ Microinverter', cat: 'SOLAR', domain: 'ENERGY', desc: 'Grid-forming microinverter with sunlight backup capability.' },
  { name: 'Tesla Powerwall 3', cat: 'BATTERY', domain: 'RESILIENCE', desc: '13.5 kWh home battery with integrated inverter and solar coupling.' },
  { name: 'Berkey Royal Water Filter', cat: 'WATER_FILTER', domain: 'WATER', desc: 'Gravity-fed water purification system removing 99.9% of contaminants.' },
  { name: 'Watergen GEN-M AWG', cat: 'AWG', domain: 'WATER', desc: 'Atmospheric water generator producing up to 800L/day from humidity.' },
  { name: 'Sense Home Energy Monitor', cat: 'SMART_METER', domain: 'ENERGY', desc: 'AI-powered energy monitor that identifies device-level consumption.' },
  { name: 'Rachio 3 Smart Sprinkler', cat: 'SMART_METER', domain: 'WATER', desc: 'Weather-intelligent irrigation controller reducing water waste by 50%.' },
  { name: 'Aeroseal Duct Sealing', cat: 'INSULATION', domain: 'ENERGY', desc: 'Patented duct sealing technology reducing HVAC energy loss by 30%.' },
  { name: 'Mitsubishi Hyper-Heat HVAC', cat: 'HVAC', domain: 'ENERGY', desc: 'Cold-climate heat pump operating efficiently down to -13F.' },
  { name: 'AquaPure Greywater System', cat: 'WATER_FILTER', domain: 'WATER', desc: 'Residential greywater recycling system for irrigation and toilet flushing.' },
  { name: 'EcoFlow Delta Pro Ultra', cat: 'BATTERY', domain: 'RESILIENCE', desc: '6kWh portable power station with home integration panel.' },
  { name: 'Rain Harvest Pro 500', cat: 'AWG', domain: 'WATER', desc: 'Residential rainwater collection and filtration system (500 gal capacity).' },
];

export function generateProducts(rng: Rng): MarketplaceProduct[] {
  return PRODUCTS.map((p, i) => ({
    id: `prod-${hexId(rng, 6)}`,
    name: p.name,
    description: p.desc,
    category: p.cat,
    manufacturer: p.name.split(' ')[0],
    model: p.name.split(' ').slice(1).join(' '),
    priceUSD: round(randFloat(rng, 99, 8000)),
    currency: 'USD',
    imageUrl: `/assets/products/${p.cat.toLowerCase()}.png`,
    domains: [p.domain],
    estimatedScoreImpact: randInt(rng, 3, 15),
    energySavingsKwh: p.domain === 'ENERGY' ? randInt(rng, 500, 5000) : undefined,
    waterSavingsGal: p.domain === 'WATER' ? randInt(rng, 1000, 20000) : undefined,
    installationDifficulty: pick(rng, ['easy', 'moderate', 'professional'] as const),
    certifications: pick(rng, [
      ['ENERGY STAR'], ['WaterSense'], ['UL Listed'], ['ENERGY STAR', 'UL Listed'],
      ['ISO 14001'], ['LEED Compatible'],
    ]),
    rating: round(randFloat(rng, 3.5, 5.0), 1),
    reviewCount: randInt(rng, 12, 850),
    status: 'AVAILABLE' as const,
    vendorId: `vendor-${hexId(rng, 4)}`,
    vendorName: pick(rng, ['NexusGreen Supply', 'EcoTech Direct', 'SustainableHome.io', 'CleanGrid Store']),
    createdAt: monthsAgo(randInt(rng, 1, 12)),
  }));
}

// ─── Region Benchmarks Generator ────────────────────────

export function generateRegionBenchmarks(rng: Rng, scoredSubjects: ScoredSubject[]): RegionBenchmark[] {
  const regionMap = new Map<string, ScoredSubject[]>();

  for (const s of scoredSubjects) {
    const region = s.subject.address.regionCode;
    if (!regionMap.has(region)) regionMap.set(region, []);
    regionMap.get(region)!.push(s);
  }

  const benchmarks: RegionBenchmark[] = [];

  for (const [regionCode, subjects] of regionMap) {
    const loc = CITY_STATE_MAP.find(l => l.region === regionCode);
    const avg = (domain: ScoreDomain) => {
      const scores = subjects.map(s => s.score.domains.find(d => d.domain === domain)?.score ?? 0);
      return scores.length > 0 ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    };

    benchmarks.push({
      regionCode,
      regionName: loc?.city ?? regionCode,
      country: loc?.country ?? '',
      avgWaterScore: avg('WATER'),
      avgEnergyScore: avg('ENERGY'),
      avgGovernanceScore: avg('GOVERNANCE'),
      avgResilienceScore: avg('RESILIENCE'),
      avgOverallScore: round(subjects.reduce((s, x) => s + x.score.overallScore, 0) / subjects.length),
      totalSubjects: subjects.length,
      certifiedCount: subjects.filter(s => s.score.tier !== 'UNRATED').length,
      topTier: getBestTier(subjects.map(s => s.score.tier)),
      updatedAt: new Date().toISOString(),
    });
  }

  return benchmarks;
}

function getBestTier(tiers: ScoreTier[]): ScoreTier {
  const order: ScoreTier[] = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'UNRATED'];
  for (const t of order) {
    if (tiers.includes(t)) return t;
  }
  return 'UNRATED';
}

// ─── Leaderboard Generator ──────────────────────────────

export function generateLeaderboard(scoredSubjects: ScoredSubject[]): LeaderboardEntry[] {
  return scoredSubjects
    .sort((a, b) => b.score.overallScore - a.score.overallScore)
    .map((s, i) => ({
      rank: i + 1,
      subjectId: s.subject.id,
      subjectName: s.subject.name,
      ownerName: `Owner ${s.subject.ownerId.slice(-4)}`,
      regionCode: s.subject.address.regionCode,
      overallScore: s.score.overallScore,
      tier: s.score.tier,
      waterScore: s.score.domains.find(d => d.domain === 'WATER')?.score ?? 0,
      energyScore: s.score.domains.find(d => d.domain === 'ENERGY')?.score ?? 0,
      governanceScore: s.score.domains.find(d => d.domain === 'GOVERNANCE')?.score ?? 0,
      resilienceScore: s.score.domains.find(d => d.domain === 'RESILIENCE')?.score ?? 0,
      change30d: Math.round((Math.random() - 0.3) * 10),
      certifiedSince: s.score.tier !== 'UNRATED' ? s.score.calculatedAt : undefined,
    }));
}
