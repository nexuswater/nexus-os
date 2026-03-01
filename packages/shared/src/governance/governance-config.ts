/**
 * Cross-Rail Governance Configuration
 *
 * Controls how voting power is calculated across XRPL and EVM rails.
 * This config is read by UI components to determine behavior.
 */

export interface CrossRailGovernanceConfig {
  /** Enable cross-rail governance (XRPL + EVM) */
  crossRailEnabled: boolean;
  /** Allow EVM NXS holders to vote */
  evmVotingEnabled: boolean;
  /** Allow XRPL NXS holders to vote */
  xrplVotingEnabled: boolean;
  /** Impact weighting (WTR/ENG) applies only on XRPL */
  impactWeightingXRPLOnly: boolean;
  /** NFT multiplier applies only on XRPL */
  nftMultiplierXRPLOnly: boolean;
}

/** Default cross-rail governance configuration */
export const DEFAULT_CROSS_RAIL_CONFIG: CrossRailGovernanceConfig = {
  crossRailEnabled: true,
  evmVotingEnabled: true,
  xrplVotingEnabled: true,
  impactWeightingXRPLOnly: true,
  nftMultiplierXRPLOnly: true,
};

/** Wallet rail type */
export type WalletRail = 'xrpl' | 'evm';

/** Input for cross-rail voting power calculation */
export interface CrossRailVotingInput {
  /** NXS balance on XRPL wallet (0 if not connected) */
  xrplNxs: number;
  /** NXS balance on EVM wallet (0 if not connected) */
  evmNxs: number;
  /** Active WTR amount (XRPL only) */
  wtrActive: number;
  /** Active ENG amount (XRPL only) */
  engActive: number;
  /** NFT tiers held (XRPL only for now) */
  nftTiers: import('../types/source-node').SourceNodeTier[];
  /** Which wallets are connected */
  connectedRails: WalletRail[];
}

/** Cross-rail voting power breakdown */
export interface CrossRailVotingBreakdown {
  xrplNxs: number;
  evmNxs: number;
  combinedNxs: number;
  impactAddon: number;
  wtrPower: number;
  engPower: number;
  nftMultiplier: number;
  finalVotingPower: number;
  /** Which rails contributed */
  activeRails: WalletRail[];
  /** Whether impact weighting was applied */
  impactWeightingApplied: boolean;
  /** Whether NFT multiplier was applied */
  nftMultiplierApplied: boolean;
}
