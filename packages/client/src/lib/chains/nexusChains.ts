/**
 * Client Chain Registry — wraps the shared NEXUS_CHAINS config
 * with client-specific helpers for wallet interaction.
 */

import {
  NEXUS_CHAINS,
  DEFAULT_MULTI_CHAIN_CONFIG,
  getHubChain,
  getSpokeChains,
  getActiveChains,
  findChainByChainId,
  type NexusChainConfig,
  type MultiChainGovernanceConfig,
} from '@nexus/shared';

// Re-export everything from shared
export {
  NEXUS_CHAINS,
  DEFAULT_MULTI_CHAIN_CONFIG,
  getHubChain,
  getSpokeChains,
  getActiveChains,
  findChainByChainId,
};
export type { NexusChainConfig, MultiChainGovernanceConfig };

/**
 * Check if a chainId is supported by Nexus governance.
 */
export function isSupportedChainId(chainId: number): boolean {
  return findChainByChainId(chainId) !== undefined;
}

/**
 * Get the chain key (e.g. 'BASE') from a chainId.
 */
export function getChainKeyByChainId(chainId: number): string | null {
  const chain = findChainByChainId(chainId);
  return chain?.id ?? null;
}

/**
 * Get chain config for adding to MetaMask via wallet_addEthereumChain.
 */
export function getAddChainParams(chainKey: string): {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
} | null {
  const chain = NEXUS_CHAINS[chainKey];
  if (!chain) return null;

  const nativeCurrencies: Record<string, { name: string; symbol: string; decimals: number }> = {
    ETH: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    XRP: { name: 'XRP', symbol: 'XRP', decimals: 18 },
    HYPE: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  };

  return {
    chainId: '0x' + chain.chainId.toString(16),
    chainName: chain.name,
    rpcUrls: [chain.rpcUrl],
    blockExplorerUrls: [chain.explorerUrl],
    nativeCurrency: nativeCurrencies[chain.gasToken] ?? { name: chain.gasToken, symbol: chain.gasToken, decimals: 18 },
  };
}

/**
 * Request MetaMask to add a chain if it's not already added.
 */
export async function addChainToWallet(chainKey: string): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) return false;

  const params = getAddChainParams(chainKey);
  if (!params) return false;

  try {
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all chains formatted for a dropdown/selector UI.
 */
export function getChainOptions(): { key: string; label: string; chainId: number; role: string; gasToken: string }[] {
  return getActiveChains().map(c => ({
    key: c.id,
    label: c.name,
    chainId: c.chainId,
    role: c.role,
    gasToken: c.gasToken,
  }));
}

/**
 * LocalStorage key for persisting last connected chain.
 */
const LAST_CHAIN_KEY = 'nexus_last_chain';

export function getLastConnectedChain(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_CHAIN_KEY);
}

export function setLastConnectedChain(chainKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_CHAIN_KEY, chainKey);
}

export function clearLastConnectedChain(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LAST_CHAIN_KEY);
}
