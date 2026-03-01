import type { DelegationRewardsEstimate } from '@nexus/shared';

/** Estimate rewards for a delegator based on their voting power */
export function estimateRewards(votingPower: number, feeBps: number): DelegationRewardsEstimate {
  // Mock: assume 0.5% monthly governance reward rate on VP
  const monthlyRate = 0.005;
  const estimatedMonthlyRewards = votingPower * monthlyRate;
  const delegateFee = estimatedMonthlyRewards * (feeBps / 10000);
  const netToYou = estimatedMonthlyRewards - delegateFee;

  return {
    estimatedMonthlyRewards,
    delegateFee,
    netToYou,
    rewardToken: 'NXS',
  };
}

/** Apply fee split to a reward amount */
export function applyFeeSplit(amount: number, feeBps: number) {
  const fee = amount * (feeBps / 10000);
  return {
    delegatorReceives: amount - fee,
    delegateReceives: fee,
  };
}

/** Simulate a monthly distribution (mock) */
export function simulateDistribution(totalPool: number, delegations: { votingPower: number; feeBps: number }[]) {
  const totalVP = delegations.reduce((s, d) => s + d.votingPower, 0);
  return delegations.map(d => {
    const share = totalVP > 0 ? (d.votingPower / totalVP) * totalPool : 0;
    const { delegatorReceives, delegateReceives } = applyFeeSplit(share, d.feeBps);
    return { share, delegatorReceives, delegateReceives };
  });
}
