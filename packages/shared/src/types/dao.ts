/** Proposal types available in the DAO */
export type ProposalType =
  | 'policy'
  | 'treasury'
  | 'mint_parameters'
  | 'marketplace_listing'
  | 'council_admin'
  | 'emergency'
  | 'grants'
  | 'redemption_rate';

/** Proposal lifecycle states */
export type ProposalStatus =
  | 'draft'
  | 'active'
  | 'queued'
  | 'executed'
  | 'defeated'
  | 'expired';

/** Vote choice */
export type VoteChoice = 'for' | 'against' | 'abstain';

/** DAO Proposal entity */
export interface DAOProposal {
  proposal_id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposer_wallet: string;
  status: ProposalStatus;
  voting_config: VotingConfig;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_voters: number;
  execution_tx_hashes?: string[];
  created_at: string;
  voting_starts_at: string;
  voting_ends_at: string;
  queued_at?: string;
  executed_at?: string;
}

/** Voting configuration for a proposal */
export interface VotingConfig {
  quorum: number;
  approval_threshold: number;
  voting_period_hours: number;
  timelock_hours: number;
}

/** Individual vote record */
export interface Vote {
  vote_id: string;
  proposal_id: string;
  voter_wallet: string;
  choice: VoteChoice;
  voting_power: number;
  breakdown: VotingPowerBreakdown;
  tx_hash?: string;
  cast_at: string;
}

/** Voting power calculation breakdown */
export interface VotingPowerBreakdown {
  nxs_balance: number;
  nxs_power: number;
  wtr_active: number;
  wtr_power: number;
  eng_active: number;
  eng_power: number;
  nft_multiplier: number;
  nft_multiplier_mode: NFTMultiplierMode;
  total_voting_power: number;
}

/** NFT multiplier calculation modes */
export type NFTMultiplierMode =
  | 'highest_tier'
  | 'stacking_diminishing'
  | 'contribution_based';

/** DAO-configurable governance parameters */
export interface GovernanceConfig {
  wtr_weight: number;
  eng_weight: number;
  nft_multiplier_mode: NFTMultiplierMode;
  min_nxs_to_vote: number;
  min_nfts_to_vote: number;
  include_wtr_eng_for_voting: boolean;
  exclude_retired_batches: boolean;
  exclude_flagged_batches: boolean;
  default_quorum: number;
  default_approval_threshold: number;
  default_voting_period_hours: number;
  default_timelock_hours: number;
  last_updated_at: string;
  last_updated_proposal_id?: string;
}
