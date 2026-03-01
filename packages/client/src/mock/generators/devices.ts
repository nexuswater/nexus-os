/**
 * devices.ts — Generate 2-4 IoT devices per non-SPACE site.
 * 85% ONLINE, 10% DEGRADED, 5% OFFLINE. Each has FLOW_METER + 2-4 extra sensors.
 */
import type { Rng } from '../seed';
import { randInt, randFloat, pick, pickN, chance, hexId, daysAgo, round, pad } from '../seed';
import type { ExtendedSite, SiteDevice, DeviceStatus, SensorType, DeviceSensor } from '../types';

// ─── Static data ────────────────────────────────────────

const MANUFACTURERS = ['NexusTech', 'AquaSense', 'HydroMetrics', 'WaterPure', 'SolarGrid'] as const;

const MODELS: Record<string, string[]> = {
  NexusTech:    ['NT-200', 'NT-350X', 'NT-500Pro'],
  AquaSense:    ['AS-Flow', 'AS-MultiProbe', 'AS-GateKeeper'],
  HydroMetrics: ['HM-Sentinel', 'HM-Echo', 'HM-Apex'],
  WaterPure:    ['WP-UltraNode', 'WP-NanoSense', 'WP-GridLink'],
  SolarGrid:    ['SG-Helios', 'SG-Ion', 'SG-Pulse'],
};

const FIRMWARE_VERSIONS = ['2.1.0', '2.2.3', '2.3.1', '3.0.0-beta', '3.1.2', '3.2.0'];

const EXTRA_SENSORS: SensorType[] = ['TDS', 'UV', 'TEMP', 'HUMIDITY', 'PH', 'PRESSURE'];

const SENSOR_UNITS: Record<SensorType, string> = {
  FLOW_METER: 'L/hr',
  TDS: 'ppm',
  UV: 'mJ/cm²',
  TEMP: '°C',
  HUMIDITY: '%',
  PH: 'pH',
  PRESSURE: 'kPa',
};

const SENSOR_RANGES: Record<SensorType, [number, number]> = {
  FLOW_METER: [10, 350],
  TDS: [40, 500],
  UV: [20, 80],
  TEMP: [8, 42],
  HUMIDITY: [15, 95],
  PH: [6.0, 8.8],
  PRESSURE: [80, 220],
};

// ─── Generator ──────────────────────────────────────────

export function generateDevices(rng: Rng, sites: ExtendedSite[]): SiteDevice[] {
  const devices: SiteDevice[] = [];
  let counter = 0;

  for (const site of sites) {
    if (site.type === 'SPACE') continue;

    const deviceCount = randInt(rng, 2, 4);
    for (let d = 0; d < deviceCount; d++) {
      counter++;
      const manufacturer = pick(rng, MANUFACTURERS);
      const model = pick(rng, MODELS[manufacturer]);

      // Status distribution: 85% online, 10% degraded, 5% offline
      const roll = rng();
      let status: DeviceStatus = 'ONLINE';
      if (roll > 0.95) status = 'OFFLINE';
      else if (roll > 0.85) status = 'DEGRADED';

      // Always include FLOW_METER, then 2-4 extras
      const extraCount = randInt(rng, 2, 4);
      const extras = pickN(rng, EXTRA_SENSORS, extraCount);
      const sensorTypes: SensorType[] = ['FLOW_METER', ...extras];

      const sensors: DeviceSensor[] = sensorTypes.map((type) => {
        const [lo, hi] = SENSOR_RANGES[type];
        return {
          type,
          unit: SENSOR_UNITS[type],
          lastValue: round(randFloat(rng, lo, hi), type === 'PH' ? 1 : 0),
          lastReadAt: daysAgo(status === 'OFFLINE' ? randInt(rng, 2, 14) : 0),
        };
      });

      // Calibration dates spread over past year (0-365 days ago)
      const calibDaysAgo = randInt(rng, 0, 365);

      devices.push({
        id: `dev-${pad(counter)}`,
        siteId: site.id,
        name: `${manufacturer} ${model} #${d + 1}`,
        manufacturer,
        model,
        firmwareVersion: pick(rng, FIRMWARE_VERSIONS),
        status,
        sensors,
        calibratedAt: daysAgo(calibDaysAgo),
        installedAt: site.installedAt,
      });
    }
  }
  return devices;
}
