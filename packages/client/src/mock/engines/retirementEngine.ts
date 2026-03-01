/**
 * Retirement engine — retire or redeem batches of WTR/ENG credits.
 * Creates retirement receipts, awards NXS rewards, emits events.
 */

import type { MockBatch, Receipt } from '../types';
import { createRng, uuid, txHash, hexId, round, daysAgo } from '../seed';
import type { EventBus } from './eventBus';
import type { PortfolioEngine } from './portfolioEngine';

const NXS_REWARD_RATE = 0.02; // NXS per unit retired

export interface RetireResult {
  amountRetired: number;
  remainingValue: number;
  nxsReward: number;
  receiptId: string;
}

export interface RedeemResult {
  batchId: string;
  amountRedeemed: number;
  nxsReceived: number;
  receiptId: string;
}

export class RetirementEngine {
  private rng = createRng(0xD1CE);

  constructor(
    private batchesRef: () => MockBatch[],
    private receiptsRef: () => Receipt[],
    private portfolio: PortfolioEngine,
    private eventBus: EventBus,
  ) {}

  /** Retire a specified amount from a batch. Awards NXS reward. */
  retire(batchId: string, amount: number): RetireResult {
    const batch = this.batchesRef().find(b => b.id === batchId);
    if (!batch) throw new Error(`Batch not found: ${batchId}`);
    if (batch.status === 'RETIRED') throw new Error(`Batch already retired: ${batchId}`);

    const actual = Math.min(amount, batch.remainingValue);
    batch.remainingValue = round(batch.remainingValue - actual, 6);
    batch.retiredFraction = round(1 - batch.remainingValue / batch.amountMinted, 4);

    if (batch.remainingValue <= 0) {
      batch.status = 'RETIRED';
      batch.remainingValue = 0;
      batch.retiredFraction = 1;
    }

    // Debit the retired tokens from portfolio
    this.portfolio.debit(batch.ticker, actual, 'XRPL');

    // Reward NXS
    const nxsReward = round(actual * NXS_REWARD_RATE, 6);
    this.portfolio.credit('NXS', nxsReward, 'XRPL');

    const receipt = this.createRetirementReceipt(batch, actual, 'RETIREMENT');
    this.receiptsRef().push(receipt);

    this.eventBus.emit({
      id: uuid(this.rng),
      type: 'RETIRE',
      timeISO: new Date().toISOString(),
      message: `Retired ${actual} ${batch.ticker} from ${batchId} — earned ${nxsReward} NXS`,
      severity: 'success',
      payload: { batchId, amount: actual, nxsReward, remaining: batch.remainingValue },
      relatedBatchId: batchId,
      relatedReceiptId: receipt.id,
    });

    return {
      amountRetired: actual,
      remainingValue: batch.remainingValue,
      nxsReward,
      receiptId: receipt.id,
    };
  }

  /** Redeem an entire batch, converting all remaining value to NXS. */
  redeem(batchId: string): RedeemResult {
    const batch = this.batchesRef().find(b => b.id === batchId);
    if (!batch) throw new Error(`Batch not found: ${batchId}`);
    if (batch.status === 'RETIRED') throw new Error(`Batch already retired: ${batchId}`);

    const amountRedeemed = batch.remainingValue;
    const nxsReceived = round(amountRedeemed * NXS_REWARD_RATE, 6);

    // Debit tokens, credit NXS
    this.portfolio.debit(batch.ticker, amountRedeemed, 'XRPL');
    this.portfolio.credit('NXS', nxsReceived, 'XRPL');

    batch.remainingValue = 0;
    batch.retiredFraction = 1;
    batch.status = 'RETIRED';

    const receipt = this.createRetirementReceipt(batch, amountRedeemed, 'TRANSFER');
    this.receiptsRef().push(receipt);

    this.eventBus.emit({
      id: uuid(this.rng),
      type: 'REDEEM',
      timeISO: new Date().toISOString(),
      message: `Redeemed ${amountRedeemed} ${batch.ticker} for ${nxsReceived} NXS`,
      severity: 'success',
      payload: { batchId, amountRedeemed, nxsReceived },
      relatedBatchId: batchId,
      relatedReceiptId: receipt.id,
    });

    return { batchId, amountRedeemed, nxsReceived, receiptId: receipt.id };
  }

  // ── internal ──────────────────────────────────────────

  private createRetirementReceipt(
    batch: MockBatch, amount: number, kind: 'RETIREMENT' | 'TRANSFER',
  ): Receipt {
    const rng = this.rng;
    const now = new Date().toISOString();
    return {
      id: 'rcpt-' + hexId(rng, 12),
      batchId: batch.id,
      ticker: batch.ticker,
      amount,
      region: batch.region as Receipt['region'],
      siteId: batch.siteId as Receipt['siteId'],
      mintedAt: batch.mintDate,
      expiresAt: daysAgo(-730),
      verificationScore: 100,
      riskReasons: [],
      proofTrail: [
        { stepIndex: 0, kind, timestamp: now, actor: 'user', txHash: txHash(rng), memo: kind === 'RETIREMENT' ? 'Voluntary retirement' : 'Full redemption' },
      ],
      custodyEvents: [
        { eventIndex: 0, kind: 'RETIRED', timestamp: now, from: 'user', to: 'null', txHash: txHash(rng) },
      ],
      artifacts: [],
      verificationRules: [
        { ruleId: 'VR-RET', name: 'Batch Valid', description: 'Batch exists and has value', passed: true, checkedAt: now },
      ],
    };
  }
}
