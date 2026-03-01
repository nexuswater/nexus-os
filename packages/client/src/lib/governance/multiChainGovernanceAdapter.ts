/**
 * Multi-chain governance adapter.
 * Determines the user's active chain and routes governance actions
 * to the correct contract (hub or spoke).
 */

import { NEXUS_CHAINS, findChainByChainId, type NexusChainConfig } from '@nexus/shared';

export type VoteChoice = 'for' | 'against' | 'abstain';

export interface GovernanceAction {
  chainKey: string;
  chainName: string;
  isHub: boolean;
  txHash: string;
}

export interface MultiChainGovernanceAdapter {
  /** Get the user's active governance chain based on connected wallet */
  getActiveChain(evmChainId: number | null): NexusChainConfig | null;

  /** Whether the user is on the hub chain */
  isOnHub(evmChainId: number | null): boolean;

  /** Whether the user is on any supported governance chain */
  isOnSupportedChain(evmChainId: number | null): boolean;

  /** Vote on a proposal (routes to hub or spoke based on active chain) */
  vote(proposalId: number, choice: VoteChoice, evmChainId: number): Promise<GovernanceAction>;

  /** Create a proposal (hub only) */
  createProposal(title: string, description: string, evmChainId: number): Promise<GovernanceAction>;

  /** Finalize a proposal (hub only) */
  finalize(proposalId: number, evmChainId: number): Promise<GovernanceAction>;

  /** Delegate voting power (hub only in v1) */
  delegate(operator: string, scope: number, feeBps: number, expiry: number, evmChainId: number): Promise<GovernanceAction>;

  /** Revoke delegation */
  undelegate(evmChainId: number): Promise<GovernanceAction>;
}

function voteChoiceToUint8(choice: VoteChoice): number {
  switch (choice) {
    case 'for': return 0;
    case 'against': return 1;
    case 'abstain': return 2;
  }
}

class MultiChainGovernanceAdapterImpl implements MultiChainGovernanceAdapter {
  getActiveChain(evmChainId: number | null): NexusChainConfig | null {
    if (!evmChainId) return null;
    return findChainByChainId(evmChainId) ?? null;
  }

  isOnHub(evmChainId: number | null): boolean {
    const chain = this.getActiveChain(evmChainId);
    return chain?.role === 'hub';
  }

  isOnSupportedChain(evmChainId: number | null): boolean {
    return this.getActiveChain(evmChainId) !== null;
  }

  async vote(proposalId: number, choice: VoteChoice, evmChainId: number): Promise<GovernanceAction> {
    const chain = this.getActiveChain(evmChainId);
    if (!chain) throw new Error('Not on a supported governance chain');

    // In mock mode, simulate tx
    const txHash = `0xmock_vote_${proposalId}_${choice}_${chain.id}`;

    return {
      chainKey: chain.id,
      chainName: chain.name,
      isHub: chain.role === 'hub',
      txHash,
    };
  }

  async createProposal(title: string, description: string, evmChainId: number): Promise<GovernanceAction> {
    const chain = this.getActiveChain(evmChainId);
    if (!chain || chain.role !== 'hub') {
      throw new Error('Proposals can only be created on the hub chain (Base)');
    }

    const txHash = `0xmock_propose_${Date.now()}`;
    return {
      chainKey: chain.id,
      chainName: chain.name,
      isHub: true,
      txHash,
    };
  }

  async finalize(proposalId: number, evmChainId: number): Promise<GovernanceAction> {
    const chain = this.getActiveChain(evmChainId);
    if (!chain || chain.role !== 'hub') {
      throw new Error('Proposals can only be finalized on the hub chain (Base)');
    }

    return {
      chainKey: chain.id,
      chainName: chain.name,
      isHub: true,
      txHash: `0xmock_finalize_${proposalId}`,
    };
  }

  async delegate(operator: string, scope: number, feeBps: number, expiry: number, evmChainId: number): Promise<GovernanceAction> {
    const chain = this.getActiveChain(evmChainId);
    if (!chain || chain.role !== 'hub') {
      throw new Error('Delegation is only available on the hub chain (Base) in v1');
    }

    return {
      chainKey: chain.id,
      chainName: chain.name,
      isHub: true,
      txHash: `0xmock_delegate_${operator}_${scope}`,
    };
  }

  async undelegate(evmChainId: number): Promise<GovernanceAction> {
    const chain = this.getActiveChain(evmChainId);
    if (!chain || chain.role !== 'hub') {
      throw new Error('Undelegation is only available on the hub chain (Base) in v1');
    }

    return {
      chainKey: chain.id,
      chainName: chain.name,
      isHub: true,
      txHash: `0xmock_undelegate`,
    };
  }
}

export const multiChainGovernance = new MultiChainGovernanceAdapterImpl();
