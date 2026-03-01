import { NEXUS_CHAINS, type NexusChainConfig } from '@nexus/shared';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { GOVERNANCE_HUB_ABI } from '../contracts/abis/NexusGovernanceHub';
import { GOVERNANCE_MIRROR_ABI } from '../contracts/abis/NexusGovernanceMirror';

// Re-export ABIs so downstream consumers can access them through this module
export { GOVERNANCE_HUB_ABI, GOVERNANCE_MIRROR_ABI };

export interface EVMClientConfig {
  chainKey: string;
  provider?: unknown; // ethers.Provider in production
  signer?: unknown;   // ethers.Signer in production
}

export interface EVMClient {
  chainKey: string;
  chainConfig: NexusChainConfig;
  isHub: boolean;
  addresses: { governance: string; nxsToken: string };

  // Read methods (mock for now)
  getProposalCount(): Promise<number>;
  getProposal(id: number): Promise<OnChainProposal | null>;
  getUnifiedTally(id: number): Promise<{ yes: bigint; no: bigint; abstain: bigint }>;
  getVotingPower(address: string): Promise<bigint>;
  hasVoted(proposalId: number, address: string): Promise<boolean>;

  // Write methods (mock for now)
  vote(proposalId: number, choice: 0 | 1 | 2): Promise<string>; // returns tx hash
  propose(title: string, duration: number, quorum: bigint): Promise<{ proposalId: number; txHash: string }>;
  delegate(operator: string, scope: number, feeBps: number, expiry: number): Promise<string>;
  undelegate(): Promise<string>;
}

export interface OnChainProposal {
  id: number;
  proposer: string;
  title: string;
  start: number;
  end: number;
  status: number;
  localYes: bigint;
  localNo: bigint;
  localAbstain: bigint;
  unifiedYes: bigint;
  unifiedNo: bigint;
  unifiedAbstain: bigint;
  quorumRequired: bigint;
}

// Returns whether we're in mock mode (no real contracts deployed)
function isMockMode(): boolean {
  const addresses = CONTRACT_ADDRESSES['BASE'];
  return !addresses || addresses.governance === '0x0000000000000000000000000000000000000000';
}

// Factory
export function createEVMClient(config: EVMClientConfig): EVMClient {
  const chainConfig = NEXUS_CHAINS[config.chainKey];
  if (!chainConfig) throw new Error(`Unknown chain: ${config.chainKey}`);

  const addresses = CONTRACT_ADDRESSES[config.chainKey] ?? { governance: '', nxsToken: '' };
  const isHub = chainConfig.role === 'hub';

  if (isMockMode()) {
    return createMockEVMClient(config.chainKey, chainConfig, isHub, addresses);
  }

  // Production: would create ethers Contract instances here
  return createMockEVMClient(config.chainKey, chainConfig, isHub, addresses);
}

function createMockEVMClient(
  chainKey: string,
  chainConfig: NexusChainConfig,
  isHub: boolean,
  addresses: { governance: string; nxsToken: string },
): EVMClient {
  return {
    chainKey,
    chainConfig,
    isHub,
    addresses,

    async getProposalCount() {
      return 5;
    },
    async getProposal(id) {
      return {
        id,
        proposer: '0x1234...mock',
        title: `Proposal #${id}`,
        start: Math.floor(Date.now() / 1000) - 86400,
        end: Math.floor(Date.now() / 1000) + 86400 * 2,
        status: 0, // Active
        localYes: BigInt(450000),
        localNo: BigInt(120000),
        localAbstain: BigInt(30000),
        unifiedYes: BigInt(1200000),
        unifiedNo: BigInt(380000),
        unifiedAbstain: BigInt(85000),
        quorumRequired: BigInt(500000),
      };
    },
    async getUnifiedTally(_id) {
      return { yes: BigInt(1200000), no: BigInt(380000), abstain: BigInt(85000) };
    },
    async getVotingPower(_address) {
      return BigInt(24750);
    },
    async hasVoted(_proposalId, _address) {
      return false;
    },
    async vote(_proposalId, _choice) {
      return '0xmock_vote_tx_hash';
    },
    async propose(_title, _duration, _quorum) {
      return { proposalId: 6, txHash: '0xmock_propose_tx' };
    },
    async delegate(_operator, _scope, _feeBps, _expiry) {
      return '0xmock_delegate_tx';
    },
    async undelegate() {
      return '0xmock_undelegate_tx';
    },
  };
}

// Helper: switch EVM network via wallet provider (MetaMask / injected)
export async function switchNetwork(chainId: number): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) return false;
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + chainId.toString(16) }],
    });
    return true;
  } catch (e: any) {
    // Chain not added -- could call wallet_addEthereumChain here
    console.warn('Failed to switch network:', e);
    return false;
  }
}

// Helper: get current connected chain ID from injected provider
export async function getConnectedChainId(): Promise<number | null> {
  if (typeof window === 'undefined' || !(window as any).ethereum) return null;
  try {
    const hexChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
    return parseInt(hexChainId, 16);
  } catch {
    return null;
  }
}
