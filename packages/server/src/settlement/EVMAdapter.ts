/**
 * EVM Settlement Adapter (Mock)
 * Simulates Uniswap-style AMM swaps and ERC20 transfers on Base/Arbitrum.
 */
import type {
  RouteStep, StepQuote, UnsignedTx, TxSubmission,
  TxReceipt, AdapterContext, CrossChainId,
} from '@nexus/shared';
import type { ISettlementAdapter } from './ISettlementAdapter.js';

const EVM_RATES: Record<string, number> = {
  'NXS:USDC': 2.42,
  'USDC:NXS': 0.413,
  'NXS:ETH': 0.00076,
  'ETH:NXS': 1315,
  'USDC:WTR': 1.176,
  'USDC:ENG': 0.893,
  'NXS:WTR': 2.85,
  'NXS:ENG': 2.16,
  'WTR:USDC': 0.85,
  'ENG:USDC': 1.12,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class EVMAdapter implements ISettlementAdapter {
  readonly rail = 'EVM_AMM' as const;
  readonly supportedChains: CrossChainId[] = ['BASE', 'XRPL_EVM', 'ARBITRUM', 'HYPEREVM'];

  async quote(step: RouteStep, _ctx: AdapterContext): Promise<StepQuote> {
    const pair = `${step.inputToken}:${step.outputToken}`;
    const rate = EVM_RATES[pair] ?? 1.0;
    const input = step.estimatedInput;
    const output = input * rate;
    const feeBps = 30; // 0.3% Uniswap-style fee
    const netOutput = output * (1 - feeBps / 10000);

    return {
      estimatedOutput: Number(netOutput.toFixed(4)),
      estimatedGas: '0.12',
      estimatedTimeSeconds: 15,
      rate: Number(rate.toFixed(6)),
      priceImpactBps: Math.round(input * 0.05),
    };
  }

  async buildTx(step: RouteStep, ctx: AdapterContext): Promise<UnsignedTx> {
    return {
      chainId: step.chainId,
      adapter: 'EVM_AMM',
      payload: {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        from: ctx.senderAddress,
        data: `0xswap_${step.inputToken}_${step.outputToken}`,
        value: '0',
        gasLimit: '250000',
      },
      description: step.description ?? `${step.type} ${step.inputToken} → ${step.outputToken}`,
    };
  }

  async signAndSend(tx: UnsignedTx, _ctx: AdapterContext): Promise<TxSubmission> {
    await sleep(1500);
    const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    return {
      txHash: hash,
      chainId: tx.chainId,
      explorerUrl: `https://basescan.org/tx/${hash}`,
      submittedAt: new Date().toISOString(),
    };
  }

  async waitForFinality(txHash: string, chainId: CrossChainId, _timeoutMs = 60000): Promise<TxReceipt> {
    const waitTime = chainId === 'BASE' ? 2000 : 12000;
    await sleep(waitTime + Math.random() * 3000);
    return {
      txHash,
      chainId,
      status: 'confirmed',
      blockNumber: 20_000_000 + Math.floor(Math.random() * 10000),
      gasUsed: '0.12',
      explorerUrl: `https://basescan.org/tx/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }

  async getReceipt(txHash: string, chainId: CrossChainId): Promise<TxReceipt | null> {
    return {
      txHash,
      chainId,
      status: 'confirmed',
      gasUsed: '0.12',
      explorerUrl: `https://basescan.org/tx/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }
}
