/**
 * Constitutional Hash Anchoring — XRPL Memo Field
 * Governance documents anchored on-chain for immutability.
 * All amendments require governance vote.
 */

export interface ConstitutionalDocument {
  id: string;
  title: string;
  version: string;
  contentHash: string; // SHA-256 hash of document content
  previousHash?: string;
  anchoringTxHash?: string;
  anchoringLedger?: 'xrpl' | 'evm';
  status: 'draft' | 'ratified' | 'amended' | 'superseded';
  ratifiedByProposalId?: string;
  createdAt: string;
  ratifiedAt?: string;
}

export interface Amendment {
  id: string;
  documentId: string;
  title: string;
  description: string;
  contentHash: string;
  proposalId: string;
  status: 'proposed' | 'ratified' | 'rejected';
  createdAt: string;
  ratifiedAt?: string;
}

export interface LegalState {
  constitutionHash: string;
  amendmentHashes: string[];
  governanceRulesHash: string;
  anchoringTxHashes: string[];
  lastUpdated: string;
  lastUpdatedByProposal?: string;
}

export interface ConstitutionalConfig {
  /** Require supermajority for constitutional amendments */
  amendmentQuorum: number;
  /** Approval threshold for amendments */
  amendmentThreshold: number;
  /** Minimum voting period for amendments (hours) */
  amendmentVotingPeriodHours: number;
  /** Timelock before amendment takes effect (hours) */
  amendmentTimelockHours: number;
}

export const DEFAULT_CONSTITUTIONAL_CONFIG: ConstitutionalConfig = {
  amendmentQuorum: 0.40,
  amendmentThreshold: 0.67,
  amendmentVotingPeriodHours: 168, // 7 days
  amendmentTimelockHours: 72, // 3 days
};

/** Generate SHA-256-like hash for display (mock) */
export function mockContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
}

/** Verify a document hash matches */
export function verifyDocumentHash(content: string, expectedHash: string): boolean {
  return mockContentHash(content) === expectedHash;
}

/** Create an amendment timeline from documents */
export function buildAmendmentTimeline(
  documents: ConstitutionalDocument[],
  amendments: Amendment[],
): Array<{ date: string; type: 'ratification' | 'amendment'; title: string; hash: string }> {
  const timeline: Array<{ date: string; type: 'ratification' | 'amendment'; title: string; hash: string }> = [];

  for (const doc of documents) {
    if (doc.ratifiedAt) {
      timeline.push({
        date: doc.ratifiedAt,
        type: 'ratification',
        title: `${doc.title} v${doc.version}`,
        hash: doc.contentHash,
      });
    }
  }

  for (const amend of amendments) {
    if (amend.ratifiedAt) {
      timeline.push({
        date: amend.ratifiedAt,
        type: 'amendment',
        title: amend.title,
        hash: amend.contentHash,
      });
    }
  }

  return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
