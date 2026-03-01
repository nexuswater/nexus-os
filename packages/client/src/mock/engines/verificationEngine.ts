/**
 * verificationEngine.ts — Receipt verification engine.
 * Runs 5 deterministic rules against a receipt and computes
 * a verification score. Rules use seeded randomness for
 * reproducibility.
 */
import type { Rng } from '../seed';
import { uuid, chance, round } from '../seed';
import type { Receipt, VerificationRule } from '../types';
import type { ExtendedSite } from '../types';

// ─── Event types ────────────────────────────────────────

export interface VerifyResult {
  receiptId: string;
  score: number;
  rules: VerificationRule[];
  passed: boolean;
}

export type VerifyEventKind = 'VERIFY_COMPLETE';

export interface VerifyEvent {
  kind: VerifyEventKind;
  receiptId: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

export type VerifyListener = (evt: VerifyEvent) => void;

// ─── Rule definitions ───────────────────────────────────

interface RuleDef {
  name: string;
  description: string;
  check: (receipt: Receipt, ctx: RuleContext) => boolean;
}

interface RuleContext {
  rng: Rng;
  sites: Map<string, ExtendedSite>;
  currentYear: number;
}

const RULE_DEFS: RuleDef[] = [
  {
    name: 'Source Verified',
    description: 'Production source validated against registered installation',
    check: (_r, ctx) => {
      const site = ctx.sites.get(_r.siteId);
      return !!site && site.status === 'ACTIVE';
    },
  },
  {
    name: 'Methodology Approved',
    description: 'Minting methodology matches approved protocol standard',
    check: (_r, ctx) => chance(ctx.rng, 0.90),
  },
  {
    name: 'Vintage Valid',
    description: 'Credit vintage falls within acceptable issuance window',
    check: (r, ctx) => {
      const vintageYear = new Date(r.mintedAt).getFullYear();
      return vintageYear <= ctx.currentYear;
    },
  },
  {
    name: 'Quantity Threshold',
    description: 'Minted quantity within statistical bounds for site capacity',
    check: (r, _ctx) => r.amount < 50_000,
  },
  {
    name: 'No Duplicate',
    description: 'No duplicate issuance detected for this production period',
    check: (_r, ctx) => chance(ctx.rng, 0.95),
  },
];

// ─── Engine ─────────────────────────────────────────────

export class VerificationEngine {
  private receipts: Map<string, Receipt>;
  private sites: Map<string, ExtendedSite>;
  private rng: Rng;
  private listeners: VerifyListener[] = [];

  constructor(rng: Rng, receipts: Receipt[], sites: ExtendedSite[]) {
    this.rng = rng;
    this.receipts = new Map(receipts.map((r) => [r.id, r]));
    this.sites = new Map(sites.map((s) => [s.id, s]));
  }

  onEvent(fn: VerifyListener): void {
    this.listeners.push(fn);
  }

  private emit(evt: VerifyEvent): void {
    for (const fn of this.listeners) fn(evt);
  }

  /** Run all 5 verification rules against a receipt. */
  verify(receiptId: string): VerifyResult | null {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) return null;

    const now = new Date();
    const ctx: RuleContext = {
      rng: this.rng,
      sites: this.sites,
      currentYear: now.getFullYear(),
    };

    const rules: VerificationRule[] = [];
    let passCount = 0;

    for (const def of RULE_DEFS) {
      const passed = def.check(receipt, ctx);
      if (passed) passCount++;

      rules.push({
        ruleId: uuid(this.rng),
        name: def.name,
        description: def.description,
        passed,
        checkedAt: now.toISOString(),
      });
    }

    const score = round((passCount / 5) * 100, 1);
    const overallPassed = score >= 60;

    // Update receipt
    receipt.verificationRules = rules;
    receipt.verificationScore = score;
    receipt.riskReasons = rules
      .filter((r) => !r.passed)
      .map((r) => `Failed: ${r.name} — ${r.description}`);

    this.emit({
      kind: 'VERIFY_COMPLETE',
      receiptId,
      score,
      passed: overallPassed,
      timestamp: now.toISOString(),
    });

    return { receiptId, score, rules, passed: overallPassed };
  }

  /** Bulk verify all receipts. */
  verifyAll(): VerifyResult[] {
    const results: VerifyResult[] = [];
    for (const id of this.receipts.keys()) {
      const r = this.verify(id);
      if (r) results.push(r);
    }
    return results;
  }

  /** Get a receipt by id. */
  getReceipt(id: string): Receipt | undefined {
    return this.receipts.get(id);
  }

  /** Snapshot of all receipts. */
  getReceipts(): Receipt[] {
    return [...this.receipts.values()];
  }
}
