/**
 * receipts.ts — Generate 200 Receipt records with full proof trails,
 * custody chains, artifacts, verification rules, and risk scoring.
 * Batch IDs: batch-0 through batch-64.
 */
import type { Rng } from '../seed';
import {
  randInt, randFloat, round, pick, pickN, chance,
  hexId, uuid, txHash, xrplAddress, offsetFrom,
  daysAgo, hoursAgo, REGIONS, SITE_IDS,
} from '../seed';
import type {
  Receipt, ProofStep, ProofStepKind,
  CustodyEvent, CustodyEventKind,
  Artifact, ArtifactKind,
  VerificationRule,
} from '../types';

// ─── Constants ──────────────────────────────────────────

const RECEIPT_COUNT = 200;
const BATCH_MAX = 64;
const TICKERS = ['WTR', 'ENG'] as const;

const RISK_REASON_POOL = [
  'Sensor calibration overdue by 14 days',
  'Flow rate variance exceeds 2σ threshold',
  'GPS coordinates drift detected on IoT device',
  'Duplicate meter reading hash within 24h window',
  'Utility bill mismatch: reported vs. metered delta >8%',
  'Source node firmware not updated in 90+ days',
  'TDS reading outside acceptable band for 3 consecutive hours',
  'Third-party audit pending for this batch region',
  'Cross-reference failure against weather API precipitation data',
  'Historical output anomaly: 40% above seasonal average',
  'Operator certification lapsed',
  'Maintenance log gap exceeds 30 days',
] as const;

const ARTIFACT_LABELS: Record<ArtifactKind, readonly string[]> = {
  PDF: ['Mint Certificate', 'Inspection Report', 'Utility Bill Scan', 'Third-Party Audit', 'Compliance Filing'],
  IMAGE: ['Site Photo', 'Meter Close-up', 'Installation Panorama', 'Sensor Dashboard Screenshot'],
  CSV: ['Raw Sensor Export', 'Daily Production Log', 'Calibration History'],
  JSON: ['IoT Telemetry Payload', 'API Verification Response', 'On-Chain Metadata Dump'],
};

const PROOF_STEP_MEMOS: Record<ProofStepKind, readonly string[]> = {
  ISSUANCE: [
    'Batch minted on XRPL via MPT issuance',
    'Credits issued after IoT verification pass',
    'Automated mint triggered by production threshold',
  ],
  VERIFICATION: [
    'Third-party oracle confirmed production data',
    'On-chain attestation by authorized verifier',
    'Cross-referenced with utility provider records',
  ],
  TRANSFER: [
    'Transferred to marketplace escrow',
    'Batch transferred to institutional buyer',
    'Partial transfer to retirement pool',
  ],
  RETIREMENT: [
    'Credits permanently retired on-chain',
    'Linear retirement schedule applied',
    'Voluntary retirement by holder',
  ],
};

// ─── Verification Rule Templates ────────────────────────

const RULE_TEMPLATES: ReadonlyArray<{ name: string; description: string }> = [
  { name: 'Source Verified', description: 'Production source validated against registered installation' },
  { name: 'Methodology Approved', description: 'Minting methodology matches approved protocol standard' },
  { name: 'Vintage Valid', description: 'Credit vintage falls within acceptable issuance window' },
  { name: 'Quantity Threshold', description: 'Minted quantity within statistical bounds for site capacity' },
  { name: 'No Duplicate', description: 'No duplicate issuance detected for this production period' },
];

// ─── Generator ──────────────────────────────────────────

export function generateReceipts(rng: Rng): Receipt[] {
  const receipts: Receipt[] = [];

  for (let i = 0; i < RECEIPT_COUNT; i++) {
    const batchN = randInt(rng, 0, BATCH_MAX);
    const batchId = `batch-${batchN}`;
    const ticker = pick(rng, TICKERS);
    const region = pick(rng, REGIONS);
    const siteId = pick(rng, SITE_IDS);
    const mintedAt = daysAgo(randInt(rng, 1, 240));
    const amount = round(randFloat(rng, 100, 25000), 2);

    // ── Proof Trail (2-4 steps, ISSUANCE always first) ──

    const extraStepCount = randInt(rng, 1, 3);
    const possibleExtras: ProofStepKind[] = ['VERIFICATION', 'TRANSFER', 'RETIREMENT'];
    const extraKinds = pickN(rng, possibleExtras, extraStepCount);
    const stepKinds: ProofStepKind[] = ['ISSUANCE', ...extraKinds];

    const proofTrail: ProofStep[] = stepKinds.map((kind, idx) => ({
      stepIndex: idx,
      kind,
      timestamp: offsetFrom(mintedAt, idx * randInt(rng, 3_600_000, 86_400_000)),
      actor: xrplAddress(rng),
      txHash: txHash(rng),
      memo: pick(rng, PROOF_STEP_MEMOS[kind]),
    }));

    // ── Custody Events (2-5, CREATED always first) ──

    const custodyCount = randInt(rng, 2, 5);
    const custodyKindPool: CustodyEventKind[] = ['TRANSFERRED', 'VERIFIED', 'LOCKED', 'RETIRED'];
    const custodyExtras = pickN(rng, custodyKindPool, custodyCount - 1);
    const custodyKinds: CustodyEventKind[] = ['CREATED', ...custodyExtras];

    const custodyEvents: CustodyEvent[] = custodyKinds.map((kind, idx) => ({
      eventIndex: idx,
      kind,
      timestamp: offsetFrom(mintedAt, idx * randInt(rng, 1_800_000, 43_200_000)),
      from: idx === 0 ? '0x0000000000000000000000000000000000000000' : xrplAddress(rng),
      to: xrplAddress(rng),
      txHash: txHash(rng),
    }));

    // ── Artifacts (1-3, at least one PDF) ──

    const artifactCount = randInt(rng, 1, 3);
    const artifactKinds: ArtifactKind[] = ['PDF'];
    const otherKinds: ArtifactKind[] = ['IMAGE', 'CSV', 'JSON'];
    for (let a = 1; a < artifactCount; a++) {
      artifactKinds.push(pick(rng, otherKinds));
    }

    const artifacts: Artifact[] = artifactKinds.map((kind) => ({
      id: uuid(rng),
      kind,
      label: pick(rng, ARTIFACT_LABELS[kind]),
      url: `https://vault.nexus.os/artifacts/${hexId(rng, 16)}.${kind.toLowerCase()}`,
      sizeBytes: randInt(rng, 10_000, 5_000_000),
      uploadedAt: offsetFrom(mintedAt, randInt(rng, 0, 7_200_000)),
    }));

    // ── Verification Rules (5 fixed rules, ~85% pass rate each) ──

    const verificationRules: VerificationRule[] = RULE_TEMPLATES.map((tmpl) => {
      const passed = !chance(rng, 0.15);
      return {
        ruleId: uuid(rng),
        name: tmpl.name,
        description: tmpl.description,
        passed,
        checkedAt: offsetFrom(mintedAt, randInt(rng, 60_000, 3_600_000)),
      };
    });

    const passCount = verificationRules.filter((r) => r.passed).length;
    const verificationScore = round((passCount / 5) * 100, 1);

    // ── Risk Reasons (0-3 from pool; 0 if perfect score) ──

    const riskCount = verificationScore >= 100 ? 0 : randInt(rng, 0, 3);
    const riskReasons = pickN(rng, RISK_REASON_POOL, riskCount) as string[];

    // ── Assemble ──

    receipts.push({
      id: `rcpt-${hexId(rng, 12)}`,
      batchId,
      ticker,
      amount,
      region,
      siteId,
      mintedAt,
      expiresAt: offsetFrom(mintedAt, 365 * 86_400_000),
      verificationScore,
      riskReasons,
      proofTrail,
      custodyEvents,
      artifacts,
      verificationRules,
    });
  }

  return receipts;
}
