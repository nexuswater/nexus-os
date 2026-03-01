/**
 * auditPackEngine.ts — Export / audit-pack generation engine.
 * Produces CSV, JSON, and PDF artifacts from receipt data,
 * with configurable scope (proof trails, custody, verification,
 * artifacts).
 */
import type { Receipt } from '../types';

// ─── Scope & Format Types ───────────────────────────────

export interface AuditScope {
  includeProofTrails: boolean;
  includeCustody: boolean;
  includeVerification: boolean;
  includeArtifacts: boolean;
}

export type ExportFormat = 'PDF' | 'CSV' | 'JSON';

export interface AuditPackResult {
  csv?: string;
  json?: string;
  pdf?: Blob;
}

// ─── Event types ────────────────────────────────────────

export type ExportEventKind = 'EXPORT_COMPLETE';

export interface ExportEvent {
  kind: ExportEventKind;
  formats: ExportFormat[];
  receiptCount: number;
  timestamp: string;
}

export type ExportListener = (evt: ExportEvent) => void;

// ─── CSV Builder ────────────────────────────────────────

function buildCsv(receipts: Receipt[], scope: AuditScope): string {
  const headers = [
    'id', 'batchId', 'ticker', 'amount', 'region', 'siteId',
    'mintedAt', 'expiresAt', 'verificationScore',
  ];
  if (scope.includeVerification) headers.push('riskReasons');
  if (scope.includeProofTrails) headers.push('proofStepCount');
  if (scope.includeCustody) headers.push('custodyEventCount');
  if (scope.includeArtifacts) headers.push('artifactCount');

  const rows = receipts.map((r) => {
    const base = [
      r.id, r.batchId, r.ticker, String(r.amount), r.region,
      r.siteId, r.mintedAt, r.expiresAt, String(r.verificationScore),
    ];
    if (scope.includeVerification) base.push(`"${r.riskReasons.join('; ')}"`);
    if (scope.includeProofTrails) base.push(String(r.proofTrail.length));
    if (scope.includeCustody) base.push(String(r.custodyEvents.length));
    if (scope.includeArtifacts) base.push(String(r.artifacts.length));
    return base.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// ─── JSON Builder ───────────────────────────────────────

function buildJson(receipts: Receipt[], scope: AuditScope): string {
  const payload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      receiptCount: receipts.length,
      scope,
    },
    receipts: receipts.map((r) => {
      const entry: Record<string, unknown> = {
        id: r.id,
        batchId: r.batchId,
        ticker: r.ticker,
        amount: r.amount,
        region: r.region,
        siteId: r.siteId,
        mintedAt: r.mintedAt,
        expiresAt: r.expiresAt,
        verificationScore: r.verificationScore,
      };
      if (scope.includeVerification) {
        entry.verificationRules = r.verificationRules;
        entry.riskReasons = r.riskReasons;
      }
      if (scope.includeProofTrails) entry.proofTrail = r.proofTrail;
      if (scope.includeCustody) entry.custodyEvents = r.custodyEvents;
      if (scope.includeArtifacts) entry.artifacts = r.artifacts;
      return entry;
    }),
  };

  return JSON.stringify(payload, null, 2);
}

// ─── PDF Builder (jsPDF) ────────────────────────────────

async function buildPdf(receipts: Receipt[], scope: AuditScope): Promise<Blob> {
  // Dynamic import to keep bundle light when PDF is unused
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // Cover page
  doc.setFontSize(24);
  doc.text('Nexus OS — Audit Pack', 40, 60);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toISOString()}`, 40, 90);
  doc.text(`Receipts: ${receipts.length}`, 40, 110);
  doc.text(`Scope: ${Object.entries(scope).filter(([, v]) => v).map(([k]) => k).join(', ')}`, 40, 130);

  // Receipt table
  doc.addPage();
  doc.setFontSize(10);

  const colX = [40, 140, 220, 280, 360, 430, 560];
  const headers = ['ID', 'Batch', 'Ticker', 'Amount', 'Region', 'Score', 'Minted'];
  let y = 40;

  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.setFont('helvetica', 'normal');
  y += 18;

  for (const r of receipts) {
    if (y > 560) {
      doc.addPage();
      y = 40;
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      doc.setFont('helvetica', 'normal');
      y += 18;
    }
    const row = [
      r.id.slice(0, 16),
      r.batchId,
      r.ticker,
      String(r.amount),
      r.region,
      String(r.verificationScore),
      r.mintedAt.slice(0, 10),
    ];
    row.forEach((cell, i) => doc.text(cell, colX[i], y));
    y += 14;
  }

  // Summary page
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Summary', 40, 40);
  doc.setFontSize(10);
  const avgScore = receipts.reduce((s, r) => s + r.verificationScore, 0) / (receipts.length || 1);
  doc.text(`Average verification score: ${avgScore.toFixed(1)}`, 40, 65);
  doc.text(`Total receipts: ${receipts.length}`, 40, 85);
  doc.text(`Passed (>= 60): ${receipts.filter((r) => r.verificationScore >= 60).length}`, 40, 105);
  doc.text(`Failed (< 60): ${receipts.filter((r) => r.verificationScore < 60).length}`, 40, 125);

  return doc.output('blob');
}

// ─── Engine ─────────────────────────────────────────────

export class AuditPackEngine {
  private listeners: ExportListener[] = [];

  onEvent(fn: ExportListener): void {
    this.listeners.push(fn);
  }

  private emit(evt: ExportEvent): void {
    for (const fn of this.listeners) fn(evt);
  }

  /** Generate audit pack in requested formats. */
  async generate(
    receipts: Receipt[],
    scope: AuditScope,
    formats: Set<ExportFormat>,
  ): Promise<AuditPackResult> {
    const result: AuditPackResult = {};

    if (formats.has('CSV')) {
      result.csv = buildCsv(receipts, scope);
    }

    if (formats.has('JSON')) {
      result.json = buildJson(receipts, scope);
    }

    if (formats.has('PDF')) {
      result.pdf = await buildPdf(receipts, scope);
    }

    this.emit({
      kind: 'EXPORT_COMPLETE',
      formats: [...formats],
      receiptCount: receipts.length,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}
