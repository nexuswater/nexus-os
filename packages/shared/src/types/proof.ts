/** Source types for proof evidence */
export type ProofSourceType =
  | 'iot_meter'
  | 'utility_bill'
  | 'lab_test'
  | 'third_party_certificate'
  | 'watersense_report'
  | 'energy_star_report';

/** Status of a proof package */
export type ProofStatus = 'pending' | 'approved' | 'rejected';

/** Proof package — evidence bundle for an installation's impact */
export interface ProofPackage {
  proof_id: string;
  installation_id: string;
  time_window: TimeWindow;
  raw_readings_summary: string;
  source_types: ProofSourceType[];
  signatures: ProofSignatures;
  status: ProofStatus;
  rejection_reason?: string;
  document_hashes: string[];
  created_at: string;
  updated_at: string;
}

/** Time window covered by the proof */
export interface TimeWindow {
  start: string;
  end: string;
}

/** Required signatures for proof validation */
export interface ProofSignatures {
  installer?: string;
  oracle?: string;
  auditor?: string;
}
