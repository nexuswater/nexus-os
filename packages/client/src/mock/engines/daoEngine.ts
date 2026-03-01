/**
 * daoEngine.ts — DAO governance engine.
 * Manages proposal lifecycle (DRAFT → ACTIVE → PASSED/FAILED → EXECUTED),
 * vote casting, and automatic state advancement.
 */
import type { Rng } from '../seed';
import {
  uuid, hexId, round, randFloat, xrplAddress, evmAddress, chance,
} from '../seed';
import type {
  Proposal, ProposalStatus, ProposalType,
  DAOVote, VoteChoice,
} from '../types';

// ─── Event types ────────────────────────────────────────

export type DAOEventKind = 'PROPOSAL_CREATED' | 'PROPOSAL_ADVANCED' | 'PROPOSAL_EXECUTED' | 'VOTE_CAST';

export interface DAOEvent {
  kind: DAOEventKind;
  proposalId: string;
  status?: ProposalStatus;
  voter?: string;
  choice?: VoteChoice;
  weight?: number;
  timestamp: string;
}

export type DAOListener = (evt: DAOEvent) => void;

// ─── Engine ─────────────────────────────────────────────

export class DAOEngine {
  private proposals: Map<string, Proposal>;
  private votes: DAOVote[] = [];
  private rng: Rng;
  private listeners: DAOListener[] = [];

  constructor(rng: Rng, proposals: Proposal[], votes: DAOVote[]) {
    this.rng = rng;
    this.proposals = new Map(proposals.map((p) => [p.id, { ...p }]));
    this.votes = [...votes];
  }

  onEvent(fn: DAOListener): void {
    this.listeners.push(fn);
  }

  private emit(evt: DAOEvent): void {
    for (const fn of this.listeners) fn(evt);
  }

  /** Create a new proposal in DRAFT status. */
  createProposal(
    title: string,
    type: ProposalType,
    description: string,
    proposer?: string,
  ): Proposal {
    const now = new Date();
    const votingStartsAt = now.toISOString();                                       // starts immediately
    const votingEndsAt = new Date(now.getTime() + 7 * 86_400_000).toISOString();   // +7 days

    const proposal: Proposal = {
      id: `prop-${hexId(this.rng, 8)}`,
      title,
      description,
      type,
      status: 'ACTIVE',
      proposer: proposer ?? (chance(this.rng, 0.5) ? xrplAddress(this.rng) : evmAddress(this.rng)),
      createdAt: now.toISOString(),
      votingStartsAt,
      votingEndsAt,
      executedAt: null,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorum: 0.20,
      totalVoters: 0,
    };

    this.proposals.set(proposal.id, proposal);

    this.emit({
      kind: 'PROPOSAL_CREATED',
      proposalId: proposal.id,
      status: 'DRAFT',
      timestamp: now.toISOString(),
    });

    return proposal;
  }

  /** Cast a vote on a proposal. */
  vote(proposalId: string, choice: VoteChoice, weight: number, voter?: string): DAOVote | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'ACTIVE') return null;

    const now = new Date().toISOString();
    const voterAddr = voter ?? (chance(this.rng, 0.6) ? xrplAddress(this.rng) : evmAddress(this.rng));

    const vote: DAOVote = {
      id: `vote-${hexId(this.rng, 12)}`,
      proposalId,
      voter: voterAddr,
      choice,
      weight: round(weight, 2),
      castAt: now,
    };

    this.votes.push(vote);

    // Update tally
    switch (choice) {
      case 'FOR':     proposal.votesFor += weight; break;
      case 'AGAINST': proposal.votesAgainst += weight; break;
      case 'ABSTAIN': proposal.votesAbstain += weight; break;
    }
    proposal.totalVoters += 1;

    this.emit({
      kind: 'VOTE_CAST',
      proposalId,
      voter: voterAddr,
      choice,
      weight,
      timestamp: now,
    });

    return vote;
  }

  /** Advance proposals based on current time. Returns list of state changes. */
  advanceProposals(): Array<{ proposalId: string; from: ProposalStatus; to: ProposalStatus }> {
    const now = Date.now();
    const changes: Array<{ proposalId: string; from: ProposalStatus; to: ProposalStatus }> = [];

    for (const proposal of this.proposals.values()) {
      const from = proposal.status;

      if (from === 'DRAFT' && now >= new Date(proposal.votingStartsAt).getTime()) {
        proposal.status = 'ACTIVE';
        changes.push({ proposalId: proposal.id, from, to: 'ACTIVE' });
        this.emit({
          kind: 'PROPOSAL_ADVANCED',
          proposalId: proposal.id,
          status: 'ACTIVE',
          timestamp: new Date().toISOString(),
        });
      } else if (from === 'ACTIVE' && now >= new Date(proposal.votingEndsAt).getTime()) {
        const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        const quorumMet = totalVotes > 0; // simplified: any votes = quorum in mock
        const passed = quorumMet && proposal.votesFor > proposal.votesAgainst;
        const newStatus: ProposalStatus = passed ? 'PASSED' : 'FAILED';

        proposal.status = newStatus;
        changes.push({ proposalId: proposal.id, from, to: newStatus });
        this.emit({
          kind: 'PROPOSAL_ADVANCED',
          proposalId: proposal.id,
          status: newStatus,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return changes;
  }

  /** Execute a passed proposal. */
  executeProposal(proposalId: string): Proposal | null {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'PASSED') return null;

    const now = new Date().toISOString();
    proposal.status = 'EXECUTED';
    proposal.executedAt = now;

    this.emit({
      kind: 'PROPOSAL_EXECUTED',
      proposalId,
      status: 'EXECUTED',
      timestamp: now,
    });

    return proposal;
  }

  /** Get a single proposal by id. */
  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }

  /** Snapshot of all proposals. */
  getProposals(): Proposal[] {
    return [...this.proposals.values()];
  }

  /** All votes, optionally filtered by proposal. */
  getVotes(proposalId?: string): DAOVote[] {
    if (!proposalId) return [...this.votes];
    return this.votes.filter((v) => v.proposalId === proposalId);
  }
}
