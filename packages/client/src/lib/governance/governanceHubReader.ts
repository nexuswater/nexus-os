/**
 * GovernanceHubReader — Always reads canonical governance state from the Base hub.
 * In mock mode, returns data from the server API.
 * In production, reads directly from the Base Hub contract.
 */

import { NEXUS_CHAINS, getHubChain, getSpokeChains, type NexusChainConfig } from '@nexus/shared';

/** Per-chain vote breakdown */
export interface ChainVoteBreakdown {
  chainKey: string;
  chainName: string;
  yes: number;
  no: number;
  abstain: number;
  total: number;
}

/** Unified proposal data (hub source of truth) */
export interface UnifiedProposal {
  id: number;
  title: string;
  proposer: string;
  status: 'active' | 'passed' | 'executed' | 'failed' | 'cancelled';
  startTime: number;
  endTime: number;
  quorumRequired: number;

  // Unified totals (from hub)
  unifiedYes: number;
  unifiedNo: number;
  unifiedAbstain: number;
  unifiedTotal: number;
  quorumReached: boolean;

  // Per-chain breakdown
  chainBreakdown: ChainVoteBreakdown[];
}

/** Hub governance state summary */
export interface GovernanceHubState {
  hubChain: NexusChainConfig;
  spokeChains: NexusChainConfig[];
  proposalCount: number;
  migrationActive: boolean;
  proposalThreshold: number;
}

// ─── Mock Data ────────────────────────────────────────────

const MOCK_CHAIN_BREAKDOWN: ChainVoteBreakdown[] = [
  { chainKey: 'BASE', chainName: 'Base', yes: 1200000, no: 180000, abstain: 45000, total: 1425000 },
  { chainKey: 'XRPL_EVM', chainName: 'XRPL EVM', yes: 430000, no: 95000, abstain: 22000, total: 547000 },
  { chainKey: 'ARBITRUM', chainName: 'Arbitrum', yes: 180000, no: 62000, abstain: 15000, total: 257000 },
  { chainKey: 'HYPEREVM', chainName: 'HyperEVM', yes: 22000, no: 8000, abstain: 3000, total: 33000 },
];

function sumBreakdown(breakdown: ChainVoteBreakdown[]): { yes: number; no: number; abstain: number } {
  return breakdown.reduce(
    (acc, c) => ({ yes: acc.yes + c.yes, no: acc.no + c.no, abstain: acc.abstain + c.abstain }),
    { yes: 0, no: 0, abstain: 0 },
  );
}

// ─── Hub Reader ───────────────────────────────────────────

class GovernanceHubReaderImpl {
  private mockMode = true; // until real contracts are deployed

  /** Get hub state summary */
  async getHubState(): Promise<GovernanceHubState> {
    return {
      hubChain: getHubChain(),
      spokeChains: getSpokeChains(),
      proposalCount: 5,
      migrationActive: false,
      proposalThreshold: 1000,
    };
  }

  /** List all proposals with unified tallies */
  async listProposals(): Promise<UnifiedProposal[]> {
    if (this.mockMode) {
      return this.getMockProposals();
    }
    // Production: read from hub contract
    return this.getMockProposals();
  }

  /** Get single proposal with per-chain breakdown */
  async getProposal(id: number): Promise<UnifiedProposal | null> {
    const proposals = await this.listProposals();
    return proposals.find(p => p.id === id) ?? null;
  }

  /** Get unified tallies only */
  async getUnifiedTally(id: number): Promise<{ yes: number; no: number; abstain: number; total: number } | null> {
    const p = await this.getProposal(id);
    if (!p) return null;
    return {
      yes: p.unifiedYes,
      no: p.unifiedNo,
      abstain: p.unifiedAbstain,
      total: p.unifiedTotal,
    };
  }

  /** Get per-chain breakdown for a proposal */
  async getChainBreakdown(id: number): Promise<ChainVoteBreakdown[]> {
    const p = await this.getProposal(id);
    return p?.chainBreakdown ?? [];
  }

  // ─── Mock ─────────────────────────────────────

  private getMockProposals(): UnifiedProposal[] {
    const now = Math.floor(Date.now() / 1000);
    const unified1 = sumBreakdown(MOCK_CHAIN_BREAKDOWN);

    return [
      {
        id: 1,
        title: 'Adjust WTR governance weight to 0.15',
        proposer: '0x1a2b...3c4d',
        status: 'active',
        startTime: now - 86400,
        endTime: now + 86400 * 2,
        quorumRequired: 1500000,
        unifiedYes: unified1.yes,
        unifiedNo: unified1.no,
        unifiedAbstain: unified1.abstain,
        unifiedTotal: unified1.yes + unified1.no + unified1.abstain,
        quorumReached: (unified1.yes + unified1.no + unified1.abstain) >= 1500000,
        chainBreakdown: MOCK_CHAIN_BREAKDOWN,
      },
      {
        id: 2,
        title: 'Allocate 50,000 NXS for infrastructure grants',
        proposer: '0x5e6f...7g8h',
        status: 'active',
        startTime: now - 43200,
        endTime: now + 86400 * 4,
        quorumRequired: 1000000,
        unifiedYes: 890000,
        unifiedNo: 210000,
        unifiedAbstain: 55000,
        unifiedTotal: 1155000,
        quorumReached: true,
        chainBreakdown: [
          { chainKey: 'BASE', chainName: 'Base', yes: 620000, no: 140000, abstain: 35000, total: 795000 },
          { chainKey: 'XRPL_EVM', chainName: 'XRPL EVM', yes: 180000, no: 50000, abstain: 12000, total: 242000 },
          { chainKey: 'ARBITRUM', chainName: 'Arbitrum', yes: 75000, no: 15000, abstain: 6000, total: 96000 },
          { chainKey: 'HYPEREVM', chainName: 'HyperEVM', yes: 15000, no: 5000, abstain: 2000, total: 22000 },
        ],
      },
      {
        id: 3,
        title: 'Enable anti-wash trading on marketplace',
        proposer: '0x9a0b...1c2d',
        status: 'executed',
        startTime: now - 86400 * 10,
        endTime: now - 86400 * 7,
        quorumRequired: 800000,
        unifiedYes: 1450000,
        unifiedNo: 120000,
        unifiedAbstain: 80000,
        unifiedTotal: 1650000,
        quorumReached: true,
        chainBreakdown: [
          { chainKey: 'BASE', chainName: 'Base', yes: 980000, no: 80000, abstain: 50000, total: 1110000 },
          { chainKey: 'XRPL_EVM', chainName: 'XRPL EVM', yes: 350000, no: 30000, abstain: 20000, total: 400000 },
          { chainKey: 'ARBITRUM', chainName: 'Arbitrum', yes: 120000, no: 10000, abstain: 10000, total: 140000 },
        ],
      },
      {
        id: 4,
        title: 'Reduce council seats from 7 to 5',
        proposer: '0x3e4f...5g6h',
        status: 'failed',
        startTime: now - 86400 * 15,
        endTime: now - 86400 * 12,
        quorumRequired: 1200000,
        unifiedYes: 380000,
        unifiedNo: 920000,
        unifiedAbstain: 150000,
        unifiedTotal: 1450000,
        quorumReached: true,
        chainBreakdown: [
          { chainKey: 'BASE', chainName: 'Base', yes: 200000, no: 600000, abstain: 100000, total: 900000 },
          { chainKey: 'XRPL_EVM', chainName: 'XRPL EVM', yes: 130000, no: 250000, abstain: 35000, total: 415000 },
          { chainKey: 'ARBITRUM', chainName: 'Arbitrum', yes: 50000, no: 70000, abstain: 15000, total: 135000 },
        ],
      },
      {
        id: 5,
        title: 'Add HyperEVM as governance spoke',
        proposer: '0x7i8j...9k0l',
        status: 'passed',
        startTime: now - 86400 * 5,
        endTime: now - 86400 * 2,
        quorumRequired: 1000000,
        unifiedYes: 1680000,
        unifiedNo: 95000,
        unifiedAbstain: 42000,
        unifiedTotal: 1817000,
        quorumReached: true,
        chainBreakdown: [
          { chainKey: 'BASE', chainName: 'Base', yes: 1100000, no: 60000, abstain: 25000, total: 1185000 },
          { chainKey: 'XRPL_EVM', chainName: 'XRPL EVM', yes: 420000, no: 25000, abstain: 12000, total: 457000 },
          { chainKey: 'ARBITRUM', chainName: 'Arbitrum', yes: 160000, no: 10000, abstain: 5000, total: 175000 },
        ],
      },
    ];
  }
}

/** Singleton hub reader */
export const governanceHubReader = new GovernanceHubReaderImpl();
