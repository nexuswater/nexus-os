/**
 * sites.ts — Generate 42 deterministic ExtendedSite records across global regions.
 * Types: AWG(15), GREYWATER(8), RAIN(6), UTILITY(5), EMERGENCY(5), SPACE(3)
 */
import type { Rng } from '../seed';
import { randInt, randFloat, pick, chance, hexId, daysAgo, monthsAgo, round, pad } from '../seed';
import type { ExtendedSite, SiteType, SiteStatus, SiteLocation } from '../types';

// ─── Static data ────────────────────────────────────────

interface CityDef { city: string; region: string; country: string; lat: number; lng: number }

const CITIES: CityDef[] = [
  { city: 'Phoenix',     region: 'US-AZ',   country: 'US', lat: 33.45,  lng: -112.07 },
  { city: 'Austin',      region: 'US-TX',   country: 'US', lat: 30.27,  lng: -97.74  },
  { city: 'Denver',      region: 'US-CO',   country: 'US', lat: 39.74,  lng: -104.99 },
  { city: 'Portland',    region: 'US-OR',   country: 'US', lat: 45.52,  lng: -122.68 },
  { city: 'Los Angeles', region: 'US-CA',   country: 'US', lat: 34.05,  lng: -118.24 },
  { city: 'Miami',       region: 'US-FL',   country: 'US', lat: 25.76,  lng: -80.19  },
  { city: 'Nairobi',     region: 'KE-NAI',  country: 'KE', lat: -1.29,  lng: 36.82   },
  { city: 'Lagos',       region: 'NG-LA',   country: 'NG', lat: 6.52,   lng: 3.38    },
  { city: 'Cape Town',   region: 'ZA-WC',   country: 'ZA', lat: -33.92, lng: 18.42   },
  { city: 'Dubai',       region: 'AE-DU',   country: 'AE', lat: 25.20,  lng: 55.27   },
  { city: 'Mumbai',      region: 'IN-MH',   country: 'IN', lat: 19.08,  lng: 72.88   },
  { city: 'Singapore',   region: 'SG',      country: 'SG', lat: 1.35,   lng: 103.82  },
  { city: 'Sydney',      region: 'AU-NSW',  country: 'AU', lat: -33.87, lng: 151.21  },
  { city: 'São Paulo',   region: 'BR-SP',   country: 'BR', lat: -23.55, lng: -46.63  },
  { city: 'Lima',        region: 'PE-LIM',  country: 'PE', lat: -12.05, lng: -77.04  },
  { city: 'Mexico City', region: 'MX-CMX',  country: 'MX', lat: 19.43,  lng: -99.13  },
  { city: 'London',      region: 'GB-LND',  country: 'GB', lat: 51.51,  lng: -0.13   },
  { city: 'Berlin',      region: 'DE-BE',   country: 'DE', lat: 52.52,  lng: 13.41   },
  { city: 'Tokyo',       region: 'JP-13',   country: 'JP', lat: 35.68,  lng: 139.69  },
  { city: 'Seoul',       region: 'KR-11',   country: 'KR', lat: 37.57,  lng: 126.98  },
  { city: 'Cairo',       region: 'EG-C',    country: 'EG', lat: 30.04,  lng: 31.24   },
  { city: 'Riyadh',      region: 'SA-01',   country: 'SA', lat: 24.71,  lng: 46.68   },
];

const TYPE_PLAN: SiteType[] = [
  ...Array(15).fill('AWG'),
  ...Array(8).fill('GREYWATER'),
  ...Array(6).fill('RAIN'),
  ...Array(5).fill('UTILITY'),
  ...Array(5).fill('EMERGENCY'),
  ...Array(3).fill('SPACE'),
] as SiteType[];

const CONN_METHODS = ['LORA', 'CELLULAR', 'SATELLITE', 'WIFI'] as const;
const NAMES_PREFIX: Record<SiteType, string> = {
  AWG: 'AWG Station', GREYWATER: 'Greywater Loop', RAIN: 'Rain Collector',
  UTILITY: 'Utility Node', EMERGENCY: 'Emergency Hub', SPACE: 'Orbital Relay',
};

// ─── Generator ──────────────────────────────────────────

export function generateSites(rng: Rng): ExtendedSite[] {
  const sites: ExtendedSite[] = [];

  for (let i = 0; i < 42; i++) {
    const type = TYPE_PLAN[i];
    const city = CITIES[i % CITIES.length];
    const jitterLat = randFloat(rng, -0.15, 0.15);
    const jitterLng = randFloat(rng, -0.15, 0.15);

    const location: SiteLocation = {
      lat: round(city.lat + jitterLat, 4),
      lng: round(city.lng + jitterLng, 4),
      region: city.region,
      country: city.country,
      city: city.city,
    };

    // Status distribution: mostly ACTIVE
    let status: SiteStatus = 'ACTIVE';
    if (i === 41) status = 'OFFLINE';
    else if (i >= 38) status = 'PLANNED';
    else if (i >= 35) status = 'MAINTENANCE';

    const capacity = type === 'SPACE' ? 0
      : type === 'AWG' ? randInt(rng, 800, 5000)
      : type === 'GREYWATER' ? randInt(rng, 400, 2000)
      : type === 'RAIN' ? randInt(rng, 200, 1500)
      : type === 'EMERGENCY' ? randInt(rng, 300, 1000)
      : randInt(rng, 1000, 8000); // UTILITY

    const ageMonths = randInt(rng, 2, 30);
    const solarKw = type === 'SPACE' ? 0 : randFloat(rng, 1.5, 25);
    const gridKw = type === 'SPACE' ? 0 : randFloat(rng, 0.5, 10);

    sites.push({
      id: `site-${pad(i + 1)}`,
      name: `${city.city} ${NAMES_PREFIX[type]} ${pad(i + 1)}`,
      type,
      status,
      location,
      capacityLitersPerDay: capacity,
      waterQuality: {
        tds: round(randFloat(rng, 50, 350)),
        ph: round(randFloat(rng, 6.2, 8.5), 1),
        turbidity: round(randFloat(rng, 0.1, 4.5), 2),
      },
      energy: {
        solarKw: round(solarKw, 1),
        gridKw: round(gridKw, 1),
        batteryPct: round(randFloat(rng, 20, 100)),
      },
      opex: {
        monthlyUsd: round(randFloat(rng, 120, 3200)),
        costPerLiter: round(randFloat(rng, 0.002, 0.08), 4),
      },
      compliance: {
        score: randInt(rng, 60, 100),
        lastAudit: daysAgo(randInt(rng, 10, 180)),
        nextAudit: daysAgo(-randInt(rng, 30, 180)), // future
      },
      connectivity: {
        method: pick(rng, CONN_METHODS),
        signalPct: randInt(rng, 40, 100),
        lastPing: daysAgo(chance(rng, 0.9) ? 0 : randInt(rng, 1, 5)),
      },
      installedAt: monthsAgo(ageMonths),
      updatedAt: daysAgo(randInt(rng, 0, 7)),
    });
  }
  return sites;
}
