import type { NetworkMode } from '@nexus/shared';

/** XRPL connection configuration */
export interface XRPLConfig {
  network: NetworkMode;
  endpoint: string;
  explorer_base: string;
}

export const XRPL_CONFIGS: Record<NetworkMode, XRPLConfig> = {
  mainnet: {
    network: 'mainnet',
    endpoint: 'wss://xrplcluster.com',
    explorer_base: 'https://livenet.xrpl.org',
  },
  testnet: {
    network: 'testnet',
    endpoint: 'wss://s.altnet.rippletest.net:51233',
    explorer_base: 'https://testnet.xrpl.org',
  },
  devnet: {
    network: 'devnet',
    endpoint: 'wss://s.devnet.rippletest.net:51233',
    explorer_base: 'https://devnet.xrpl.org',
  },
};

/** Build an explorer URL for a transaction */
export function txExplorerUrl(network: NetworkMode, txHash: string): string {
  return `${XRPL_CONFIGS[network].explorer_base}/transactions/${txHash}`;
}

/** Build an explorer URL for an account */
export function accountExplorerUrl(network: NetworkMode, address: string): string {
  return `${XRPL_CONFIGS[network].explorer_base}/accounts/${address}`;
}
