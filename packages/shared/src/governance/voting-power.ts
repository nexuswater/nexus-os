import type {
  GovernanceConfig,
  VotingPowerBreakdown,
  NFTMultiplierMode,
  BatchHolding,
} from '../types';
import type { SourceNodeTier } from '../types/source-node';
import { DEFAULT_TIER_MULTIPLIERS } from '../types/source-node';
import type {
  CrossRailGovernanceConfig,
  CrossRailVotingInput,
  CrossRailVotingBreakdown,
} from './governance-config';

// ─── Batch Retirement ────────────────────────────────────

/**
 * Calculate the active (unretired) fraction of a batch.
 * Default: 12-month linear decay from mint date.
 * Returns a value between 0 (fully retired) and 1 (fully active).
 */
export function batchActiveFraction(
  mintDate: string | Date,
  durationMonths: number = 12,
  asOf: Date = new Date(),
): number {
  const mint = new Date(mintDate);
  const ageMs = asOf.getTime() - mint.getTime();
  const ageMonths = ageMs / (30.44 * 24 * 60 * 60 * 1000); // average month
  const fraction = 1 - ageMonths / durationMonths;
  return Math.max(0, Math.min(1, fraction));
}

/**
 * Calculate total active amount across a set of batch holdings.
 * Excludes fully retired batches.
 */
export function totalActiveAmount(
  holdings: BatchHolding[],
  asOf: Date = new Date(),
): number {
  return holdings.reduce((sum, h) => {
    const fraction = batchActiveFraction(
      h.batch.mint_date,
      h.batch.retirement_schedule.duration_months,
      asOf,
    );
    return sum + h.owned_amount * fraction;
  }, 0);
}

/**
 * Calculate weighted active fraction across holdings.
 * Returns a fraction 0–1 representing overall portfolio freshness.
 */
export function weightedActiveFraction(
  holdings: BatchHolding[],
  asOf: Date = new Date(),
): number {
  const totalOwned = holdings.reduce((s, h) => s + h.owned_amount, 0);
  if (totalOwned === 0) return 0;

  const weightedSum = holdings.reduce((sum, h) => {
    const fraction = batchActiveFraction(
      h.batch.mint_date,
      h.batch.retirement_schedule.duration_months,
      asOf,
    );
    return sum + h.owned_amount * fraction;
  }, 0);

  return weightedSum / totalOwned;
}

// ─── NFT Multiplier ──────────────────────────────────────

/**
 * Calculate the effective NFT multiplier for a wallet's Source Nodes.
 * Supports three DAO-configurable modes.
 */
export function nftMultiplier(
  tiers: SourceNodeTier[],
  mode: NFTMultiplierMode,
  tierMultipliers: Record<SourceNodeTier, number> = DEFAULT_TIER_MULTIPLIERS,
): number {
  if (tiers.length === 0) return 1.0;

  switch (mode) {
    case 'highest_tier': {
      // Use the single highest multiplier among all held NFTs
      return Math.max(...tiers.map((t) => tierMultipliers[t]));
    }

    case 'stacking_diminishing': {
      // Sort descending by multiplier. First NFT gives full bonus,
      // each additional gives 50% of the previous incremental bonus.
      const sorted = tiers
        .map((t) => tierMultipliers[t])
        .sort((a, b) => b - a);
      let result = sorted[0];
      let diminish = 0.5;
      for (let i = 1; i < sorted.length; i++) {
        const bonus = sorted[i] - 1.0; // incremental bonus above 1.0
        result += bonus * diminish;
        diminish *= 0.5;
      }
      return result;
    }

    case 'contribution_based': {
      // Placeholder: use highest tier as base.
      // In production, this would factor in governance_contribution_score.
      return Math.max(...tiers.map((t) => tierMultipliers[t]));
    }

    default:
      return 1.0;
  }
}

// ─── Voting Power Calculation ────────────────────────────

export interface VotingPowerInput {
  /** $NXS balance */
  nxsBalance: number;
  /** Active (unretired) $WTR amount */
  wtrActive: number;
  /** Active (unretired) $ENG amount */
  engActive: number;
  /** Tiers of all Source Node NFTs held */
  nftTiers: SourceNodeTier[];
}

/**
 * Calculate full voting power breakdown according to the canonical formula:
 *
 *   VP = (NXS + WTR_active * wtr_weight + ENG_active * eng_weight) * NFT_multiplier
 *
 * - NXS always counts (primary governance token)
 * - WTR/ENG only count if config.include_wtr_eng_for_voting is true
 * - Retired batches must already be excluded from wtrActive/engActive
 * - NFT multiplier is DAO-configurable
 */
export function calculateVotingPower(
  input: VotingPowerInput,
  config: GovernanceConfig,
): VotingPowerBreakdown {
  // Step 1 — Base Power (always NXS)
  const nxsPower = input.nxsBalance;

  // Step 2 — Impact Add-On (DAO-controlled)
  let wtrPower = 0;
  let engPower = 0;
  if (config.include_wtr_eng_for_voting) {
    wtrPower = input.wtrActive * config.wtr_weight;
    engPower = input.engActive * config.eng_weight;
  }

  // Step 3 — NFT Multiplier
  const multiplier = nftMultiplier(
    input.nftTiers,
    config.nft_multiplier_mode,
  );

  // Step 4 — Final
  const totalVotingPower = (nxsPower + wtrPower + engPower) * multiplier;

  return {
    nxs_balance: input.nxsBalance,
    nxs_power: nxsPower,
    wtr_active: input.wtrActive,
    wtr_power: wtrPower,
    eng_active: input.engActive,
    eng_power: engPower,
    nft_multiplier: multiplier,
    nft_multiplier_mode: config.nft_multiplier_mode,
    total_voting_power: totalVotingPower,
  };
}

// ─── Eligibility Gates ───────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Check if a wallet meets the governance eligibility requirements.
 * Returns eligible status and human-readable reasons for any failures.
 */
export function checkVotingEligibility(
  input: VotingPowerInput,
  config: GovernanceConfig,
): EligibilityResult {
  const reasons: string[] = [];

  if (config.min_nxs_to_vote > 0 && input.nxsBalance < config.min_nxs_to_vote) {
    reasons.push(
      `Requires at least ${config.min_nxs_to_vote} $NXS (you have ${input.nxsBalance})`,
    );
  }

  if (config.min_nfts_to_vote > 0 && input.nftTiers.length < config.min_nfts_to_vote) {
    reasons.push(
      `Requires at least ${config.min_nfts_to_vote} Source Node NFT(s) (you have ${input.nftTiers.length})`,
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Check if a wallet can create a proposal.
 * Proposal creation has higher thresholds than voting.
 */
export function checkProposalEligibility(
  input: VotingPowerInput,
  config: GovernanceConfig,
  proposalThresholdMultiplier: number = 10,
): EligibilityResult {
  const reasons: string[] = [];
  const minNxs = config.min_nxs_to_vote * proposalThresholdMultiplier;

  if (minNxs > 0 && input.nxsBalance < minNxs) {
    reasons.push(
      `Requires at least ${minNxs} $NXS to create proposals (you have ${input.nxsBalance})`,
    );
  }

  if (input.nftTiers.length === 0) {
    reasons.push('Requires at least 1 Source Node NFT to create proposals');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

// ─── Cross-Rail Voting Power ────────────────────────────

/**
 * Calculate voting power across XRPL and EVM rails.
 *
 * Formula:
 *   Base = XRPL_NXS + EVM_NXS
 *   Impact = (WTR_active * wtr_weight + ENG_active * eng_weight)  [XRPL only]
 *   Multiplier = NFT multiplier [XRPL only for now]
 *   Final VP = (Base + Impact) * Multiplier
 *
 * - EVM NXS counts 1:1 with XRPL NXS
 * - No double-counting: bridge burns/locks on origin rail (Option A)
 * - Impact weighting and NFT multiplier are XRPL-only for now
 */
export function calculateCrossRailVotingPower(
  input: CrossRailVotingInput,
  govConfig: GovernanceConfig,
  crossRailConfig: CrossRailGovernanceConfig,
): CrossRailVotingBreakdown {
  const xrplConnected = input.connectedRails.includes('xrpl');
  const evmConnected = input.connectedRails.includes('evm');

  const xrplNxs = xrplConnected && crossRailConfig.xrplVotingEnabled
    ? input.xrplNxs
    : 0;
  const evmNxs = evmConnected && crossRailConfig.evmVotingEnabled
    ? input.evmNxs
    : 0;

  const combinedNxs = xrplNxs + evmNxs;

  // Impact weighting (XRPL only)
  let wtrPower = 0;
  let engPower = 0;
  const impactWeightingApplied =
    xrplConnected && govConfig.include_wtr_eng_for_voting;

  if (impactWeightingApplied) {
    wtrPower = input.wtrActive * govConfig.wtr_weight;
    engPower = input.engActive * govConfig.eng_weight;
  }

  const impactAddon = wtrPower + engPower;

  // NFT multiplier (XRPL only for now)
  let effectiveMultiplier = 1.0;
  const nftMultiplierApplied = xrplConnected && input.nftTiers.length > 0;

  if (nftMultiplierApplied) {
    effectiveMultiplier = nftMultiplier(
      input.nftTiers,
      govConfig.nft_multiplier_mode,
    );
  }

  const finalVotingPower = (combinedNxs + impactAddon) * effectiveMultiplier;

  const activeRails: ('xrpl' | 'evm')[] = [];
  if (xrplNxs > 0) activeRails.push('xrpl');
  if (evmNxs > 0) activeRails.push('evm');

  return {
    xrplNxs,
    evmNxs,
    combinedNxs,
    impactAddon,
    wtrPower,
    engPower,
    nftMultiplier: effectiveMultiplier,
    finalVotingPower,
    activeRails,
    impactWeightingApplied,
    nftMultiplierApplied,
  };
}
