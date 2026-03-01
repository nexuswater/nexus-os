/**
 * alerts.ts — Generate 40 alerts across sites.
 * Severity: 15 LOW, 12 MEDIUM, 8 HIGH, 5 CRITICAL.
 * Resolution: 25 resolved, 15 open.
 * Categories: SENSOR_GAP, CALIBRATION_OVERDUE, OUTLIER,
 *   CONNECTIVITY_LOSS, MAINTENANCE_DUE, FRAUD_SIGNAL, COMPLIANCE.
 */
import type { Rng } from '../seed';
import {
  randInt, randFloat, round, pick, chance,
  hexId, hoursAgo, daysAgo, SITE_IDS,
} from '../seed';
import type { Alert, AlertCategory, AlertSeverity } from '../types';

// ─── Constants ──────────────────────────────────────────

const ALERT_COUNT = 40;

/** 15 LOW, 12 MEDIUM, 8 HIGH, 5 CRITICAL */
const SEV_PLAN: AlertSeverity[] = [
  ...Array(15).fill('LOW' as AlertSeverity),
  ...Array(12).fill('MEDIUM' as AlertSeverity),
  ...Array(8).fill('HIGH' as AlertSeverity),
  ...Array(5).fill('CRITICAL' as AlertSeverity),
];

// ─── Message templates by category ──────────────────────

interface AlertTemplate {
  category: AlertCategory;
  messages: readonly string[];
  metaFn: (rng: Rng) => Record<string, string | number>;
}

const TEMPLATES: AlertTemplate[] = [
  {
    category: 'SENSOR_GAP',
    messages: [
      'Flow meter reading gap: 2h 15m',
      'TDS sensor data gap detected: 45m',
      'Humidity sensor offline for 1h 30m',
      'UV intensity sensor gap: 3h 05m',
      'Pressure transducer silent for 55m',
      'Temperature probe reading gap: 1h 48m',
    ],
    metaFn: (rng) => ({
      gapMinutes: randInt(rng, 15, 240),
      sensorType: pick(rng, ['flow', 'tds', 'humidity', 'uv', 'pressure', 'temperature'] as const),
    }),
  },
  {
    category: 'CALIBRATION_OVERDUE',
    messages: [
      'Flow meter calibration overdue by 14 days',
      'TDS probe calibration expired — last: 2026-01-15',
      'UV sensor calibration due 7 days ago',
      'Pressure sensor recalibration required',
      'pH probe calibration overdue by 21 days',
    ],
    metaFn: (rng) => ({
      daysPastDue: randInt(rng, 3, 45),
      sensorId: `SEN-${hexId(rng, 6).toUpperCase()}`,
    }),
  },
  {
    category: 'OUTLIER',
    messages: [
      'TDS sensor reading 4.2\u03C3 above mean',
      'Flow rate spike: 3.8\u03C3 deviation detected',
      'Energy output 2.9\u03C3 below 30-day average',
      'Water production anomaly: 3.1\u03C3 above expected',
      'Humidity reading outlier: 4.0\u03C3 from baseline',
    ],
    metaFn: (rng) => ({
      sigmaDeviation: round(randFloat(rng, 2.5, 5.0), 1),
      metric: pick(rng, ['tds', 'flow_rate', 'energy_kwh', 'liters_hr', 'humidity_pct'] as const),
      value: round(randFloat(rng, 10, 500), 2),
    }),
  },
  {
    category: 'CONNECTIVITY_LOSS',
    messages: [
      'IoT gateway offline — no heartbeat for 45m',
      'Cellular modem connection lost: site unreachable',
      'Satellite uplink degraded — packet loss 38%',
      'WiFi bridge disconnected from mesh network',
      'LoRa gateway unresponsive for 2h',
    ],
    metaFn: (rng) => ({
      downMinutes: randInt(rng, 10, 300),
      connectionType: pick(rng, ['cellular', 'satellite', 'wifi', 'lora', 'ethernet'] as const),
    }),
  },
  {
    category: 'MAINTENANCE_DUE',
    messages: [
      'UV lamp approaching end-of-life: 850h remaining',
      'Filter replacement due — pressure differential high',
      'Compressor service interval exceeded by 120h',
      'Fan belt inspection due at 10,000h mark',
      'Membrane cleaning cycle overdue by 5 days',
    ],
    metaFn: (rng) => ({
      componentId: `CMP-${hexId(rng, 6).toUpperCase()}`,
      hoursRemaining: randInt(rng, 0, 1200),
    }),
  },
  {
    category: 'FRAUD_SIGNAL',
    messages: [
      'Duplicate meter reading hash detected within 24h',
      'GPS coordinates inconsistent with registered site location',
      'Production claimed exceeds physical capacity by 22%',
      'Operator activity from unregistered IP range',
      'Timestamp manipulation suspected — clock skew 4m 30s',
    ],
    metaFn: (rng) => ({
      confidenceScore: round(randFloat(rng, 0.6, 0.98), 2),
      signalType: pick(rng, ['duplicate_hash', 'gps_drift', 'overclaim', 'ip_anomaly', 'clock_skew'] as const),
    }),
  },
  {
    category: 'COMPLIANCE',
    messages: [
      'Batch vintage approaching expiry: 30 days remaining',
      'Site operating permit renewal due in 15 days',
      'Water quality report submission overdue',
      'Annual ESG audit deadline in 45 days',
      'Regulatory filing gap: missing Q4 2025 report',
    ],
    metaFn: (rng) => ({
      daysUntilDeadline: randInt(rng, 0, 60),
      complianceType: pick(rng, ['vintage_expiry', 'permit_renewal', 'quality_report', 'esg_audit', 'regulatory_filing'] as const),
    }),
  },
];

// ─── Generator ──────────────────────────────────────────

export function generateAlerts(rng: Rng): Alert[] {
  const alerts: Alert[] = [];
  let resolvedSoFar = 0;
  const targetResolved = 25;

  for (let i = 0; i < ALERT_COUNT; i++) {
    const severity = SEV_PLAN[i];
    const tmpl = pick(rng, TEMPLATES);
    const message = pick(rng, tmpl.messages);
    const siteId = pick(rng, SITE_IDS);

    // More severe alerts are more recent
    let createdAt: string;
    switch (severity) {
      case 'CRITICAL': createdAt = hoursAgo(randInt(rng, 1, 12)); break;
      case 'HIGH':     createdAt = hoursAgo(randInt(rng, 6, 72)); break;
      case 'MEDIUM':   createdAt = daysAgo(randInt(rng, 1, 14)); break;
      case 'LOW':      createdAt = daysAgo(randInt(rng, 2, 30)); break;
    }

    // First 25 eligible are resolved, rest are open
    const shouldResolve = resolvedSoFar < targetResolved && (chance(rng, 0.7) || i < 10);
    if (shouldResolve) resolvedSoFar++;

    const resolvedAt = shouldResolve
      ? daysAgo(randInt(rng, 0, 5))
      : null;

    const acknowledgedBy = shouldResolve
      ? pick(rng, ['admin@nexus.os', 'ops-team@nexus.os', 'auto-resolve-bot'] as const)
      : (severity === 'CRITICAL' || severity === 'HIGH') && chance(rng, 0.5)
        ? 'admin@nexus.os'
        : null;

    alerts.push({
      id: `alert-${hexId(rng, 12)}`,
      siteId,
      category: tmpl.category,
      severity,
      message,
      createdAt,
      resolvedAt,
      acknowledgedBy,
      metadata: tmpl.metaFn(rng),
    });
  }

  return alerts;
}
