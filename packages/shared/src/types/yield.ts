/** Token entry in the canonical asset registry */
export interface RegistryToken {
  ticker: string;
  name: string;
  description: string;
  decimals: number;
  category: 'governance' | 'impact' | 'stable' | 'utility';
  rail: 'xrpl' | 'evm' | 'both';
  batchAware: boolean;
  icon?: string;
}

/** Yield market for a single token */
export interface YieldMarket {
  token: string;
  total_supply: number;
  total_borrow: number;
  utilization_rate: number;
  supply_apy: number;
  borrow_apy: number;
  available_liquidity: number;
  /** For batch-aware tokens (WTR/ENG), min active fraction required */
  min_active_fraction?: number;
}

/** User position in a yield market */
export interface YieldPosition {
  token: string;
  supplied: number;
  borrowed: number;
  collateral_enabled: boolean;
  /** For batch-aware, which batch IDs are supplied */
  batch_ids?: string[];
}

/** Supply/Borrow action request */
export interface YieldAction {
  action: 'supply' | 'withdraw' | 'borrow' | 'repay';
  token: string;
  amount: number;
  batch_id?: string;
}

/** Swap pair definition */
export interface SwapPair {
  from: string;
  to: string;
  rate: number;
  inverse_rate: number;
  fee_bps: number;
  source: 'xrpl_dex' | 'amm' | 'aggregator';
  available: boolean;
}

/** Cross-chain bridge route */
export interface BridgeRoute {
  id: string;
  from_chain: string;
  to_chain: string;
  from_token: string;
  to_token: string;
  estimated_time_seconds: number;
  fee_usd: number;
  provider: string;
  available: boolean;
}
