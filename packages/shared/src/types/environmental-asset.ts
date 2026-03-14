/**
 * NexusOS Environmental Asset Token Schema
 *
 * Defines the MPT metadata structures for XRPL environmental assets
 * following XLS-89 conventions with Nexus-specific extensions.
 *
 * Three issuance styles:
 *   1. Asset-only MPT   (WTR, ENG)  — transferable commodity value
 *   2. Impact-only MPT  (MCR)       — pure carbon-prevented instrument
 *   3. Hybrid MPT       (WTRC, ENGC) — both asset + impact in one token
 *
 * The metadata lives in MPTokenMetadata on MPTokenIssuanceCreate (hex-encoded JSON).
 * Standard XLS-89 fields at top level; Nexus extensions in additional_info.
 */

/* ─── Instrument Types ─────────────────────────────────────── */

export type InstrumentType = 'asset' | 'impact' | 'hybrid';

export type AssetDomain = 'water' | 'energy';

export type ImpactType = 'carbon_prevented';

export type SourceType =
  | 'AWG'
  | 'solar'
  | 'greywater'
  | 'rainwater'
  | 'microgrid'
  | 'hydrogen'
  | 'utility_verified_supply';

export type VerificationMethod = 'oracle_attested' | 'self_reported' | 'third_party_audited';

/* ─── Transfer Semantics ───────────────────────────────────── */

export interface TransferSemantics {
  /** Whether this token represents a transferable economic asset */
  enabled: boolean;
  /** Human-readable unit name (e.g., "liter", "kWh") */
  unit_name?: string;
  /** Unit symbol (e.g., "L", "kWh") */
  unit_symbol?: string;
  /** What the token can be redeemed for */
  redeemable_for?: string;
  /** Asset domain */
  asset_domain?: AssetDomain;
  /** Settlement model */
  settlement_model?: 'offchain_fulfillment_with_onchain_receipt' | 'onchain_settlement';
}

/* ─── Impact Semantics ─────────────────────────────────────── */

export interface ImpactSemantics {
  /** Whether this token carries impact measurement */
  enabled: boolean;
  /** Type of impact */
  impact_type?: ImpactType;
  /** Impact measurement unit */
  impact_unit?: 'kgCO2e';
  /** Methodology for calculating impact */
  methodology?: string;
  /** Whether the impact can be permanently retired */
  retirement_supported?: boolean;
  /** Reporting basis */
  reporting_basis?: 'per_minted_unit' | 'per_batch';
}

/* ─── Conversion Profile ───────────────────────────────────── */

export interface ConversionProfile {
  /** Asset amount per token (e.g., "1000" liters) */
  per_token_asset_amount?: string;
  /** Carbon prevented per token in kgCO2e */
  per_token_carbon_prevented?: string;
  /** Basis for carbon calculation */
  carbon_calc_basis?: 'region_oracle_verified' | 'global_average' | 'methodology_derived';
}

/* ─── Source Infrastructure ────────────────────────────────── */

export interface SourceInfrastructure {
  /** Infrastructure source type */
  source_type: SourceType | string;
  /** Verification method */
  verification: VerificationMethod;
  /** Device class */
  device_class?: string;
}

/* ─── Compliance ───────────────────────────────────────────── */

export interface ComplianceProfile {
  kyc_required: boolean;
  transfer_restrictions: 'none' | 'issuer_policy_dependent' | 'jurisdiction_restricted';
}

/* ─── URI Entry (XLS-89) ───────────────────────────────────── */

export interface XLS89Uri {
  uri: string;
  category: 'website' | 'docs' | 'whitepaper' | 'methodology' | 'api';
  title: string;
}

/* ─── Additional Info (Nexus Extensions) ───────────────────── */

export interface NexusAdditionalInfo {
  instrument_type: InstrumentType;
  transfer_semantics: TransferSemantics;
  impact_semantics: ImpactSemantics;
  conversion_profile?: ConversionProfile;
  source_infrastructure: SourceInfrastructure;
  region_scope?: string[];
  compliance_profile?: ComplianceProfile;
  version: string;
}

/* ─── Full XLS-89 MPT Metadata ─────────────────────────────── */

export interface NexusMPTMetadata {
  /** Token ticker symbol */
  ticker: string;
  /** Human-readable token name */
  name: string;
  /** Token description */
  desc: string;
  /** Icon URL */
  icon: string;
  /** XLS-89 asset class */
  asset_class: 'rwa';
  /** Asset subclass */
  asset_subclass: AssetDomain | 'carbon';
  /** Issuer name */
  issuer_name: string;
  /** Reference URIs */
  uris: XLS89Uri[];
  /** Nexus-specific extensions */
  additional_info: NexusAdditionalInfo;
}

/* ─── Compact Key Version (for 1024-byte limit) ────────────── */

export interface NexusMPTMetadataCompact {
  t: string;      // ticker
  n: string;      // name
  d: string;      // desc
  i: string;      // icon
  ac: string;     // asset_class
  as: string;     // asset_subclass
  in: string;     // issuer_name
  u: Array<{
    u: string;    // uri
    c: string;    // category
    ti: string;   // title
  }>;
  ai: {
    it: InstrumentType;  // instrument_type
    ts: {                // transfer_semantics
      e: boolean;
      un?: string;
      us?: string;
      rf?: string;
    };
    is: {                // impact_semantics
      e: boolean;
      it?: string;
      iu?: string;
    };
    cp?: {               // conversion_profile
      pta?: string;
      ptc?: string;
    };
    si: {                // source_infrastructure
      st: string;
      v: string;
    };
    v: string;           // version
  };
}

/* ─── ERC-20 Mirror Metadata ───────────────────────────────── */

export interface NexusERCMetadata {
  schema: string;
  symbol: string;
  name: string;
  decimals: number;
  instrumentType: InstrumentType;
  asset: {
    enabled: boolean;
    domain?: AssetDomain;
    unitName?: string;
    unitSymbol?: string;
    redeemableFor?: string;
    perTokenAmount?: string;
  };
  impact: {
    enabled: boolean;
    type?: ImpactType;
    unit?: string;
    perTokenAmount?: string;
    methodology?: string;
  };
  sourceInfrastructure: {
    type: string;
    verification: string;
  };
  issuer: {
    name: string;
  };
  links: {
    website: string;
    methodology?: string;
  };
}

/* ─── MPTokenIssuanceCreate Transaction ────────────────────── */

export interface MPTokenIssuanceCreateTx {
  TransactionType: 'MPTokenIssuanceCreate';
  Account: string;
  AssetScale: number;
  MaximumAmount: string;
  TransferFee: number;
  Flags: number;
  MPTokenMetadata: string; // Hex-encoded XLS-89 JSON
}

/* ─── MPT Transfer Amount ──────────────────────────────────── */

export interface MPTAmount {
  mpt_issuance_id: string;
  value: string;
}

/* ─── Mercy Transfer Receipt ───────────────────────────────── */

export interface MercyTransferReceipt {
  receipt_id: string;
  timestamp: string;
  sender: string;
  destination: {
    region: string;
    coordinates?: [number, number];
    crisis_type?: string;
  };
  asset: {
    type: 'water' | 'energy';
    amount: number;
    unit: string;
  };
  impact: {
    carbon_prevented_kg: number;
    methodology: string;
  };
  source_node: {
    device_id: string;
    location: string;
    source_type: SourceType;
  };
  xrpl: {
    tx_hash: string;
    mpt_issuance_id: string;
    ledger_index: number;
  };
}

/* ─── Allocation Record ────────────────────────────────────── */

export interface AssetAllocation {
  allocation_id: string;
  timestamp: string;
  device_id: string;
  location: string;
  total_output: number;
  unit: string;
  channels: {
    logistics: { amount: number; percentage: number };
    carbon: { amount: number; percentage: number };
    mercy: { amount: number; percentage: number };
  };
  revenue: {
    logistics_usd: number;
    carbon_usd: number;
    mercy_impact_score: number;
  };
}

/* ─── Pre-built Token Definitions ──────────────────────────── */

/** WTR — Pure transferable water asset */
export const WTR_METADATA: NexusMPTMetadata = {
  ticker: 'WTR',
  name: 'Nexus Transfer Water Unit',
  desc: 'Transferable water asset used to represent delivered or allocable water value.',
  icon: 'https://nexuswater.xyz/assets/tokens/wtr.png',
  asset_class: 'rwa',
  asset_subclass: 'water',
  issuer_name: 'Nexus Water DAO',
  uris: [
    { uri: 'https://nexuswater.xyz/wtr', category: 'website', title: 'WTR Overview' },
  ],
  additional_info: {
    instrument_type: 'asset',
    transfer_semantics: {
      enabled: true,
      unit_name: 'liter',
      unit_symbol: 'L',
      redeemable_for: 'water_asset_or_water_service_credit',
      asset_domain: 'water',
    },
    impact_semantics: { enabled: false },
    source_infrastructure: {
      source_type: 'AWG',
      verification: 'oracle_attested',
    },
    version: '1.0.0',
  },
};

/** ENG — Pure transferable energy asset */
export const ENG_METADATA: NexusMPTMetadata = {
  ticker: 'ENG',
  name: 'Nexus Transfer Energy Unit',
  desc: 'Transferable energy asset representing renewable generation output.',
  icon: 'https://nexuswater.xyz/assets/tokens/eng.png',
  asset_class: 'rwa',
  asset_subclass: 'energy',
  issuer_name: 'Nexus Water DAO',
  uris: [
    { uri: 'https://nexuswater.xyz/eng', category: 'website', title: 'ENG Overview' },
  ],
  additional_info: {
    instrument_type: 'asset',
    transfer_semantics: {
      enabled: true,
      unit_name: 'kWh',
      unit_symbol: 'kWh',
      redeemable_for: 'energy_credit_or_grid_settlement',
      asset_domain: 'energy',
    },
    impact_semantics: { enabled: false },
    source_infrastructure: {
      source_type: 'solar',
      verification: 'oracle_attested',
    },
    version: '1.0.0',
  },
};

/** MCR — Pure carbon-prevented instrument */
export const MCR_METADATA: NexusMPTMetadata = {
  ticker: 'MCR',
  name: 'Nexus Micro Carbon Reduction',
  desc: 'Environmental impact token representing verified carbon emissions prevented.',
  icon: 'https://nexuswater.xyz/assets/tokens/mcr.png',
  asset_class: 'rwa',
  asset_subclass: 'carbon',
  issuer_name: 'Nexus Water DAO',
  uris: [
    { uri: 'https://nexuswater.xyz/mcr', category: 'website', title: 'MCR Overview' },
    { uri: 'https://nexuswater.xyz/docs/mcr-methodology', category: 'docs', title: 'Carbon Methodology' },
  ],
  additional_info: {
    instrument_type: 'impact',
    transfer_semantics: { enabled: false },
    impact_semantics: {
      enabled: true,
      impact_type: 'carbon_prevented',
      impact_unit: 'kgCO2e',
      methodology: 'oracle_verified_displacement_model',
      retirement_supported: true,
    },
    conversion_profile: {
      per_token_carbon_prevented: '1.00',
    },
    source_infrastructure: {
      source_type: 'AWG',
      verification: 'oracle_attested',
    },
    version: '1.0.0',
  },
};

/** WTRC — Hybrid water + carbon instrument */
export const WTRC_METADATA: NexusMPTMetadata = {
  ticker: 'WTRC',
  name: 'Nexus Water Carbon Hybrid',
  desc: 'Hybrid environmental asset representing transferable water value and associated carbon emissions prevented.',
  icon: 'https://nexuswater.xyz/assets/tokens/wtrc.png',
  asset_class: 'rwa',
  asset_subclass: 'water',
  issuer_name: 'Nexus Water DAO',
  uris: [
    { uri: 'https://nexuswater.xyz/wtrc', category: 'website', title: 'Product Page' },
    { uri: 'https://nexuswater.xyz/docs/wtrc-methodology', category: 'docs', title: 'Methodology' },
  ],
  additional_info: {
    instrument_type: 'hybrid',
    transfer_semantics: {
      enabled: true,
      unit_name: 'liter',
      unit_symbol: 'L',
      redeemable_for: 'water_delivery_or_water_right',
      asset_domain: 'water',
      settlement_model: 'offchain_fulfillment_with_onchain_receipt',
    },
    impact_semantics: {
      enabled: true,
      impact_type: 'carbon_prevented',
      impact_unit: 'kgCO2e',
      methodology: 'localized_water_production_displacing_transport_and_grid_intensity',
      reporting_basis: 'per_minted_unit',
    },
    conversion_profile: {
      per_token_asset_amount: '1000',
      per_token_carbon_prevented: '2.84',
      carbon_calc_basis: 'region_oracle_verified',
    },
    source_infrastructure: {
      source_type: 'AWG',
      verification: 'oracle_attested',
      device_class: 'NexusOS verified node',
    },
    region_scope: ['Maui, HI', 'Austin, TX'],
    compliance_profile: {
      kyc_required: false,
      transfer_restrictions: 'issuer_policy_dependent',
    },
    version: '1.0.0',
  },
};

/** ENGC — Hybrid energy + carbon instrument */
export const ENGC_METADATA: NexusMPTMetadata = {
  ticker: 'ENGC',
  name: 'Nexus Energy Carbon Hybrid',
  desc: 'Hybrid environmental asset representing transferable energy value and associated carbon emissions prevented.',
  icon: 'https://nexuswater.xyz/assets/tokens/engc.png',
  asset_class: 'rwa',
  asset_subclass: 'energy',
  issuer_name: 'Nexus Water DAO',
  uris: [
    { uri: 'https://nexuswater.xyz/engc', category: 'website', title: 'Product Page' },
    { uri: 'https://nexuswater.xyz/docs/engc-methodology', category: 'docs', title: 'Methodology' },
  ],
  additional_info: {
    instrument_type: 'hybrid',
    transfer_semantics: {
      enabled: true,
      unit_name: 'kWh',
      unit_symbol: 'kWh',
      redeemable_for: 'energy_credit_or_grid_settlement',
      asset_domain: 'energy',
      settlement_model: 'offchain_fulfillment_with_onchain_receipt',
    },
    impact_semantics: {
      enabled: true,
      impact_type: 'carbon_prevented',
      impact_unit: 'kgCO2e',
      methodology: 'renewable_generation_displacing_grid_fossil_intensity',
      reporting_basis: 'per_minted_unit',
    },
    conversion_profile: {
      per_token_asset_amount: '1000',
      per_token_carbon_prevented: '0.42',
      carbon_calc_basis: 'region_oracle_verified',
    },
    source_infrastructure: {
      source_type: 'solar',
      verification: 'oracle_attested',
      device_class: 'NexusOS verified node',
    },
    region_scope: ['Austin, TX', 'Phoenix, AZ', 'Denver, CO'],
    compliance_profile: {
      kyc_required: false,
      transfer_restrictions: 'issuer_policy_dependent',
    },
    version: '1.0.0',
  },
};
