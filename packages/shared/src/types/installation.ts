/** Technology types supported by the Nexus ecosystem */
export type TechnologyType =
  | 'awg'           // Atmospheric Water Generator
  | 'greywater'     // Greywater recycling
  | 'rainwater'     // Rainwater harvesting
  | 'watersense'    // WaterSense-certified device
  | 'solar'         // Solar energy
  | 'energy_star';  // ENERGY STAR device

/** Audit status of an installation */
export type AuditStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

/** Real-world asset record for a water/energy installation */
export interface Installation {
  installation_id: string;
  owner_wallet: string;
  installer_id: string;
  location: InstallationLocation;
  technology_type: TechnologyType;
  device_ids: string[];
  audit_status: AuditStatus;
  baseline_metrics: MetricsSnapshot;
  current_metrics: MetricsSnapshot;
  verification_document_hashes: string[];
  friendly_name?: string;
  created_at: string;
  updated_at: string;
}

/** Coarse location — avoids exact addresses for privacy */
export interface InstallationLocation {
  region_code: string;
  country_code: string;
  coarse_lat?: number;
  coarse_lng?: number;
}

/** Metrics snapshot for baseline or current readings */
export interface MetricsSnapshot {
  water_gallons_per_day?: number;
  energy_kwh_per_day?: number;
  measured_at: string;
  source: 'iot' | 'manual' | 'utility_bill' | 'third_party';
}
