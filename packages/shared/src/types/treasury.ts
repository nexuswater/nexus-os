/** Treasury action status */
export type TreasuryActionStatus =
  | 'pending'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed';

/** Treasury action — an approved execution tied to a DAO proposal */
export interface TreasuryAction {
  action_id: string;
  proposal_id: string;
  transaction_bundle: TreasuryTransaction[];
  status: TreasuryActionStatus;
  executed_by?: string;
  receipts: TreasuryReceipt[];
  created_at: string;
  executed_at?: string;
}

/** Individual transaction within a treasury action */
export interface TreasuryTransaction {
  tx_type: 'xrpl' | 'xahau';
  destination: string;
  amount: number;
  currency: string;
  memo?: string;
}

/** Execution receipt */
export interface TreasuryReceipt {
  tx_hash: string;
  ledger: 'xrpl' | 'xahau';
  status: 'success' | 'failure';
  timestamp: string;
}

/** Treasury overview snapshot */
export interface TreasuryOverview {
  nxs_balance: number;
  xrp_balance: number;
  allocations: TreasuryAllocation[];
  pending_actions: number;
  last_updated: string;
}

/** Named allocation bucket */
export interface TreasuryAllocation {
  label: string;
  amount: number;
  currency: string;
  percentage: number;
}
