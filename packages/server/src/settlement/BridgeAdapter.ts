/**
 * Bridge Settlement Adapter (Mock – Axelar GMP Stub)
 * Simulates cross-chain bridge transfers via Axelar.
 */
import type {
  RouteStep, StepQuote, UnsignedTx, TxSubmission,
  TxReceipt, AdapterContext, CrossChainId,
} from '@nexus/shared';
import type { ISettlementAdapter } from './ISettlementAdapter.js';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class BridgeAdapter implements ISettlementAdapter {
  readonly rail = 'BRIDGE' as const;
  readonly supportedChains: CrossChainId[] = ['XRPL', 'BASE', 'XRPL_EVM', 'ARBITRUM', 'HYPEREVM'];

  async quote(step: RouteStep, _ctx: AdapterContext): Promise<StepQuote> {
    const input = step.estimatedInput;
    const bridgeFeeBps = 15; // 0.15% bridge fee
    const netOutput = input * (1 - bridgeFeeBps / 10000);

    const isXRPLInvolved = step.chainId === 'XRPL' || step.metadata?.destChain === 'XRPL';
    const estimatedTime = isXRPLInvolved ? 120 : 60;

    return {
      estimatedOutput: Number(netOutput.toFixed(4)),
      estimatedGas: '0.85',
      estimatedTimeSeconds: estimatedTime,
      rate: Number((1 - bridgeFeeBps / 10000).toFixed(6)),
      priceImpactBps: 0,
    };
  }

  async buildTx(step: RouteStep, ctx: AdapterContext): Promise<UnsignedTx> {
    return {
      chainId: step.chainId,
      adapter: 'BRIDGE',
      payload: {
        type: 'axelar_gmp',
        sourceChain: step.chainId,
        destinationChain: step.metadata?.destChain ?? 'BASE',
        token: step.inputToken,
        amount: step.estimatedInput,
        recipient: ctx.recipientAddress ?? ctx.senderAddress,
        payload: '0x',
      },
      description: step.description ?? `Bridge ${step.inputToken} via Axelar GMP`,
    };
  }

  async signAndSend(tx: UnsignedTx, _ctx: AdapterContext): Promise<TxSubmission> {
    await sleep(2000);
    const sourceHash = `0xbridge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      txHash: sourceHash,
      chainId: tx.chainId,
      explorerUrl: `https://axelarscan.io/gmp/${sourceHash}`,
      submittedAt: new Date().toISOString(),
    };
  }

  async waitForFinality(txHash: string, chainId: CrossChainId, _timeoutMs = 300000): Promise<TxReceipt> {
    const bridgeTime = 5000 + Math.random() * 10000;
    await sleep(bridgeTime);
    return {
      txHash,
      chainId,
      status: 'confirmed',
      gasUsed: '0.85',
      explorerUrl: `https://axelarscan.io/gmp/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }

  async getReceipt(txHash: string, chainId: CrossChainId): Promise<TxReceipt | null> {
    return {
      txHash,
      chainId,
      status: 'confirmed',
      gasUsed: '0.85',
      explorerUrl: `https://axelarscan.io/gmp/${txHash}`,
      confirmedAt: new Date().toISOString(),
    };
  }
}
