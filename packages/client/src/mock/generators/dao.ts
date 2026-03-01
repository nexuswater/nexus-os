/**
 * dao.ts — Generate 20 proposals, 200 votes, and 30 treasury actions.
 * Statuses: 3 DRAFT, 5 ACTIVE, 6 PASSED, 3 FAILED, 2 EXECUTED, 1 CANCELLED.
 * Types: REWARD_RATE, NEW_DEPLOYMENT, BUDGET, PARAMETER_CHANGE, EMERGENCY.
 */
import type { Rng } from '../seed';
import {
  randInt, randFloat, round, pick, chance,
  hexId, uuid, txHash, xrplAddress, evmAddress,
  offsetFrom, daysAgo,
} from '../seed';
import type {
  Proposal, ProposalStatus, ProposalType,
  DAOVote, VoteChoice,
  TreasuryAction, TreasuryActionKind,
} from '../types';
import type { Token } from '../seed';

// ─── Proposal templates ─────────────────────────────────

interface Template { type: ProposalType; title: string; description: string }

const TEMPLATES: Template[] = [
  // REWARD_RATE (4)
  { type: 'REWARD_RATE', title: 'Increase WTR Staking Reward to 5.5%', description: 'Raise WTR staking reward rate from 4.8% to 5.5% APR to incentivize long-term holding and liquidity provision in the Water Credit Pool.' },
  { type: 'REWARD_RATE', title: 'Reduce ENG Borrow Rate by 0.5%', description: 'Lower the Energy Credit borrow rate to attract institutional borrowers and improve market competitiveness.' },
  { type: 'REWARD_RATE', title: 'Adjust NXS Staking Multiplier to 1.2x', description: 'Increase NXS governance staking multiplier to reward active governance participation.' },
  { type: 'REWARD_RATE', title: 'Set RLUSD Yield Floor at 1.5% APR', description: 'Establish a minimum yield floor for RLUSD suppliers to maintain stablecoin liquidity.' },
  // NEW_DEPLOYMENT (4)
  { type: 'NEW_DEPLOYMENT', title: 'Deploy AWG Node in Lagos', description: 'Fund and deploy a new atmospheric water generation node in Lagos, Nigeria, targeting 8,000 L/day production.' },
  { type: 'NEW_DEPLOYMENT', title: 'Launch Greywater Hub in São Paulo', description: 'Commission a greywater recycling hub in São Paulo serving the southern district, targeting 5,000 L/day.' },
  { type: 'NEW_DEPLOYMENT', title: 'Install Solar Array in Nairobi', description: 'Deploy a 500 kW solar array adjacent to the Nairobi AWG station for self-sustaining energy production.' },
  { type: 'NEW_DEPLOYMENT', title: 'Emergency AWG Deployment — Fiji', description: 'Rapid deployment of emergency AWG units to Fiji following cyclone damage to water infrastructure.' },
  // BUDGET (4)
  { type: 'BUDGET', title: 'Q2 2026 Operations Budget: $1.2M', description: 'Approve quarterly operating budget covering infrastructure maintenance, team salaries, oracle subscriptions, and community grants.' },
  { type: 'BUDGET', title: 'Marketing Fund Allocation: 50K NXS', description: 'Allocate 50,000 NXS from treasury for Q2 marketing campaigns, conference sponsorships, and developer bounties.' },
  { type: 'BUDGET', title: 'Audit Reserve: 25K USDC', description: 'Set aside 25,000 USDC for third-party smart contract audits and security reviews of the lending protocol.' },
  { type: 'BUDGET', title: 'Community Grants Program — Round 3', description: 'Fund the third round of community grants with 100K NXS to support ecosystem builders and integration partners.' },
  // PARAMETER_CHANGE (4)
  { type: 'PARAMETER_CHANGE', title: 'Lower Quorum Threshold to 15%', description: 'Reduce quorum requirement from 20% to 15% of circulating NXS to improve governance participation rates.' },
  { type: 'PARAMETER_CHANGE', title: 'Extend Voting Period to 7 Days', description: 'Increase the standard voting period from 5 to 7 days to accommodate voters across different time zones.' },
  { type: 'PARAMETER_CHANGE', title: 'Increase Collateral Factor for WTR to 0.70', description: 'Raise the WTR collateral factor from 0.65 to 0.70 based on improved liquidity data.' },
  { type: 'PARAMETER_CHANGE', title: 'Add COREUM as Supported Bridge Chain', description: 'Enable COREUM in the cross-chain bridge router and update fee schedules for NXS/WTR/ENG transfers.' },
  // EMERGENCY (4)
  { type: 'EMERGENCY', title: 'Emergency: Pause Bridge — Suspicious Activity', description: 'Temporarily pause all bridge operations pending investigation of unusual transfer patterns detected by monitoring oracle.' },
  { type: 'EMERGENCY', title: 'Emergency: Increase Oracle Redundancy', description: 'Deploy backup oracle nodes in EU and APAC regions after primary oracle latency exceeded 30s threshold.' },
  { type: 'EMERGENCY', title: 'Emergency: Patch Lending Rate Oracle', description: 'Hotfix the lending rate oracle to correct a rounding error overcharging borrow interest by 0.02%.' },
  { type: 'EMERGENCY', title: 'Emergency: Freeze Compromised Operator', description: 'Freeze operator address rABC... pending investigation of unauthorized batch minting from an unregistered site.' },
];

/** 3 DRAFT, 5 ACTIVE, 6 PASSED, 3 FAILED, 2 EXECUTED, 1 CANCELLED */
const STATUS_PLAN: ProposalStatus[] = [
  'DRAFT', 'DRAFT', 'DRAFT',
  'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE',
  'PASSED', 'PASSED', 'PASSED', 'PASSED', 'PASSED', 'PASSED',
  'FAILED', 'FAILED', 'FAILED',
  'EXECUTED', 'EXECUTED',
  'CANCELLED',
];

const TREASURY_MEMOS: Record<TreasuryActionKind, readonly string[]> = {
  ALLOCATION: [
    'Allocated to operations multisig',
    'Developer grant disbursement',
    'Liquidity mining incentive allocation',
    'Infrastructure expansion fund',
  ],
  DISTRIBUTION: [
    'Staking reward distribution — epoch 42',
    'Community grant payout — Round 3',
    'Operator incentive distribution',
    'Validator reward payout',
  ],
  RESERVE: [
    'Moved to protocol reserve',
    'Emergency fund top-up',
    'Insurance reserve contribution',
    'Audit escrow deposit',
  ],
  BURN: [
    'Protocol fee burn — weekly',
    'Buyback and burn execution',
    'Excess supply reduction',
    'Retirement-linked token burn',
  ],
};

// ─── Generators ─────────────────────────────────────────

export function generateProposals(rng: Rng): Proposal[] {
  const proposals: Proposal[] = [];

  for (let i = 0; i < 20; i++) {
    const tmpl = TEMPLATES[i];
    const status = STATUS_PLAN[i];

    const createdAt = daysAgo(randInt(rng, 2, 120));
    const votingStartsAt = offsetFrom(createdAt, 2 * 86_400_000);
    const votingEndsAt = offsetFrom(votingStartsAt, 5 * 86_400_000);

    const executedAt = status === 'EXECUTED'
      ? offsetFrom(votingEndsAt, randInt(rng, 86_400_000, 3 * 86_400_000))
      : null;

    let votesFor: number, votesAgainst: number, votesAbstain: number, totalVoters: number;

    switch (status) {
      case 'DRAFT':
        votesFor = 0; votesAgainst = 0; votesAbstain = 0; totalVoters = 0;
        break;
      case 'ACTIVE':
        votesFor = round(randFloat(rng, 5_000, 50_000), 0);
        votesAgainst = round(randFloat(rng, 2_000, 30_000), 0);
        votesAbstain = round(randFloat(rng, 500, 5_000), 0);
        totalVoters = randInt(rng, 20, 120);
        break;
      case 'PASSED': case 'EXECUTED':
        votesFor = round(randFloat(rng, 40_000, 120_000), 0);
        votesAgainst = round(randFloat(rng, 5_000, 30_000), 0);
        votesAbstain = round(randFloat(rng, 1_000, 8_000), 0);
        totalVoters = randInt(rng, 60, 200);
        break;
      case 'FAILED':
        votesFor = round(randFloat(rng, 5_000, 25_000), 0);
        votesAgainst = round(randFloat(rng, 30_000, 80_000), 0);
        votesAbstain = round(randFloat(rng, 2_000, 10_000), 0);
        totalVoters = randInt(rng, 40, 150);
        break;
      case 'CANCELLED':
        votesFor = round(randFloat(rng, 1_000, 5_000), 0);
        votesAgainst = round(randFloat(rng, 500, 3_000), 0);
        votesAbstain = round(randFloat(rng, 200, 1_500), 0);
        totalVoters = randInt(rng, 5, 30);
        break;
      default:
        votesFor = 0; votesAgainst = 0; votesAbstain = 0; totalVoters = 0;
    }

    proposals.push({
      id: `prop-${hexId(rng, 8)}`,
      title: tmpl.title,
      description: tmpl.description,
      type: tmpl.type,
      status,
      proposer: chance(rng, 0.5) ? xrplAddress(rng) : evmAddress(rng),
      createdAt,
      votingStartsAt,
      votingEndsAt,
      executedAt,
      votesFor,
      votesAgainst,
      votesAbstain,
      quorum: round(0.15 + rng() * 0.10, 4),
      totalVoters,
    });
  }

  return proposals;
}

export function generateVotes(rng: Rng, proposals: Proposal[]): DAOVote[] {
  const votable = proposals.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'PASSED' || p.status === 'FAILED' || p.status === 'EXECUTED',
  );
  const choices: VoteChoice[] = ['FOR', 'AGAINST', 'ABSTAIN'];
  const votes: DAOVote[] = [];

  for (let i = 0; i < 200; i++) {
    const proposal = pick(rng, votable);

    // Bias choice based on outcome
    let choice: VoteChoice;
    const roll = rng();
    if (proposal.status === 'PASSED' || proposal.status === 'EXECUTED') {
      choice = roll < 0.65 ? 'FOR' : roll < 0.85 ? 'AGAINST' : 'ABSTAIN';
    } else if (proposal.status === 'FAILED') {
      choice = roll < 0.30 ? 'FOR' : roll < 0.80 ? 'AGAINST' : 'ABSTAIN';
    } else {
      choice = pick(rng, choices);
    }

    votes.push({
      id: `vote-${hexId(rng, 12)}`,
      proposalId: proposal.id,
      voter: chance(rng, 0.6) ? xrplAddress(rng) : evmAddress(rng),
      choice,
      weight: round(randFloat(rng, 50, 5_000), 2),
      castAt: offsetFrom(proposal.votingStartsAt, randInt(rng, 0, 5 * 86_400_000)),
    });
  }

  return votes;
}

export function generateTreasuryActions(rng: Rng, proposals: Proposal[]): TreasuryAction[] {
  const KIND_PLAN: TreasuryActionKind[] = [
    ...Array(10).fill('ALLOCATION' as TreasuryActionKind),
    ...Array(8).fill('DISTRIBUTION' as TreasuryActionKind),
    ...Array(7).fill('RESERVE' as TreasuryActionKind),
    ...Array(5).fill('BURN' as TreasuryActionKind),
  ];
  const treasuryTokens: Token[] = ['NXS', 'WTR', 'ENG', 'RLUSD', 'USDC'];
  const linkable = proposals.filter((p) => p.status === 'EXECUTED' || p.status === 'PASSED');

  const actions: TreasuryAction[] = [];

  for (let i = 0; i < 30; i++) {
    const kind = KIND_PLAN[i];
    const token = pick(rng, treasuryTokens);

    actions.push({
      id: `trsry-${hexId(rng, 12)}`,
      kind,
      token,
      amount: round(randFloat(rng, 500, 250_000), 2),
      recipient: kind === 'BURN'
        ? '0x0000000000000000000000000000000000000000'
        : chance(rng, 0.5) ? xrplAddress(rng) : evmAddress(rng),
      proposalId: chance(rng, 0.6) && linkable.length > 0
        ? pick(rng, linkable).id
        : null,
      executedAt: daysAgo(randInt(rng, 0, 90)),
      txHash: txHash(rng),
      memo: pick(rng, TREASURY_MEMOS[kind]),
    });
  }

  return actions;
}
