/**
 * XRPL Settlement Adapter (Mock)
 * Simulates XRPL DEX swaps and payment transactions.
 */
import type {
  RouteStep, StepQuote, UnsignedTx, TxSubmission,
  TxReceipt, AdapterContext, CrossChainId,
} from '@nexus/shared';
import type { ISettlementAdapter } from './ISettlementAdapter.js';

const XRPL_RATES: Record<string, number> = {
  'XRP:NXS': 2.02,
  'NXS:XRP': 0.495,
  'XRP:RLUSD': 0.52,
  'RLUSD:XRP': 1.92,
  'XRP:WTR': 0.12,
  'XRP:ENG': 0.18,
  'RLUSD:WTR': 0.23,
  'RLUSD:ENG': 0.35,
  'NXS:RLUSD': 2.42,
  'NXS:USDC': 2.42,
  'NXS:WTR': 2.85,
  'NXS:ENG': 2.16,
  'WTR:NXS': 0.35,
  'ENG:NXS': 0.46,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class XRPLAdapter implements ISettlementAdapter {
  readonly rail = 'XRPL_DEX' as const;
  readonly supportedChains: CrossChainId[] = ['XRPL'];

  async quote(step: RouteStep, _ctx: AdapterContext): Promise<StepQuote> {
    const pair = `${step.inputToken}:${step.outputToken}`;
    const rate = XRPL_RATES[pair] ?? 1.0;
    const input = step.estimatedInput;
    const output = input * rate;
    const feeBps = 12; // 0.12% XRPL DEX fee
    const netOutput = output * (1 - feeBps / 10000);

    return {
      estimatedOutput: Number(netOutput.toFixed(4)),
      estimatedGas: '0.0001',
      estimatedTimeSeconds: 4,
      rate: Number(rate.toFixed(6)),
      priceImpactBps: Math.round(input * 0.02),
    };
  }

  async buildTx(step: RouteStep, ctx: AdapterContext): Promise<UnsignedTx> {
    return {
      chainId: 'XRPL',
      adapter: 'XRPL_DEX',
      payload: {
        TransactionType: step.type === 'SWAP' ? 'OfferCreate' : 'Payment',
        Account: ctx.senderAddress,
        TakerPays: { currency: step.outputToken, value: String(step.estimatedOutput) },
        TakerGets: { currency: step.inputToken, value: String(step.estimatedInput) },
        Fee: '12',
      },
      description: step.description ?? `${step.type} ${step.inputToken} → ${step.outputToken}`,
    };
  }

  async signAndSend(_tx: UnsignedTx, _ctx: AdapterContext): Promise<TxSubmission> {
    await sleep(800);
    const hash = `xrpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    return {
      txHash: hash,
      chainId: 'XRPL',
      explorerUrl: `https://testnet.xrpl.org/transactions/${hash}`,
      submittedAt: new Date().toISOString(),
    };
  }

  async waitForFinality(txHash: string, chainId: CrossChainId, _timeoutMs = 15000): Promise<TxReceipt> {
    await sleep(3000 + Math.random() * 2000);
    return {
      txHash,
      chainId,
      status: 'confirmed',
      blockNumber: 85_000_000 + Math.floor(Math.random() * 1000),
      gasUsed: '0.0001',
      explorerUrl: `https://testnet.xrpl.org/transactions/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }

  async getReceipt(txHash: string, chainId: CrossChainId): Promise<TxReceipt | null> {
    return {
      txHash,
      chainId,
      status: 'confirmed',
      gasUsed: '0.0001',
      explorerUrl: `https://testnet.xrpl.org/transactions/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }
}
