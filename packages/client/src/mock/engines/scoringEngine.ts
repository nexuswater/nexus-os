/**
 * ScoringEngine — Client-side mock engine for the Nexus Home & Facility
 * Scoring system. Manages subjects, scores, certificates, products,
 * benchmarks, and leaderboard state.
 */

import type {
  Subject, SubjectScore, Certificate, MarketplaceProduct,
  RegionBenchmark, LeaderboardEntry, BillSummary, IoTSummary,
  ScoreDomain, SubjectKind, ScoreTier,
} from '@nexus/shared';
import { calculateScore, DEFAULT_RUBRICS } from '@nexus/shared';
import type { Rng } from '../seed';
import { hexId } from '../seed';
import {
  generateScoredSubjects, generateCertificates, generateProducts,
  generateRegionBenchmarks, generateLeaderboard,
  type ScoredSubject,
} from '../generators/scoring';

export interface ScoringState {
  subjects: Subject[];
  bills: Map<string, BillSummary[]>;     // subjectId → bills
  devices: Map<string, IoTSummary[]>;    // subjectId → devices
  scores: Map<string, SubjectScore>;     // subjectId → latest score
  certificates: Certificate[];
  products: MarketplaceProduct[];
  benchmarks: RegionBenchmark[];
  leaderboard: LeaderboardEntry[];
}

export class ScoringEngine {
  state: ScoringState;

  constructor(rng: Rng) {
    // Generate all mock data
    const scoredSubjects = generateScoredSubjects(rng);
    const certificates = generateCertificates(rng, scoredSubjects);
    const products = generateProducts(rng);
    const benchmarks = generateRegionBenchmarks(rng, scoredSubjects);
    const leaderboard = generateLeaderboard(scoredSubjects);

    // Build maps
    const bills = new Map<string, BillSummary[]>();
    const devices = new Map<string, IoTSummary[]>();
    const scores = new Map<string, SubjectScore>();

    for (const s of scoredSubjects) {
      bills.set(s.subject.id, s.bills);
      devices.set(s.subject.id, s.devices);
      scores.set(s.subject.id, s.score);
    }

    this.state = {
      subjects: scoredSubjects.map(s => s.subject),
      bills,
      devices,
      scores,
      certificates,
      products,
      benchmarks,
      leaderboard,
    };
  }

  // ─── Getters ────────────────────────────────────────────

  getSubjects(): Subject[] {
    return this.state.subjects;
  }

  getSubject(id: string): Subject | undefined {
    return this.state.subjects.find(s => s.id === id);
  }

  getScore(subjectId: string): SubjectScore | undefined {
    return this.state.scores.get(subjectId);
  }

  getBills(subjectId: string): BillSummary[] {
    return this.state.bills.get(subjectId) ?? [];
  }

  getDevices(subjectId: string): IoTSummary[] {
    return this.state.devices.get(subjectId) ?? [];
  }

  getCertificates(): Certificate[] {
    return this.state.certificates;
  }

  getCertificate(id: string): Certificate | undefined {
    return this.state.certificates.find(c => c.id === id);
  }

  getCertificateByHash(hash: string): Certificate | undefined {
    return this.state.certificates.find(c => c.verificationHash === hash);
  }

  getProducts(): MarketplaceProduct[] {
    return this.state.products;
  }

  getProductsByDomain(domain: ScoreDomain): MarketplaceProduct[] {
    return this.state.products.filter(p => p.domains.includes(domain));
  }

  getBenchmarks(): RegionBenchmark[] {
    return this.state.benchmarks;
  }

  getLeaderboard(filter?: {
    region?: string;
    kind?: SubjectKind;
    tier?: ScoreTier;
    limit?: number;
  }): LeaderboardEntry[] {
    let entries = [...this.state.leaderboard];

    if (filter?.region) {
      entries = entries.filter(e => e.regionCode === filter.region);
    }
    if (filter?.kind) {
      const kindSubjectIds = this.state.subjects
        .filter(s => s.kind === filter.kind)
        .map(s => s.id);
      entries = entries.filter(e => kindSubjectIds.includes(e.subjectId));
    }
    if (filter?.tier) {
      entries = entries.filter(e => e.tier === filter.tier);
    }

    // Re-rank after filtering
    entries.forEach((e, i) => { e.rank = i + 1; });

    if (filter?.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  // ─── Actions ──────────────────────────────────────────

  /** Recalculate score for a subject */
  recalculateScore(subjectId: string): SubjectScore | null {
    const subject = this.getSubject(subjectId);
    if (!subject) return null;

    const bills = this.getBills(subjectId);
    const devices = this.getDevices(subjectId);
    const existing = this.getScore(subjectId);
    const rubric = DEFAULT_RUBRICS[subject.kind] ?? DEFAULT_RUBRICS['RESIDENTIAL'];

    const score = calculateScore(rubric, {
      subject,
      bills,
      iotDevices: devices,
      existingScore: existing,
    });

    this.state.scores.set(subjectId, score);

    // Regenerate leaderboard
    const scoredSubjects: ScoredSubject[] = this.state.subjects.map(s => ({
      subject: s,
      bills: this.getBills(s.id),
      devices: this.getDevices(s.id),
      score: this.state.scores.get(s.id)!,
    })).filter(s => s.score);

    this.state.leaderboard = generateLeaderboard(scoredSubjects);

    // Update certificate if exists
    const certIdx = this.state.certificates.findIndex(c => c.subjectId === subjectId);
    if (certIdx !== -1) {
      this.state.certificates[certIdx] = {
        ...this.state.certificates[certIdx],
        overallScore: score.overallScore,
        tier: score.tier,
        domains: score.domains.map(d => ({ domain: d.domain, score: d.score })),
      };
    }

    return score;
  }

  /** Issue a certificate for a scored subject */
  issueCertificate(subjectId: string): Certificate | null {
    const subject = this.getSubject(subjectId);
    const score = this.getScore(subjectId);
    if (!subject || !score || score.tier === 'UNRATED') return null;

    // Check if already certified
    const existing = this.state.certificates.find(c => c.subjectId === subjectId);
    if (existing) return existing;

    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + 3);

    const cert: Certificate = {
      id: `cert-${Date.now().toString(36)}`,
      subjectId: subject.id,
      subjectName: subject.name,
      scoreId: score.id,
      overallScore: score.overallScore,
      tier: score.tier,
      domains: score.domains.map(d => ({ domain: d.domain, score: d.score })),
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'ACTIVE',
      verificationHash: hexId(() => Math.random(), 32),
      verificationUrl: `https://nexus.os/verify/cert-${Date.now().toString(36)}`,
      issuerName: 'Nexus Water DAO',
      txHash: `0x${hexId(() => Math.random(), 64)}`,
    };

    this.state.certificates.push(cert);
    return cert;
  }
}
