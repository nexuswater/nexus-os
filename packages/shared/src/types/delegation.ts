/** Delegation scope types */
export type DelegationScope = 'SCOPE_NXS' | 'SCOPE_IMPACT' | 'SCOPE_NFT_MULTIPLIER' | 'SCOPE_ALL';

/** Delegation status */
export type DelegationStatus = 'pending' | 'active' | 'revoked' | 'expired';

/** Delegation record */
export interface DelegationRecord {
  id: string;
  rail: 'xrpl' | 'evm';
  delegatorAddress: string;
  delegateAddress: string;
  scopes: DelegationScope[];
  feeBps: number;
  startTime: string;
  endTime?: string;
  revocable: boolean;
  status: DelegationStatus;
  policyVersion: string;
  notes?: string;
}

/** Delegate/Operator profile */
export interface DelegateProfile {
  delegateAddress: string;
  displayName: string;
  bio: string;
  feeBpsDefault: number;
  rail: 'xrpl' | 'evm' | 'both';
  scopesSupported: DelegationScope[];
  performanceStats: {
    participationRate: number;
    proposalsVoted: number;
    uptime: number;
  };
  verifiedBadge: boolean;
}

/** Delegation rewards estimate */
export interface DelegationRewardsEstimate {
  estimatedMonthlyRewards: number;
  delegateFee: number;
  netToYou: number;
  rewardToken: string;
}

/** Voting power breakdown with delegation */
export interface DelegatedVotingPower {
  selfVotingPower: number;
  delegatedAwayByScope: Record<DelegationScope, number>;
  delegatedToYouByScope: Record<DelegationScope, number>;
  totalDelegatedAway: number;
  totalDelegatedToYou: number;
  effectiveVotingPower: number;
}
