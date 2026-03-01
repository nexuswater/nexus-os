/**
 * Settlement Adapter Interface
 * All chain adapters (XRPL, EVM, Bridge) implement this contract.
 */
import type {
  AdapterRail, RouteStep, StepQuote, UnsignedTx,
  TxSubmission, TxReceipt, AdapterContext, CrossChainId,
} from '@nexus/shared';

export interface ISettlementAdapter {
  readonly rail: AdapterRail;
  readonly supportedChains: CrossChainId[];

  /** Get a quote for a single route step */
  quote(step: RouteStep, context: AdapterContext): Promise<StepQuote>;

  /** Build an unsigned transaction for the step */
  buildTx(step: RouteStep, context: AdapterContext): Promise<UnsignedTx>;

  /** Sign and submit the transaction (mock in dev) */
  signAndSend(tx: UnsignedTx, context: AdapterContext): Promise<TxSubmission>;

  /** Wait for finality on chain */
  waitForFinality(txHash: string, chainId: CrossChainId, timeoutMs?: number): Promise<TxReceipt>;

  /** Get receipt for a completed transaction */
  getReceipt(txHash: string, chainId: CrossChainId): Promise<TxReceipt | null>;
}
