/** Source Node NFT tier levels */
export type SourceNodeTier =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Legendary';

/** Default tier multipliers (DAO-configurable) */
export const DEFAULT_TIER_MULTIPLIERS: Record<SourceNodeTier, number> = {
  Common: 1.0,
  Uncommon: 1.05,
  Rare: 1.12,
  Epic: 1.25,
  Legendary: 1.4,
};

/** Source Node NFT — XLS-20 NFT with dynamic metadata */
export interface SourceNodeNFT {
  nft_id: string;
  tier: SourceNodeTier;
  multiplier: number;
  animation_url?: string;
  image_url?: string;
  attributes: SourceNodeAttributes;
  metadata_uri: string;
  owner_wallet: string;
  ownership_history: OwnershipRecord[];
  minted_at: string;
}

/** Dynamic attributes updated as impact accrues */
export interface SourceNodeAttributes {
  water_offset_share: number;
  esg_score: number;
  governance_contribution_score: number;
  /** Optional display-only field for UI mockups. Not a yield or profit promise. */
  mock_impact_allocation_display?: number;
}

/** Ownership transfer record */
export interface OwnershipRecord {
  from_wallet: string;
  to_wallet: string;
  tx_hash: string;
  timestamp: string;
}
