/**
 * Mint engine — creates MockBatch + Receipt and credits portfolio.
 * Pushes to mutable batches/receipts arrays and emits MINT events.
 */

import type { MockBatch, Receipt, BatchTicker, ExtendedSite } from '../types';
import type { Region } from '../seed';
import { createRng, uuid, txHash, hexId, round, daysAgo } from '../seed';
import type { EventBus } from './eventBus';
import type { PortfolioEngine } from './portfolioEngine';

export interface MintResult {
  batch: MockBatch;
  receipt: Receipt;
}

export class MintEngine {
  private rng = createRng(0xCA5E);

  constructor(
    private sitesRef: () => ExtendedSite[],
    private batchesRef: () => MockBatch[],
    private receiptsRef: () => Receipt[],
    private portfolio: PortfolioEngine,
    private eventBus: EventBus,
  ) {}

  /** Mint a new batch of WTR or ENG credits from a site. */
  mintBatch(siteId: string, ticker: BatchTicker, quantity: number): MintResult {
    const site = this.sitesRef().find(s => s.id === siteId);
    const region = (site?.location.region ?? 'US-AZ') as Region;
    const now = new Date().toISOString();

    const batch: MockBatch = {
      id: 'batch-' + hexId(this.rng, 12),
      ticker,
      siteId,
      status: 'ACTIVE',
      amountMinted: quantity,
      mintDate: now,
      retirementMonths: 24,
      retiredFraction: 0,
      remainingValue: quantity,
      region,
      metadataUri: `ipfs://Qm${hexId(this.rng, 44)}`,
    };

    const receipt = this.buildReceipt(batch, region, siteId, now);

    this.batchesRef().push(batch);
    this.receiptsRef().push(receipt);

    // Credit minted tokens on XRPL
    this.portfolio.credit(ticker, quantity, 'XRPL');

    this.eventBus.emit({
      id: uuid(this.rng),
      type: 'MINT',
      timeISO: now,
      message: `Minted ${quantity} ${ticker} from ${siteId}`,
      severity: 'success',
      payload: { batchId: batch.id, ticker, quantity, siteId, region },
      relatedSiteId: siteId,
      relatedBatchId: batch.id,
      relatedReceiptId: receipt.id,
    });

    return { batch, receipt };
  }

  private buildReceipt(
    batch: MockBatch, region: Region, siteId: string, now: string,
  ): Receipt {
    const rng = this.rng;
    const hash = () => txHash(rng);
    return {
      id: 'rcpt-' + hexId(rng, 12),
      batchId: batch.id,
      ticker: batch.ticker,
      amount: batch.amountMinted,
      region,
      siteId: siteId as Receipt['siteId'],
      mintedAt: now,
      expiresAt: daysAgo(-730),
      verificationScore: round(85 + Math.random() * 15, 1),
      riskReasons: [],
      proofTrail: [
        { stepIndex: 0, kind: 'ISSUANCE', timestamp: now, actor: 'system', txHash: hash(), memo: 'Initial mint' },
        { stepIndex: 1, kind: 'VERIFICATION', timestamp: now, actor: 'oracle', txHash: hash(), memo: 'Auto-verified' },
      ],
      custodyEvents: [
        { eventIndex: 0, kind: 'CREATED', timestamp: now, from: 'null', to: 'user', txHash: hash() },
      ],
      artifacts: [
        {
          id: 'art-' + hexId(rng, 8),
          kind: 'JSON',
          label: 'Metadata',
          url: batch.metadataUri,
          sizeBytes: 2048,
          uploadedAt: now,
        },
      ],
      verificationRules: [
        { ruleId: 'VR-001', name: 'Site Active', description: 'Confirm site is active', passed: true, checkedAt: now },
        { ruleId: 'VR-002', name: 'Capacity Check', description: 'Quantity within capacity', passed: true, checkedAt: now },
      ],
    };
  }
}
