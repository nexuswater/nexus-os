/**
 * Squid Router Adapter — EVM cross-chain swaps
 *
 * Uses Squid SDK for token swaps across Base, Arbitrum, XRPL EVM, HyperEVM.
 * Falls back to mock mode when VITE_SQUID_INTEGRATOR_ID is not set.
 *
 * Squid docs: https://docs.squidrouter.com
 */

import { NEXUS_CHAINS, findChainByChainId } from '@nexus/shared';

const SQUID_INTEGRATOR_ID = import.meta.env.VITE_SQUID_INTEGRATOR_ID || '';
const SQUID_API_BASE = 'https://apiplus.squidrouter.com/v2';

export function isSquidAvailable(): boolean {
  return SQUID_INTEGRATOR_ID.length > 0;
}

export interface SquidQuoteParams {
  fromChainId: number;
  toChainId: number;
  fromToken: string;   // token address on source chain
  toToken: string;     // token address on dest chain
  fromAmount: string;  // amount in wei/smallest unit
  fromAddress: string; // sender wallet
  toAddress: string;   // recipient wallet
  slippage: number;    // e.g. 1.0 for 1%
}

export interface SquidQuoteResult {
  estimatedOutput: string;
  estimatedOutputFormatted: string;
  exchangeRate: string;
  estimatedGasFee: string;
  estimatedTimeSec: number;
  route: SquidRouteStep[];
  rawRoute?: unknown;  // full Squid response for execution
}

export interface SquidRouteStep {
  type: 'swap' | 'bridge' | 'wrap';
  fromChainName: string;
  toChainName: string;
  fromToken: string;
  toToken: string;
  protocol: string;
}

export interface SquidExecuteResult {
  txHash: string;
  status: 'pending' | 'success' | 'failed';
  explorerUrl: string;
}

// ─── Mock Implementation ────────────────────────────────

function getMockQuote(params: SquidQuoteParams): SquidQuoteResult {
  const fromChain = findChainByChainId(params.fromChainId);
  const toChain = findChainByChainId(params.toChainId);

  // Simulate a ~0.3% spread
  const inputAmount = parseFloat(params.fromAmount) / 1e18;
  const outputAmount = inputAmount * 0.997;

  return {
    estimatedOutput: Math.floor(outputAmount * 1e18).toString(),
    estimatedOutputFormatted: outputAmount.toFixed(4),
    exchangeRate: '0.997',
    estimatedGasFee: '0.0012 ETH',
    estimatedTimeSec: params.fromChainId === params.toChainId ? 15 : 90,
    route: [
      ...(params.fromChainId !== params.toChainId ? [{
        type: 'bridge' as const,
        fromChainName: fromChain?.name ?? 'Unknown',
        toChainName: toChain?.name ?? 'Unknown',
        fromToken: params.fromToken,
        toToken: params.toToken,
        protocol: 'Axelar',
      }] : []),
      {
        type: 'swap' as const,
        fromChainName: toChain?.name ?? fromChain?.name ?? 'Unknown',
        toChainName: toChain?.name ?? fromChain?.name ?? 'Unknown',
        fromToken: params.fromToken,
        toToken: params.toToken,
        protocol: 'Uniswap V3',
      },
    ],
  };
}

// ─── Public API ─────────────────────────────────────────

/**
 * Get a swap/bridge quote from Squid Router.
 * Returns mock data if VITE_SQUID_INTEGRATOR_ID is not set.
 */
export async function getSquidQuote(params: SquidQuoteParams): Promise<SquidQuoteResult> {
  if (!isSquidAvailable()) {
    // Mock mode — simulate a brief delay
    await new Promise(r => setTimeout(r, 400));
    return getMockQuote(params);
  }

  // Production: call Squid API
  const response = await fetch(`${SQUID_API_BASE}/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-integrator-id': SQUID_INTEGRATOR_ID,
    },
    body: JSON.stringify({
      fromChain: params.fromChainId.toString(),
      toChain: params.toChainId.toString(),
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      slippage: params.slippage,
      quoteOnly: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Squid quote failed: ${response.statusText}`);
  }

  const data = await response.json();
  const estimate = data.route?.estimate;

  return {
    estimatedOutput: estimate?.toAmount ?? '0',
    estimatedOutputFormatted: estimate?.toAmountUSD ?? '0.00',
    exchangeRate: estimate?.exchangeRate ?? '0',
    estimatedGasFee: estimate?.gasCosts?.[0]?.amountUSD ?? '0',
    estimatedTimeSec: estimate?.estimatedRouteDuration ?? 60,
    route: (data.route?.routeSteps ?? []).map((step: any) => ({
      type: step.type ?? 'swap',
      fromChainName: step.fromChain?.chainName ?? '',
      toChainName: step.toChain?.chainName ?? '',
      fromToken: step.fromToken?.symbol ?? '',
      toToken: step.toToken?.symbol ?? '',
      protocol: step.provider ?? '',
    })),
    rawRoute: data,
  };
}

/**
 * Execute a swap via Squid Router.
 * Requires a previous quote result with rawRoute.
 * In mock mode, returns a simulated tx hash.
 */
export async function executeSquidSwap(
  quote: SquidQuoteResult,
  signer?: unknown,
): Promise<SquidExecuteResult> {
  if (!isSquidAvailable() || !quote.rawRoute) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      txHash: `0xmock_squid_${Date.now().toString(16)}`,
      status: 'success',
      explorerUrl: '#',
    };
  }

  // Production: execute via ethers signer
  // const route = quote.rawRoute as any;
  // const tx = await signer.sendTransaction(route.route.transactionRequest);
  // return { txHash: tx.hash, status: 'pending', explorerUrl: route.explorerUrl };

  throw new Error('Production Squid execution requires ethers signer integration');
}

/**
 * Get supported chains for Squid routing.
 * Returns the NEXUS_CHAINS that Squid can route between.
 */
export function getSquidSupportedChains(): { chainId: number; name: string; supported: boolean }[] {
  // Squid supports Base and Arbitrum natively. XRPL EVM and HyperEVM may need Axelar.
  const squidNativeChains = new Set([8453, 42161]); // Base, Arbitrum

  return Object.values(NEXUS_CHAINS).map(chain => ({
    chainId: chain.chainId,
    name: chain.name,
    supported: squidNativeChains.has(chain.chainId) || isSquidAvailable(),
  }));
}
