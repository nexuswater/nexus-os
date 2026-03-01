/**
 * Bridge Adapter — Cross-rail asset transfers
 *
 * Supports bridging NXS and MPTs between XRPL and EVM chains.
 * Currently a stub/preview — real bridging requires Axelar GMP or custom bridge.
 *
 * IMPORTANT: All bridge functionality is labeled "Bridge (preview)" in the UI.
 */

import { NEXUS_CHAINS, type NexusChainConfig } from '@nexus/shared';

export type BridgeDirection = 'xrpl_to_evm' | 'evm_to_xrpl' | 'evm_to_evm';

export interface BridgeQuoteParams {
  fromChainKey: string;
  toChainKey: string;
  token: string;        // asset symbol (NXS, WTR, ENG, etc.)
  amount: number;
  senderAddress: string;
  recipientAddress: string;
}

export interface BridgeQuote {
  fromChain: NexusChainConfig;
  toChain: NexusChainConfig;
  token: string;
  inputAmount: number;
  outputAmount: number;     // after fees
  bridgeFee: number;
  bridgeFeeToken: string;
  estimatedTimeSec: number;
  provider: string;
  direction: BridgeDirection;
  preview: true;            // always true until real bridge
}

export interface BridgeResult {
  txHash: string;
  status: 'pending' | 'confirming' | 'success' | 'failed';
  fromChainKey: string;
  toChainKey: string;
  token: string;
  amount: number;
  estimatedArrival: number; // unix timestamp
  preview: true;
}

// ─── Direction Detection ────────────────────────────────

function detectDirection(fromKey: string, toKey: string): BridgeDirection {
  const fromChain = NEXUS_CHAINS[fromKey];
  const toChain = NEXUS_CHAINS[toKey];
  if (!fromChain || !toChain) throw new Error('Unknown chain key');

  if (fromKey === 'XRPL' || fromChain.rail === 'xrpl') {
    return 'xrpl_to_evm';
  }
  if (toKey === 'XRPL' || toChain.rail === 'xrpl') {
    return 'evm_to_xrpl';
  }
  return 'evm_to_evm';
}

// ─── Fee Schedule ───────────────────────────────────────

const BRIDGE_FEES: Record<string, number> = {
  NXS: 0.001,   // 0.1% fee
  WTR: 0.002,   // 0.2% fee
  ENG: 0.002,
  RLUSD: 0.0005, // 0.05% for stables
};

function getBridgeFeeRate(token: string): number {
  return BRIDGE_FEES[token] ?? 0.003; // default 0.3%
}

// ─── Public API ─────────────────────────────────────────

/**
 * Get a bridge quote for transferring assets between chains.
 * Always returns preview: true until real bridge integration.
 */
export async function getBridgeQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
  await new Promise(r => setTimeout(r, 300)); // simulate network

  const fromChain = NEXUS_CHAINS[params.fromChainKey];
  const toChain = NEXUS_CHAINS[params.toChainKey];

  if (!fromChain) throw new Error(`Unknown source chain: ${params.fromChainKey}`);
  if (!toChain) throw new Error(`Unknown destination chain: ${params.toChainKey}`);

  const feeRate = getBridgeFeeRate(params.token);
  const fee = params.amount * feeRate;
  const direction = detectDirection(params.fromChainKey, params.toChainKey);

  // Cross-rail takes longer than EVM-to-EVM
  const estimatedTime = direction === 'evm_to_evm' ? 60 : 180;

  return {
    fromChain,
    toChain,
    token: params.token,
    inputAmount: params.amount,
    outputAmount: params.amount - fee,
    bridgeFee: fee,
    bridgeFeeToken: params.token,
    estimatedTimeSec: estimatedTime,
    provider: direction === 'evm_to_evm' ? 'Axelar GMP' : 'Nexus Bridge (preview)',
    direction,
    preview: true,
  };
}

/**
 * Execute a bridge transfer.
 * Currently returns a mock result — real execution requires bridge contract integration.
 */
export async function executeBridge(params: BridgeQuoteParams): Promise<BridgeResult> {
  await new Promise(r => setTimeout(r, 1500)); // simulate tx

  return {
    txHash: `0xbridge_${params.fromChainKey}_${params.toChainKey}_${Date.now().toString(16)}`,
    status: 'pending',
    fromChainKey: params.fromChainKey,
    toChainKey: params.toChainKey,
    token: params.token,
    amount: params.amount,
    estimatedArrival: Math.floor(Date.now() / 1000) + 180,
    preview: true,
  };
}

/**
 * Get bridgeable routes for a given token.
 */
export function getBridgeableRoutes(token: string): { from: string; to: string; available: boolean }[] {
  const evmChains = Object.values(NEXUS_CHAINS).filter(c => c.active);
  const routes: { from: string; to: string; available: boolean }[] = [];

  for (const from of evmChains) {
    for (const to of evmChains) {
      if (from.id === to.id) continue;
      routes.push({
        from: from.id,
        to: to.id,
        available: true,
      });
    }
  }

  // XRPL native routes
  if (['NXS', 'WTR', 'ENG'].includes(token)) {
    for (const chain of evmChains) {
      routes.push({ from: 'XRPL', to: chain.id, available: true });
      routes.push({ from: chain.id, to: 'XRPL', available: true });
    }
  }

  return routes;
}

/**
 * Check if a token can be bridged between two chains.
 */
export function canBridge(token: string, fromChainKey: string, toChainKey: string): boolean {
  const routes = getBridgeableRoutes(token);
  return routes.some(r => r.from === fromChainKey && r.to === toChainKey && r.available);
}
