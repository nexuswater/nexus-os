/**
 * Inter-DAO Federation — Joint governance across partner DAOs
 * Enables shared proposals, voting metrics, and cross-DAO coordination.
 */

export interface FederationPartner {
  partnerId: string;
  name: string;
  description: string;
  trustScore: number; // 0-100
  governanceCompatible: boolean;
  sharedProposalTypes: string[];
  sharedTreasuryRatio: number; // fraction of shared treasury
  memberCount: number;
  joinedAt: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface FederationConfig {
  enabled: boolean;
  maxPartners: number;
  minTrustScore: number;
  sharedProposalQuorum: number;
  sharedProposalThreshold: number;
  crossDaoWeightAdjustment: number; // multiplier for cross-DAO voting (0-1)
}

export const DEFAULT_FEDERATION_CONFIG: FederationConfig = {
  enabled: false, // disabled by default, requires governance vote to enable
  maxPartners: 10,
  minTrustScore: 60,
  sharedProposalQuorum: 0.50,
  sharedProposalThreshold: 0.67,
  crossDaoWeightAdjustment: 0.5, // cross-DAO votes count at 50%
};

export interface SharedProposal {
  proposalId: string;
  originDaoId: string;
  title: string;
  description: string;
  partnerDaoIds: string[];
  votingStatus: Record<string, { votesFor: number; votesAgainst: number; quorumMet: boolean }>;
  overallStatus: 'active' | 'passed' | 'failed';
  createdAt: string;
}

/** Calculate adjusted voting weight for cross-DAO participation */
export function crossDaoWeight(
  localWeight: number,
  config: FederationConfig = DEFAULT_FEDERATION_CONFIG,
): number {
  return localWeight * config.crossDaoWeightAdjustment;
}

/** Check if a shared proposal has reached consensus across all partner DAOs */
export function checkFederationConsensus(
  proposal: SharedProposal,
  config: FederationConfig = DEFAULT_FEDERATION_CONFIG,
): { consensus: boolean; results: Record<string, boolean> } {
  const results: Record<string, boolean> = {};
  let allPassed = true;

  for (const daoId of proposal.partnerDaoIds) {
    const status = proposal.votingStatus[daoId];
    if (!status) {
      results[daoId] = false;
      allPassed = false;
      continue;
    }
    const total = status.votesFor + status.votesAgainst;
    const passed = status.quorumMet && total > 0 && (status.votesFor / total) >= config.sharedProposalThreshold;
    results[daoId] = passed;
    if (!passed) allPassed = false;
  }

  return { consensus: allPassed, results };
}

/** Calculate federation power balance */
export function federationPowerBalance(
  partners: FederationPartner[],
): { balanced: boolean; dominantPartner?: string; powerRatio: number } {
  if (partners.length < 2) return { balanced: true, powerRatio: 0 };

  const sorted = [...partners].sort((a, b) => b.memberCount - a.memberCount);
  const largest = sorted[0].memberCount;
  const secondLargest = sorted[1].memberCount;
  const ratio = secondLargest > 0 ? largest / secondLargest : Infinity;

  return {
    balanced: ratio < 3,
    dominantPartner: ratio >= 3 ? sorted[0].partnerId : undefined,
    powerRatio: Math.round(ratio * 100) / 100,
  };
}
