// ─── Bill Types ──────────────────────────────────────────

export type BillType = 'WATER' | 'ENERGY';
export type BillStatus = 'pending' | 'verified' | 'flagged' | 'rejected';

export interface BillDocument {
  id: string;
  userId: string;
  type: BillType;
  providerName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  usageValue: number;
  usageUnit: string; // 'kWh' | 'gallons' | 'm³' | 'liters'
  amountValue: number;
  currency: string;
  accountLast4: string;
  serviceAddressMasked: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  status: BillStatus;
  fraudScore: number; // 0-100
  fraudSignals: FraudSignal[];
  rawExtractedText?: string;
  parsedFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface BillAuditLog {
  id: string;
  billId: string;
  actorId: string;
  actorName: string;
  action: 'uploaded' | 'verified' | 'flagged' | 'rejected' | 'deleted' | 'reviewed';
  notes?: string;
  createdAt: string;
}

// ─── Fraud Types ─────────────────────────────────────────

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FraudSignalCode =
  | 'HASH_MISMATCH'
  | 'PDF_TAMPER_SUSPECTED'
  | 'TEXT_LAYER_MISSING'
  | 'USAGE_SPIKE'
  | 'USAGE_DROP_TO_ZERO'
  | 'BILLING_PERIOD_GAP'
  | 'DUPLICATE_BILLING_PERIOD'
  | 'CURRENCY_MISMATCH'
  | 'PROVIDER_INCONSISTENT_FORMAT'
  | 'PROVIDER_MISMATCH_USAGE'
  | 'PROVIDER_MISMATCH_AMOUNT'
  | 'SERVICE_ADDRESS_CHANGED';

export interface FraudSignal {
  code: FraudSignalCode;
  severity: FraudSeverity;
  description: string;
  evidence: string;
}

// ─── Utility Connection Types ────────────────────────────

export type UtilityCategory = 'WATER' | 'ENERGY';
export type ConnectionMethod = 'OAUTH' | 'AGGREGATOR' | 'MANUAL';
export type ConnectionStatus = 'PENDING' | 'CONNECTED' | 'REVOKED' | 'FAILED';

export interface UtilityConnection {
  id: string;
  userId: string;
  category: UtilityCategory;
  providerName: string;
  method: ConnectionMethod;
  consentVersion: string;
  scopes: string[];
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface UtilityProvider {
  id: string;
  name: string;
  category: UtilityCategory;
  methods: ConnectionMethod[];
  logoUrl?: string;
  region: string;
}

export interface UtilitySyncResult {
  connectionId: string;
  syncedAt: string;
  billsImported: number;
  usageRecords: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

// ─── IoT Device Types ────────────────────────────────────

export type IoTDeviceType =
  | 'AWG'
  | 'SOLAR_FARM'
  | 'HYDROGEN_GENERATOR'
  | 'GREYWATER_RECYCLING'
  | 'WATER_METER'
  | 'ENERGY_METER'
  | 'OTHER';

export type IoTDeviceStatus = 'UNVERIFIED' | 'VERIFIED' | 'FLAGGED';

export type IoTDataMethod = 'MANUAL' | 'API' | 'MQTT' | 'LORAWAN' | 'WEBHOOK';

export interface IoTDevice {
  id: string;
  userId: string;
  type: IoTDeviceType;
  nickname: string;
  manufacturer: string;
  model: string;
  serialMasked: string;
  locationRegion: string;
  dataMethod: IoTDataMethod;
  status: IoTDeviceStatus;
  lastReadingAt: string | null;
  lastReadingValue: number | null;
  lastReadingUnit: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IoTMetricType = 'LITERS' | 'KWH' | 'KG_H2' | 'GALLONS' | 'CUBIC_METERS' | 'WATTS';

export interface IoTReading {
  id: string;
  deviceId: string;
  timestamp: string;
  metricType: IoTMetricType;
  value: number;
  unit: string;
  sourceHash?: string;
  flags: FraudSignal[];
}

// ─── Verification Dashboard Types ────────────────────────

export interface NexusIntegrityScore {
  overall: number; // 0-100
  billsVerifiedPct: number;
  connectionsActivePct: number;
  devicesVerifiedPct: number;
  fraudScoreTrend: 'improving' | 'stable' | 'declining';
  breakdown: {
    billsTotal: number;
    billsVerified: number;
    billsFlagged: number;
    connectionsTotal: number;
    connectionsActive: number;
    devicesTotal: number;
    devicesVerified: number;
    devicesFlagged: number;
  };
}

export interface VerificationItem {
  id: string;
  itemType: 'bill' | 'device';
  itemName: string;
  status: string;
  fraudScore: number;
  lastUpdated: string;
  actions: ('review' | 'verify' | 'reject')[];
}
