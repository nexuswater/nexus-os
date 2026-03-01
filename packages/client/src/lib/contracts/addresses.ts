import { NEXUS_CHAINS } from '@nexus/shared';

export interface ContractAddresses {
  governance: string;
  nxsToken: string;
}

// Addresses filled after deployment -- placeholders for now
export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  BASE: {
    governance: '0x0000000000000000000000000000000000000000',
    nxsToken: '0x0000000000000000000000000000000000000000',
  },
  XRPL_EVM: {
    governance: '0x0000000000000000000000000000000000000000',
    nxsToken: '0x0000000000000000000000000000000000000000',
  },
  ARBITRUM: {
    governance: '0x0000000000000000000000000000000000000000',
    nxsToken: '0x0000000000000000000000000000000000000000',
  },
  HYPEREVM: {
    governance: '0x0000000000000000000000000000000000000000',
    nxsToken: '0x0000000000000000000000000000000000000000',
  },
};

export function getContractAddresses(chainKey: string): ContractAddresses | undefined {
  return CONTRACT_ADDRESSES[chainKey];
}
