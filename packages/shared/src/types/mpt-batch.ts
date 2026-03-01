/** Token ticker for MPT batches */
export type BatchTokenType = 'WTR' | 'ENG';

/** MPT Batch — a minted lot of $WTR or $ENG tokens with provenance metadata */
export interface MPTBatch {
  batch_id: string;
  token_ticker: BatchTokenType;
  amount_minted: number;
  mint_date: string;
  region_code: string;
  installation_id: string;
  retirement_schedule: RetirementSchedule;
  current_retired_fraction: number;
  metadata_uri: string;
  ledger_identifiers: BatchLedgerIds;
  audit_signatures: string[];
  created_at: string;
}

/** Retirement schedule for a batch (default: 12-month linear) */
export interface RetirementSchedule {
  type: 'linear';
  duration_months: number;
  start_date: string;
}

/** On-ledger identifiers for the batch */
export interface BatchLedgerIds {
  issuer: string;
  currency: string;
  batch_tag: string;
  tx_hashes: string[];
}

/** Computed view for a user's batch holdings */
export interface BatchHolding {
  batch: MPTBatch;
  owned_amount: number;
  active_amount: number;
  retired_amount: number;
  age_months: number;
  remaining_fraction: number;
}

/** Aggregated "mixed bunch" weighted view across batches */
export interface WeightedBatchSummary {
  token_ticker: BatchTokenType;
  total_balance: number;
  total_active: number;
  total_retired: number;
  weighted_active_fraction: number;
  weighted_age_months: number;
  weighted_remaining_value: number;
}
