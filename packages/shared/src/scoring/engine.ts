/**
 * NexusScoreEngine — Config-driven scoring engine.
 *
 * Takes a Subject + its associated data (bills, IoT readings, devices)
 * and computes a 0-100 score across 4 domains: Water, Energy, Governance, Resilience.
 *
 * Features:
 * - Pluggable evaluator functions keyed by string
 * - Data completeness tracking
 * - Fraud flag detection
 * - Score tier assignment
 * - Explainability (each criterion gets an explanation string)
 */

import type {
  Subject, ScoringRubric, SubjectScore, DomainScore,
  CriterionResult, ScoreDomain, ScoreTier, ScoreFraudFlag,
  RubricCriterion, BillSummary, IoTSummary, ScoreSnapshot,
} from '../types/scoring';

// ─── Scoring Input ──────────────────────────────────────

export interface ScoringInput {
  subject: Subject;
  bills: BillSummary[];
  iotDevices: IoTSummary[];
  existingScore?: SubjectScore;
  /** Additional metadata for evaluators */
  meta?: {
    renewableSources?: number;
    alternateSources?: number;
    demandResponsePrograms?: number;
    processWaterPerUnit?: number;
  };
}

// ─── Evaluator Functions ────────────────────────────────

type Evaluator = (input: ScoringInput, criterion: RubricCriterion) => {
  rawValue: number;
  available: boolean;
  explanation: string;
};

/** Normalize a raw value against thresholds → 0-100 */
function normalizeScore(
  rawValue: number,
  thresholds: RubricCriterion['thresholds'],
  lowerIsBetter: boolean = true,
): { score: number; tier: CriterionResult['tier'] } {
  const { excellent, good, fair, poor } = thresholds;

  if (lowerIsBetter) {
    if (rawValue <= excellent) return { score: 100, tier: 'excellent' };
    if (rawValue <= good) return { score: 80 + 20 * (good - rawValue) / (good - excellent), tier: 'good' };
    if (rawValue <= fair) return { score: 60 + 20 * (fair - rawValue) / (fair - good), tier: 'fair' };
    if (rawValue <= poor) return { score: 30 + 30 * (poor - rawValue) / (poor - fair), tier: 'poor' };
    return { score: Math.max(0, 30 * (1 - (rawValue - poor) / poor)), tier: 'poor' };
  } else {
    // Higher is better (e.g., renewable ratio, verification level)
    if (rawValue >= excellent) return { score: 100, tier: 'excellent' };
    if (rawValue >= good) return { score: 80 + 20 * (rawValue - good) / (excellent - good), tier: 'good' };
    if (rawValue >= fair) return { score: 60 + 20 * (rawValue - fair) / (good - fair), tier: 'fair' };
    if (rawValue >= poor) return { score: 30 + 30 * (rawValue - poor) / (fair - poor), tier: 'poor' };
    return { score: Math.max(0, 30 * rawValue / (poor || 1)), tier: 'poor' };
  }
}

// Helper: group bills by type
function billsByType(bills: BillSummary[], type: 'WATER' | 'ENERGY'): BillSummary[] {
  return bills.filter(b => b.type === type);
}

// Helper: average usage from bills
function avgMonthlyUsage(bills: BillSummary[]): number {
  if (bills.length === 0) return 0;
  return bills.reduce((s, b) => s + b.usageValue, 0) / bills.length;
}

// Helper: bill trend (compare first half vs second half)
function billTrendPct(bills: BillSummary[]): number {
  if (bills.length < 4) return 0;
  const sorted = [...bills].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const avgFirst = avgMonthlyUsage(firstHalf);
  const avgSecond = avgMonthlyUsage(secondHalf);
  if (avgFirst === 0) return 0;
  return ((avgSecond - avgFirst) / avgFirst) * 100;
}

const EVALUATORS: Record<string, Evaluator> = {
  waterUsagePerCapita: (input, criterion) => {
    const waterBills = billsByType(input.bills, 'WATER');
    if (waterBills.length === 0) {
      return { rawValue: 0, available: false, explanation: 'No water bills available for scoring.' };
    }
    const avgUsage = avgMonthlyUsage(waterBills);
    const daysInMonth = 30;
    const perCapita = input.subject.occupants > 0
      ? avgUsage / input.subject.occupants / daysInMonth
      : avgUsage / daysInMonth;
    return {
      rawValue: perCapita,
      available: true,
      explanation: `Average ${perCapita.toFixed(1)} gallons/day per occupant across ${waterBills.length} bills.`,
    };
  },

  waterBillTrend: (input, _criterion) => {
    const waterBills = billsByType(input.bills, 'WATER');
    if (waterBills.length < 4) {
      return { rawValue: 0, available: false, explanation: 'Need at least 4 water bills for trend analysis.' };
    }
    const trend = billTrendPct(waterBills);
    return {
      rawValue: trend,
      available: true,
      explanation: `Water usage ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% over the billing period.`,
    };
  },

  waterRecycling: (input, _criterion) => {
    const waterDevices = input.iotDevices.filter(d =>
      ['AWG', 'GREYWATER_RECYCLING', 'WATER_METER'].includes(d.type) && d.verified
    );
    const offsetPct = waterDevices.length * 10; // rough estimate
    return {
      rawValue: offsetPct,
      available: waterDevices.length > 0,
      explanation: waterDevices.length > 0
        ? `${waterDevices.length} water recycling device(s) contributing ~${offsetPct}% offset.`
        : 'No verified water recycling or harvesting devices found.',
    };
  },

  energyUsagePerSqft: (input, _criterion) => {
    const energyBills = billsByType(input.bills, 'ENERGY');
    if (energyBills.length === 0) {
      return { rawValue: 0, available: false, explanation: 'No energy bills available for scoring.' };
    }
    const avgUsage = avgMonthlyUsage(energyBills);
    const perSqft = input.subject.sqft > 0 ? avgUsage / input.subject.sqft : avgUsage;
    return {
      rawValue: perSqft,
      available: true,
      explanation: `Average ${perSqft.toFixed(2)} kWh/sqft/month across ${energyBills.length} bills.`,
    };
  },

  renewableRatio: (input, _criterion) => {
    const solarDevices = input.iotDevices.filter(d =>
      ['SOLAR_FARM', 'HYDROGEN_GENERATOR'].includes(d.type)
    );
    const ratio = (input.meta?.renewableSources ?? solarDevices.length) > 0
      ? Math.min(100, (input.meta?.renewableSources ?? solarDevices.length) * 30)
      : 0;
    return {
      rawValue: ratio,
      available: true,
      explanation: ratio > 0
        ? `${ratio}% estimated renewable energy from ${solarDevices.length} source(s).`
        : 'No renewable energy sources detected.',
    };
  },

  energyBillTrend: (input, _criterion) => {
    const energyBills = billsByType(input.bills, 'ENERGY');
    if (energyBills.length < 4) {
      return { rawValue: 0, available: false, explanation: 'Need at least 4 energy bills for trend analysis.' };
    }
    const trend = billTrendPct(energyBills);
    return {
      rawValue: trend,
      available: true,
      explanation: `Energy usage ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% over the billing period.`,
    };
  },

  verificationLevel: (input, _criterion) => {
    const totalBills = input.bills.length;
    const verifiedBills = input.bills.filter(b => b.verified).length;
    const verifiedDevices = input.iotDevices.filter(d => d.verified).length;
    const totalItems = totalBills + input.iotDevices.length;
    const verifiedItems = verifiedBills + verifiedDevices;
    const pct = totalItems > 0 ? (verifiedItems / totalItems) * 100 : 0;
    return {
      rawValue: pct,
      available: totalItems > 0,
      explanation: `${verifiedItems}/${totalItems} items verified (${pct.toFixed(0)}%).`,
    };
  },

  iotCoverage: (input, _criterion) => {
    const verifiedCount = input.iotDevices.filter(d => d.verified).length;
    return {
      rawValue: verifiedCount,
      available: true,
      explanation: `${verifiedCount} verified IoT device(s) connected.`,
    };
  },

  supplyRedundancy: (input, _criterion) => {
    const sources = input.meta?.alternateSources ?? input.iotDevices.length;
    return {
      rawValue: Math.min(sources, 5),
      available: true,
      explanation: `${sources} alternative supply source(s) identified.`,
    };
  },

  infrastructureAge: (input, _criterion) => {
    const age = new Date().getFullYear() - input.subject.yearBuilt;
    return {
      rawValue: age,
      available: true,
      explanation: `Building is ${age} years old (built ${input.subject.yearBuilt}).`,
    };
  },

  demandResponse: (input, _criterion) => {
    const count = input.meta?.demandResponsePrograms ?? 0;
    return {
      rawValue: count,
      available: true,
      explanation: count > 0
        ? `Participating in ${count} demand response program(s).`
        : 'Not enrolled in any demand response programs.',
    };
  },

  processWaterEfficiency: (input, _criterion) => {
    const value = input.meta?.processWaterPerUnit ?? 50;
    return {
      rawValue: value,
      available: true,
      explanation: `${value} gallons per unit of output.`,
    };
  },
};

// ─── Core Scoring Engine ────────────────────────────────

export function calculateScore(
  rubric: ScoringRubric,
  input: ScoringInput,
): SubjectScore {
  const criteriaResults: CriterionResult[] = [];
  let totalDataPoints = 0;
  let availableDataPoints = 0;

  // Evaluate each criterion
  for (const criterion of rubric.criteria) {
    const evaluator = EVALUATORS[criterion.evaluator];
    totalDataPoints++;

    if (!evaluator) {
      criteriaResults.push({
        criterionId: criterion.id,
        label: criterion.label,
        domain: criterion.domain,
        rawValue: 0,
        normalizedScore: 0,
        maxPoints: criterion.maxPoints,
        earnedPoints: 0,
        tier: 'poor',
        explanation: `No evaluator found for '${criterion.evaluator}'.`,
      });
      continue;
    }

    const result = evaluator(input, criterion);

    if (result.available) availableDataPoints++;

    const lowerIsBetter = ['waterUsagePerCapita', 'waterBillTrend', 'energyUsagePerSqft',
      'energyBillTrend', 'infrastructureAge', 'processWaterEfficiency'].includes(criterion.evaluator);

    const { score, tier } = result.available
      ? normalizeScore(result.rawValue, criterion.thresholds, lowerIsBetter)
      : { score: 0, tier: 'poor' as const };

    const earnedPoints = (score / 100) * criterion.maxPoints * criterion.weight;

    criteriaResults.push({
      criterionId: criterion.id,
      label: criterion.label,
      domain: criterion.domain,
      rawValue: result.rawValue,
      normalizedScore: Math.round(score * 10) / 10,
      maxPoints: criterion.maxPoints,
      earnedPoints: Math.round(earnedPoints * 10) / 10,
      tier,
      explanation: result.explanation,
    });
  }

  // Aggregate by domain
  const domainScores: DomainScore[] = rubric.domains.map(domain => {
    const domainCriteria = criteriaResults.filter(c => c.domain === domain);
    const maxPossible = domainCriteria.reduce((s, c) => s + c.maxPoints, 0);
    const earned = domainCriteria.reduce((s, c) => s + c.earnedPoints, 0);
    const domainAvailable = domainCriteria.filter(c => c.normalizedScore > 0).length;
    const domainTotal = domainCriteria.length;

    return {
      domain,
      score: maxPossible > 0 ? Math.round((earned / maxPossible) * 100 * 10) / 10 : 0,
      maxPossible,
      earned: Math.round(earned * 10) / 10,
      criteriaResults: domainCriteria,
      completeness: domainTotal > 0 ? domainAvailable / domainTotal : 0,
    };
  });

  // Calculate overall score (weighted average across domains)
  const totalMax = criteriaResults.reduce((s, c) => s + c.maxPoints, 0);
  const totalEarned = criteriaResults.reduce((s, c) => s + c.earnedPoints, 0);
  const overallScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100 * 10) / 10 : 0;

  // Determine tier
  const tier = getTier(overallScore, rubric.certificationThresholds);

  // Detect fraud flags
  const fraudFlags = detectFraudFlags(input);

  // Data completeness
  const dataCompleteness = totalDataPoints > 0 ? availableDataPoints / totalDataPoints : 0;

  // Build history
  const history: ScoreSnapshot[] = input.existingScore?.history
    ? [...input.existingScore.history, { score: overallScore, tier, calculatedAt: new Date().toISOString() }]
    : [{ score: overallScore, tier, calculatedAt: new Date().toISOString() }];

  // Keep only last 12 snapshots
  const trimmedHistory = history.slice(-12);

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 3); // 90-day validity

  return {
    id: `score-${input.subject.id}-${Date.now()}`,
    subjectId: input.subject.id,
    rubricId: rubric.id,
    rubricVersion: rubric.version,
    overallScore,
    tier,
    domains: domainScores,
    dataCompleteness,
    fraudFlags,
    calculatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    history: trimmedHistory,
  };
}

// ─── Tier Assignment ────────────────────────────────────

function getTier(
  score: number,
  thresholds: ScoringRubric['certificationThresholds'],
): ScoreTier {
  if (score >= thresholds.platinum) return 'PLATINUM';
  if (score >= thresholds.gold) return 'GOLD';
  if (score >= thresholds.silver) return 'SILVER';
  if (score >= thresholds.bronze) return 'BRONZE';
  return 'UNRATED';
}

// ─── Fraud Detection ────────────────────────────────────

function detectFraudFlags(input: ScoringInput): ScoreFraudFlag[] {
  const flags: ScoreFraudFlag[] = [];

  // Check for suspicious bill patterns
  const allBills = input.bills;

  // Flag: Usage drops to zero
  const zeroBills = allBills.filter(b => b.usageValue === 0);
  if (zeroBills.length > 0) {
    flags.push({
      code: 'USAGE_DROP_TO_ZERO',
      severity: 'MEDIUM',
      message: `${zeroBills.length} bill(s) show zero usage — possible vacancy or meter issue.`,
      evidence: zeroBills.map(b => b.billId).join(', '),
      domain: zeroBills[0].type === 'WATER' ? 'WATER' : 'ENERGY',
    });
  }

  // Flag: Very high fraud scores on bills
  const highFraudBills = allBills.filter(b => b.fraudScore > 70);
  if (highFraudBills.length > 0) {
    flags.push({
      code: 'HIGH_FRAUD_SCORE_BILLS',
      severity: 'HIGH',
      message: `${highFraudBills.length} bill(s) have fraud scores above 70.`,
      evidence: highFraudBills.map(b => `${b.billId}(${b.fraudScore})`).join(', '),
      domain: 'GOVERNANCE',
    });
  }

  // Flag: IoT anomalies
  const anomalyDevices = input.iotDevices.filter(d => d.anomalyCount > 5);
  if (anomalyDevices.length > 0) {
    flags.push({
      code: 'IOT_ANOMALY_CLUSTER',
      severity: 'MEDIUM',
      message: `${anomalyDevices.length} device(s) showing elevated anomaly counts.`,
      evidence: anomalyDevices.map(d => `${d.deviceId}(${d.anomalyCount} anomalies)`).join(', '),
      domain: 'GOVERNANCE',
    });
  }

  // Flag: No verification on majority of data
  const unverifiedBills = allBills.filter(b => !b.verified);
  if (allBills.length > 0 && unverifiedBills.length / allBills.length > 0.6) {
    flags.push({
      code: 'LOW_VERIFICATION_RATE',
      severity: 'LOW',
      message: `${Math.round((unverifiedBills.length / allBills.length) * 100)}% of bills are unverified.`,
      evidence: `${unverifiedBills.length}/${allBills.length} unverified`,
      domain: 'GOVERNANCE',
    });
  }

  // Flag: Usage spike (any bill >3x average)
  for (const type of ['WATER', 'ENERGY'] as const) {
    const typeBills = billsByType(allBills, type);
    if (typeBills.length >= 3) {
      const avg = avgMonthlyUsage(typeBills);
      const spikes = typeBills.filter(b => b.usageValue > avg * 3);
      if (spikes.length > 0) {
        flags.push({
          code: 'USAGE_SPIKE',
          severity: 'MEDIUM',
          message: `${spikes.length} ${type.toLowerCase()} bill(s) show usage >3x average.`,
          evidence: spikes.map(b => `${b.billId}(${b.usageValue})`).join(', '),
          domain: type,
        });
      }
    }
  }

  return flags;
}

// ─── Export Helpers ──────────────────────────────────────

export { EVALUATORS };
export type { Evaluator };
