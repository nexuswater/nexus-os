/**
 * readings.ts — Generate hourly (720 = 30d) + daily (365 = 12mo) readings per non-SPACE site.
 * ~3% anomaly injection: spikes 3-5x normal or dropouts to 0.
 * Temperature varies by latitude / region.
 */
import type { Rng } from '../seed';
import { randFloat, randGauss, chance, round, REF } from '../seed';
import type { ExtendedSite, HourlyReading, DailyAggregate } from '../types';

// ─── Helpers ────────────────────────────────────────────

/** Base liters/hr derived from daily capacity (with variance) */
function baseLph(capacity: number, rng: Rng): number {
  return Math.max(1, capacity / 24 + randGauss(rng, 0, capacity * 0.02));
}

/** Regional base temp from latitude (rough climate model) */
function regionTemp(lat: number): number {
  const absLat = Math.abs(lat);
  if (absLat < 10) return 30;        // tropical
  if (absLat < 25) return 27;        // subtropical
  if (absLat < 40) return 20;        // temperate warm
  if (absLat < 55) return 12;        // temperate cool
  return 5;                          // high latitude
}

/** Seasonal temp offset: cooler in winter for northern hemisphere, opposite for south */
function seasonalOffset(lat: number, monthIndex: number): number {
  const isNorth = lat >= 0;
  // months 0-11: Jan=0 ... Dec=11. Summer for north = Jun-Aug (5-7)
  const summerPeak = isNorth ? 6 : 0;
  const delta = Math.cos(((monthIndex - summerPeak) / 6) * Math.PI);
  return delta * 6; // +/- 6 degrees
}

// ─── Generator: Hourly Readings ─────────────────────────

export function generateHourlyReadings(rng: Rng, sites: ExtendedSite[]): HourlyReading[] {
  const readings: HourlyReading[] = [];
  const HOURS = 720; // 30 days

  for (const site of sites) {
    if (site.type === 'SPACE') continue;
    const base = baseLph(site.capacityLitersPerDay, rng);
    const bTemp = regionTemp(site.location.lat);

    for (let h = 0; h < HOURS; h++) {
      const ts = new Date(REF.getTime() - h * 3_600_000).toISOString();
      const monthIdx = new Date(REF.getTime() - h * 3_600_000).getMonth();

      // Diurnal pattern: lower at night (hours 0-5, 22-23 local approx)
      const hourOfDay = (12 - (h % 24) + 24) % 24; // rough local
      const diurnalMul = hourOfDay >= 6 && hourOfDay <= 20 ? 1.0 : 0.4;

      let liters = Math.max(0, randGauss(rng, base * diurnalMul, base * 0.15));
      let anomaly = false;

      // 3% anomaly injection
      if (chance(rng, 0.03)) {
        anomaly = true;
        liters = chance(rng, 0.5) ? liters * randFloat(rng, 3, 5) : 0;
      }

      const tempC = bTemp + seasonalOffset(site.location.lat, monthIdx) + randGauss(rng, 0, 1.5);
      const tds = Math.max(10, randGauss(rng, site.waterQuality.tds, 20));

      readings.push({
        siteId: site.id,
        ts,
        liters: round(liters, 1),
        tds: round(tds),
        tempC: round(tempC, 1),
        anomaly,
      });
    }
  }
  return readings;
}

// ─── Generator: Daily Aggregates ────────────────────────

export function generateDailyAggregates(rng: Rng, sites: ExtendedSite[]): DailyAggregate[] {
  const aggregates: DailyAggregate[] = [];
  const DAYS = 365;

  for (const site of sites) {
    if (site.type === 'SPACE') continue;
    const baseDaily = site.capacityLitersPerDay;
    const bTemp = regionTemp(site.location.lat);

    for (let d = 0; d < DAYS; d++) {
      const dateMs = REF.getTime() - d * 86_400_000;
      const date = new Date(dateMs).toISOString().split('T')[0];
      const monthIdx = new Date(dateMs).getMonth();

      let total = Math.max(0, randGauss(rng, baseDaily, baseDaily * 0.12));
      let anomalyCount = 0;

      // Inject ~3% anomalous days
      if (chance(rng, 0.03)) {
        anomalyCount = 1;
        total = chance(rng, 0.5) ? total * randFloat(rng, 2.5, 4) : total * 0.05;
      }

      const peakHr = total / 24 * randFloat(rng, 1.4, 2.2);
      const avgTds = Math.max(10, randGauss(rng, site.waterQuality.tds, 15));
      const avgTemp = bTemp + seasonalOffset(site.location.lat, monthIdx) + randGauss(rng, 0, 1);

      aggregates.push({
        siteId: site.id,
        date,
        totalLiters: round(total),
        avgTds: round(avgTds),
        avgTempC: round(avgTemp, 1),
        peakLitersHr: round(peakHr, 1),
        anomalyCount,
      });
    }
  }
  return aggregates;
}
