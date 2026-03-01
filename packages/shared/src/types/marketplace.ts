/** Marketplace listing type */
export type ListingType = 'nft' | 'wtr' | 'eng' | 'nxs_pool';

/** Listing status */
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

/** Marketplace listing entity */
export interface MarketplaceListing {
  listing_id: string;
  type: ListingType;
  seller_wallet: string;
  price: ListingPrice;
  status: ListingStatus;
  created_at: string;
  expires_at?: string;
  sold_at?: string;
  buyer_wallet?: string;
  tx_hash?: string;
  /** NFT listing fields */
  nft_id?: string;
  /** WTR/ENG listing fields */
  batch_ids?: string[];
  amount?: number;
  remaining_active_fraction?: number;
  region_code?: string;
  verifier_signatures?: string[];
}

/** Price specification */
export interface ListingPrice {
  amount: number;
  currency: 'XRP' | 'NXS' | 'RLUSD';
}

/** Trade preview shown before signing */
export interface TradePreview {
  listing: MarketplaceListing;
  you_pay: ListingPrice;
  you_receive: TradeReceivable;
  fees: TradeFee[];
  policy_checks: PolicyCheckResult[];
  settlement_path: 'direct' | 'amm' | 'offer';
}

/** What the buyer receives */
export interface TradeReceivable {
  type: ListingType;
  amount?: number;
  nft_id?: string;
  batch_ids?: string[];
}

/** Fee line item */
export interface TradeFee {
  label: string;
  amount: number;
  currency: string;
}

/** Policy engine check result */
export interface PolicyCheckResult {
  rule: string;
  passed: boolean;
  reason?: string;
}

/** Market policy engine configuration */
export interface MarketPolicyConfig {
  participant_allowlist_enabled: boolean;
  asset_allowlist_enabled: boolean;
  max_retired_fraction_tradeable: number;
  anti_wash_enabled: boolean;
  jurisdiction_gating_enabled: boolean;
  max_concentration_per_installation: number;
}
