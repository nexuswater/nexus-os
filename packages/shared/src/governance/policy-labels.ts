/**
 * Canonical UI labels and explanations for governance concepts.
 * Enforces the narrative tone: infrastructure language, not DeFi language.
 *
 * Preferred: "impact", "allocation", "verification", "participation", "governance authority"
 * Avoid:    "earn", "yield", "APY", "returns"
 */

/** Labels for token display */
export const TOKEN_LABELS = {
  NXS: {
    name: '$NXS',
    fullName: 'Governance & Coordination Token',
    description: 'Primary governance authority within Nexus Water DAO.',
    role: 'Voting on proposals, treasury decisions, protocol rules.',
  },
  WTR: {
    name: '$WTR',
    fullName: 'Water Impact Token',
    description: 'Verified water impact, minted from approved installations.',
    role: 'Impact accounting instrument with batch-based retirement.',
    disclaimer: '$WTR is not a currency or stablecoin. It represents verified environmental impact.',
  },
  ENG: {
    name: '$ENG',
    fullName: 'Energy Impact Token',
    description: 'Verified energy impact from renewable or efficiency installations.',
    role: 'Impact accounting instrument with batch-based retirement.',
    disclaimer: '$ENG is not a currency or stablecoin. It represents verified environmental impact.',
  },
  SOURCE_NODE: {
    name: 'Source Node',
    fullName: 'Governance Identity Anchor',
    description: 'Participation tier NFT that amplifies governance authority.',
    role: 'NFTs represent participation tiers, not yield. They amplify governance contribution.',
  },
} as const;

/** Explanations for why values count or don't count */
export const GOVERNANCE_EXPLANATIONS = {
  nxs_always_counts:
    '$NXS always contributes to governance authority as the primary governance token.',
  wtr_active_counts:
    'Only the active (unretired) portion of $WTR contributes, weighted by DAO policy.',
  wtr_active_disabled:
    '$WTR governance contribution is currently disabled by DAO policy.',
  eng_active_counts:
    'Only the active (unretired) portion of $ENG contributes, weighted by DAO policy.',
  eng_active_disabled:
    '$ENG governance contribution is currently disabled by DAO policy.',
  retired_excluded:
    'Retired batch value does not contribute to governance. Batches retire linearly over their schedule.',
  flagged_excluded:
    'Flagged or compliance-held batches are excluded from governance calculations.',
  nft_multiplier_amplifies:
    'Source Node NFTs amplify governance authority. They cannot create voting power alone.',
  nft_no_override:
    'NFT multipliers do not override $NXS requirements. Base governance authority comes from $NXS.',
  escrow_excluded:
    'NFTs held in escrow do not contribute their multiplier.',
} as const;

/** Marketplace tone labels */
export const MARKETPLACE_LABELS = {
  trade_header: 'Impact Transfer',
  listing_header: 'Available Impact Allocations',
  batch_info: 'Verified impact batch with on-ledger provenance.',
  retirement_warning: 'This batch has partial retirement. Active value reflects remaining impact.',
  permissioned_notice: 'This marketplace operates under DAO-approved participation rules.',
} as const;

/** Treasury tone labels */
export const TREASURY_LABELS = {
  header: 'DAO Treasury',
  description: 'Infrastructure funds governed by proposal and vote.',
  allocation_label: 'Allocation',
  purpose_items: [
    'Maintain infrastructure',
    'Fund audits and verification',
    'Support deployments',
    'Manage operational liquidity',
  ],
  disclaimer: 'Treasury decisions are governance acts, not investment strategies.',
} as const;

/** Minting tone labels */
export const MINTING_LABELS = {
  header: 'Impact Verification & Minting',
  description: 'Create verified impact tokens from approved installations.',
  step_names: [
    'Installation Registration',
    'Proof Package Submission',
    'Oracle Verification',
    'Batch Minting',
  ],
  disclaimer: 'Minting creates impact accounting units from verified environmental data.',
} as const;
