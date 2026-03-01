/**
 * Nexus Home & Facility Scoring + Certification Types
 *
 * Covers: Properties, Facilities, Scoring Rubrics, Scores,
 * Certificates, Regions, Leaderboards, Marketplace Products.
 */

// ─── Subject Types (Property / Facility) ────────────────

export type SubjectKind = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'MUNICIPAL';
export type SubjectStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'ARCHIVED';

export interface SubjectAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  regionCode: string;
}

export interface Subject {
  id: string;
  ownerId: string;
  kind: SubjectKind;
  name: string;
  address: SubjectAddress;
  sqft: number;
  yearBuilt: number;
  occupants: number;
  status: SubjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Scoring Rubric (Config-Driven) ─────────────────────

export type ScoreDomain = 'WATER' | 'ENERGY' | 'GOVERNANCE' | 'RESILIENCE';

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  domain: ScoreDomain;
  maxPoints: number;
  weight: number;
  evaluator: string; // function key for scoring engine
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export interface ScoringRubric {
  id: string;
  version: string;
  subjectKind: SubjectKind;
  domains: ScoreDomain[];
  criteria: RubricCriterion[];
  passingScore: number;
  certificationThresholds: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
  };
  effectiveDate: string;
  createdAt: string;
}

// ─── Score Results ──────────────────────────────────────

export type ScoreTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'UNRATED';

export interface CriterionResult {
  criterionId: string;
  label: string;
  domain: ScoreDomain;
  rawValue: number;
  normalizedScore: number; // 0-100
  maxPoints: number;
  earnedPoints: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  explanation: string;
}

export interface DomainScore {
  domain: ScoreDomain;
  score: number; // 0-100
  maxPossible: number;
  earned: number;
  criteriaResults: CriterionResult[];
  completeness: number; // 0-1, data availability
}

export interface SubjectScore {
  id: string;
  subjectId: string;
  rubricId: string;
  rubricVersion: string;
  overallScore: number; // 0-100
  tier: ScoreTier;
  domains: DomainScore[];
  dataCompleteness: number; // 0-1
  fraudFlags: ScoreFraudFlag[];
  calculatedAt: string;
  expiresAt: string;
  history: ScoreSnapshot[];
}

export interface ScoreSnapshot {
  score: number;
  tier: ScoreTier;
  calculatedAt: string;
}

export interface ScoreFraudFlag {
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  evidence: string;
  domain: ScoreDomain;
}

// ─── Certificate Types ──────────────────────────────────

export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING';

export interface Certificate {
  id: string;
  subjectId: string;
  subjectName: string;
  scoreId: string;
  overallScore: number;
  tier: ScoreTier;
  domains: { domain: ScoreDomain; score: number }[];
  issuedAt: string;
  expiresAt: string;
  status: CertificateStatus;
  verificationHash: string;
  verificationUrl: string;
  issuerName: string;
  pdfUrl?: string;
  txHash?: string; // on-chain registration
}

// ─── Region Types ───────────────────────────────────────

export interface RegionBenchmark {
  regionCode: string;
  regionName: string;
  country: string;
  avgWaterScore: number;
  avgEnergyScore: number;
  avgGovernanceScore: number;
  avgResilienceScore: number;
  avgOverallScore: number;
  totalSubjects: number;
  certifiedCount: number;
  topTier: ScoreTier;
  updatedAt: string;
}

// ─── Leaderboard Types ──────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  subjectId: string;
  subjectName: string;
  ownerName: string;
  regionCode: string;
  overallScore: number;
  tier: ScoreTier;
  waterScore: number;
  energyScore: number;
  governanceScore: number;
  resilienceScore: number;
  change30d: number; // score delta
  certifiedSince?: string;
}

export type LeaderboardFilter = {
  region?: string;
  kind?: SubjectKind;
  tier?: ScoreTier;
  domain?: ScoreDomain;
  limit?: number;
  offset?: number;
};

// ─── Marketplace Product Types ──────────────────────────

export type ProductCategory = 'SOLAR' | 'WATER_FILTER' | 'AWG' | 'BATTERY' | 'INSULATION' | 'SMART_METER' | 'HVAC' | 'OTHER';
export type ProductStatus = 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  manufacturer: string;
  model: string;
  priceUSD: number;
  currency: string;
  imageUrl: string;
  domains: ScoreDomain[];
  estimatedScoreImpact: number; // estimated points gained
  energySavingsKwh?: number;
  waterSavingsGal?: number;
  installationDifficulty: 'easy' | 'moderate' | 'professional';
  certifications: string[];
  rating: number;
  reviewCount: number;
  status: ProductStatus;
  vendorId: string;
  vendorName: string;
  createdAt: string;
}

// ─── Bill Summary for Scoring ───────────────────────────

export interface BillSummary {
  billId: string;
  type: 'WATER' | 'ENERGY';
  periodStart: string;
  periodEnd: string;
  usageValue: number;
  usageUnit: string;
  amountUSD: number;
  verified: boolean;
  fraudScore: number;
}

// ─── IoT Summary for Scoring ────────────────────────────

export interface IoTSummary {
  deviceId: string;
  type: string;
  lastReading: number;
  unit: string;
  readingsLast30d: number;
  anomalyCount: number;
  verified: boolean;
}
