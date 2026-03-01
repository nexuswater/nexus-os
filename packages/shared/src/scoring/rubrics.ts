/**
 * Default scoring rubrics for residential and commercial subjects.
 * Config-driven: each criterion has an evaluator key that maps to
 * a scoring function in the engine.
 */

import type { ScoringRubric, RubricCriterion } from '../types/scoring';

// ─── Residential Criteria ───────────────────────────────

const RESIDENTIAL_CRITERIA: RubricCriterion[] = [
  // WATER domain
  {
    id: 'W1', label: 'Water Usage Efficiency', domain: 'WATER',
    description: 'Monthly water consumption per occupant relative to regional average',
    maxPoints: 25, weight: 1.0, evaluator: 'waterUsagePerCapita',
    thresholds: { excellent: 40, good: 60, fair: 80, poor: 100 }, // gallons/day
  },
  {
    id: 'W2', label: 'Water Bill Trend', domain: 'WATER',
    description: 'Year-over-year change in water consumption',
    maxPoints: 15, weight: 0.8, evaluator: 'waterBillTrend',
    thresholds: { excellent: -15, good: -5, fair: 0, poor: 10 }, // % change
  },
  {
    id: 'W3', label: 'Water Recycling / Harvesting', domain: 'WATER',
    description: 'Presence and effectiveness of greywater, rainwater, or AWG systems',
    maxPoints: 10, weight: 0.6, evaluator: 'waterRecycling',
    thresholds: { excellent: 30, good: 15, fair: 5, poor: 0 }, // % of usage offset
  },

  // ENERGY domain
  {
    id: 'E1', label: 'Energy Usage Efficiency', domain: 'ENERGY',
    description: 'Monthly energy consumption per sqft relative to regional average',
    maxPoints: 25, weight: 1.0, evaluator: 'energyUsagePerSqft',
    thresholds: { excellent: 5, good: 8, fair: 12, poor: 20 }, // kWh/sqft/month
  },
  {
    id: 'E2', label: 'Renewable Energy Ratio', domain: 'ENERGY',
    description: 'Percentage of energy from renewable sources (solar, wind, etc.)',
    maxPoints: 15, weight: 0.8, evaluator: 'renewableRatio',
    thresholds: { excellent: 80, good: 50, fair: 20, poor: 0 }, // %
  },
  {
    id: 'E3', label: 'Energy Bill Trend', domain: 'ENERGY',
    description: 'Year-over-year change in energy consumption',
    maxPoints: 10, weight: 0.6, evaluator: 'energyBillTrend',
    thresholds: { excellent: -15, good: -5, fair: 0, poor: 10 }, // % change
  },

  // GOVERNANCE domain
  {
    id: 'G1', label: 'Data Verification Level', domain: 'GOVERNANCE',
    description: 'Percentage of bills and readings that are verified',
    maxPoints: 15, weight: 1.0, evaluator: 'verificationLevel',
    thresholds: { excellent: 90, good: 70, fair: 50, poor: 0 }, // %
  },
  {
    id: 'G2', label: 'IoT Device Coverage', domain: 'GOVERNANCE',
    description: 'Number and quality of connected monitoring devices',
    maxPoints: 10, weight: 0.7, evaluator: 'iotCoverage',
    thresholds: { excellent: 3, good: 2, fair: 1, poor: 0 }, // device count
  },

  // RESILIENCE domain
  {
    id: 'R1', label: 'Supply Redundancy', domain: 'RESILIENCE',
    description: 'Alternative water/energy sources available',
    maxPoints: 15, weight: 1.0, evaluator: 'supplyRedundancy',
    thresholds: { excellent: 3, good: 2, fair: 1, poor: 0 }, // source count
  },
  {
    id: 'R2', label: 'Infrastructure Age', domain: 'RESILIENCE',
    description: 'Age and condition of building infrastructure',
    maxPoints: 10, weight: 0.6, evaluator: 'infrastructureAge',
    thresholds: { excellent: 5, good: 15, fair: 30, poor: 50 }, // years
  },
];

// ─── Commercial Criteria (extends residential + extras) ─

const COMMERCIAL_CRITERIA: RubricCriterion[] = [
  ...RESIDENTIAL_CRITERIA.map(c => ({ ...c, id: `C${c.id}` })),
  {
    id: 'CE1', label: 'Demand Response Participation', domain: 'ENERGY',
    description: 'Participation in grid demand response programs',
    maxPoints: 10, weight: 0.5, evaluator: 'demandResponse',
    thresholds: { excellent: 3, good: 2, fair: 1, poor: 0 }, // program count
  },
  {
    id: 'CW1', label: 'Process Water Efficiency', domain: 'WATER',
    description: 'Water used per unit of output',
    maxPoints: 10, weight: 0.5, evaluator: 'processWaterEfficiency',
    thresholds: { excellent: 10, good: 25, fair: 50, poor: 100 }, // gal/unit
  },
];

// ─── Default Rubrics ────────────────────────────────────

export const RESIDENTIAL_RUBRIC: ScoringRubric = {
  id: 'rubric-residential-v1',
  version: '1.0.0',
  subjectKind: 'RESIDENTIAL',
  domains: ['WATER', 'ENERGY', 'GOVERNANCE', 'RESILIENCE'],
  criteria: RESIDENTIAL_CRITERIA,
  passingScore: 40,
  certificationThresholds: {
    platinum: 90,
    gold: 75,
    silver: 60,
    bronze: 40,
  },
  effectiveDate: '2026-01-01T00:00:00Z',
  createdAt: '2025-12-15T00:00:00Z',
};

export const COMMERCIAL_RUBRIC: ScoringRubric = {
  id: 'rubric-commercial-v1',
  version: '1.0.0',
  subjectKind: 'COMMERCIAL',
  domains: ['WATER', 'ENERGY', 'GOVERNANCE', 'RESILIENCE'],
  criteria: COMMERCIAL_CRITERIA,
  passingScore: 45,
  certificationThresholds: {
    platinum: 92,
    gold: 78,
    silver: 62,
    bronze: 45,
  },
  effectiveDate: '2026-01-01T00:00:00Z',
  createdAt: '2025-12-15T00:00:00Z',
};

export const DEFAULT_RUBRICS: Record<string, ScoringRubric> = {
  RESIDENTIAL: RESIDENTIAL_RUBRIC,
  COMMERCIAL: COMMERCIAL_RUBRIC,
  INDUSTRIAL: COMMERCIAL_RUBRIC, // Use commercial as base for now
  MUNICIPAL: COMMERCIAL_RUBRIC,
};
