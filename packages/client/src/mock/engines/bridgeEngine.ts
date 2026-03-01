/**
 * Bridge engine — mock cross-chain bridge with multi-step progression.
 * Transitions: INITIATED → CONFIRMING (2s) → RELAYING (4s) → COMPLETED (6s).
 */

import type { BridgeRecord, BridgeStatus } from '../types';
import type { Chain, BridgeToken } from '../seed';
import { createRng, uuid, txHash, round, randFloat } from '../seed';
import type { EventBus } from './eventBus';
import type { PortfolioEngine } from './portfolioEngine';

export class BridgeEngine {
  private rng = createRng(0xBB1D);
  private timers: Map<string, ReturnType<typeof setTimeout>[]> = new Map();

  constructor(
    private bridgesRef: () => BridgeRecord[],
    private portfolio: PortfolioEngine,
    private eventBus: EventBus,
  ) {}

  /** Initiate a bridge transfer. Debits source immediately, credits dest on completion. */
  initiate(
    token: BridgeToken,
    amount: number,
    fromChain: Chain,
    toChain: Chain,
  ): BridgeRecord {
    // Debit from source chain immediately
    this.portfolio.debit(token, amount, fromChain);

    const fee = round(amount * randFloat(this.rng, 0.001, 0.005), 6);
    const now = new Date().toISOString();

    const record: BridgeRecord = {
      id: uuid(this.rng),
      token,
      amount,
      sourceChain: fromChain,
      destChain: toChain,
      status: 'INITIATED',
      initiatedAt: now,
      completedAt: null,
      fee,
      feeToken: token,
      confirmations: 0,
      requiredConfirmations: 12,
      sourceTxHash: txHash(this.rng),
      destTxHash: null,
      sender: 'user',
      recipient: 'user',
    };

    this.bridgesRef().push(record);
    this.emitStatus(record, 'Bridge initiated');

    // Schedule progression
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => this.advance(record, 'CONFIRMING', 6), 2000));
    timers.push(setTimeout(() => this.advance(record, 'RELAYING', 10), 4000));
    timers.push(setTimeout(() => this.complete(record), 6000));
    this.timers.set(record.id, timers);

    return record;
  }

  /** Get all in-progress (non-terminal) bridges. */
  getActiveBridges(): BridgeRecord[] {
    return this.bridgesRef().filter(
      b => b.status !== 'COMPLETED' && b.status !== 'FAILED',
    );
  }

  /** Cancel all pending timers (for cleanup). */
  dispose(): void {
    for (const timerList of this.timers.values()) {
      timerList.forEach(t => clearTimeout(t));
    }
    this.timers.clear();
  }

  // ── internal helpers ──────────────────────────────────

  private advance(record: BridgeRecord, status: BridgeStatus, confirmations: number): void {
    record.status = status;
    record.confirmations = confirmations;
    const label = status === 'CONFIRMING' ? 'Confirming on source chain' : 'Relaying to destination';
    this.emitStatus(record, label);
  }

  private complete(record: BridgeRecord): void {
    record.status = 'COMPLETED';
    record.confirmations = record.requiredConfirmations;
    record.completedAt = new Date().toISOString();
    record.destTxHash = txHash(this.rng);

    // Credit destination chain (minus fee)
    const netAmount = round(record.amount - record.fee, 6);
    this.portfolio.credit(record.token, netAmount, record.destChain);

    this.emitStatus(record, `Bridge completed: ${netAmount} ${record.token} on ${record.destChain}`);
    this.timers.delete(record.id);
  }

  private emitStatus(record: BridgeRecord, message: string): void {
    const severity = record.status === 'COMPLETED' ? 'success'
      : record.status === 'FAILED' ? 'error' : 'info';

    this.eventBus.emit({
      id: uuid(this.rng),
      type: 'BRIDGE',
      timeISO: new Date().toISOString(),
      message,
      severity,
      payload: {
        bridgeId: record.id,
        token: record.token,
        amount: record.amount,
        from: record.sourceChain,
        to: record.destChain,
        status: record.status,
        confirmations: record.confirmations,
      },
    });
  }
}
