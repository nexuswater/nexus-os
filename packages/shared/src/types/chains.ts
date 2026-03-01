/** Chain role in governance architecture */
export type ChainRole = 'hub' | 'spoke';

/** Rail type */
export type RailType = 'evm' | 'xrpl';

/** Chain definition for multi-chain governance */
export interface NexusChainConfig {
  /** Unique identifier (uppercase) */
  id: string;
  /** Display name */
  name: string;
  /** Chain ID (EVM) */
  chainId: number;
  /** Role in hub-and-spoke architecture */
  role: ChainRole;
  /** Rail type */
  rail: RailType;
  /** Axelar GMP chain name identifier */
  axelarName: string;
  /** Deployed governance contract address (filled after deployment) */
  governanceContract: string;
  /** NXS token contract address on this chain */
  nxsTokenContract: string;
  /** RPC endpoint */
  rpcUrl: string;
  /** Block explorer URL */
  explorerUrl: string;
  /** Whether this chain is currently active for governance */
  active: boolean;
  /** Native gas token symbol */
  gasToken: string;
  /** Optional: bridge contract for NXS */
  bridgeContract?: string;
}

/** Multi-chain governance system config */
export interface MultiChainGovernanceConfig {
  /** Current hub chain ID */
  hubChainId: string;
  /** All registered chains */
  chains: Record<string, NexusChainConfig>;
  /** Axelar payload version */
  axelarPayloadVersion: number;
  /** Whether hub migration is active */
  migrationActive: boolean;
  /** Next hub chain ID (if migration in progress) */
  nextHubChainId?: string;
}

/** Axelar GMP message types */
export type AxelarMessageKind = 'VOTE_DELTA' | 'PROPOSAL_CREATED' | 'RESULT_BROADCAST';

/** Vote delta payload (Axelar GMP) */
export interface VoteDeltaPayload {
  kind: 'VOTE_DELTA';
  proposalId: number;
  yesDelta: number;
  noDelta: number;
  abstainDelta: number;
  nonce: number;
  sourceChainId: number;
}

/** Proposal creation payload (Axelar GMP) */
export interface ProposalCreatedPayload {
  kind: 'PROPOSAL_CREATED';
  proposalId: number;
  start: number;
  end: number;
  quorumRequired: number;
  title: string;
}

export const NEXUS_CHAINS: Record<string, NexusChainConfig> = {
  BASE: {
    id: 'BASE',
    name: 'Base',
    chainId: 8453,
    role: 'hub',
    rail: 'evm',
    axelarName: 'base',
    governanceContract: '', // deployed address TBD
    nxsTokenContract: '',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    active: true,
    gasToken: 'ETH',
  },
  XRPL_EVM: {
    id: 'XRPL_EVM',
    name: 'XRPL EVM',
    chainId: 1440000,
    role: 'spoke',
    rail: 'evm',
    axelarName: 'xrpl-evm',
    governanceContract: '',
    nxsTokenContract: '',
    rpcUrl: 'https://rpc.xrplevm.org/',
    explorerUrl: 'https://explorer.xrplevm.org',
    active: true,
    gasToken: 'XRP',
  },
  ARBITRUM: {
    id: 'ARBITRUM',
    name: 'Arbitrum',
    chainId: 42161,
    role: 'spoke',
    rail: 'evm',
    axelarName: 'arbitrum',
    governanceContract: '',
    nxsTokenContract: '',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    active: true,
    gasToken: 'ETH',
  },
  HYPEREVM: {
    id: 'HYPEREVM',
    name: 'HyperEVM',
    chainId: 998,
    role: 'spoke',
    rail: 'evm',
    axelarName: 'hyperevm',
    governanceContract: '',
    nxsTokenContract: '',
    rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
    explorerUrl: 'https://explorer.hyperliquid.xyz',
    active: true,
    gasToken: 'HYPE',
  },
};

export const DEFAULT_MULTI_CHAIN_CONFIG: MultiChainGovernanceConfig = {
  hubChainId: 'BASE',
  chains: NEXUS_CHAINS,
  axelarPayloadVersion: 1,
  migrationActive: false,
};

/** Helper: get the hub chain config */
export function getHubChain(config: MultiChainGovernanceConfig = DEFAULT_MULTI_CHAIN_CONFIG): NexusChainConfig {
  return config.chains[config.hubChainId];
}

/** Helper: get all active spoke chains */
export function getSpokeChains(config: MultiChainGovernanceConfig = DEFAULT_MULTI_CHAIN_CONFIG): NexusChainConfig[] {
  return Object.values(config.chains).filter(c => c.role === 'spoke' && c.active);
}

/** Helper: get all active chains */
export function getActiveChains(config: MultiChainGovernanceConfig = DEFAULT_MULTI_CHAIN_CONFIG): NexusChainConfig[] {
  return Object.values(config.chains).filter(c => c.active);
}

/** Helper: find chain by chainId */
export function findChainByChainId(chainId: number, config: MultiChainGovernanceConfig = DEFAULT_MULTI_CHAIN_CONFIG): NexusChainConfig | undefined {
  return Object.values(config.chains).find(c => c.chainId === chainId);
}
