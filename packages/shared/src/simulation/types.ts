/**
 * Simulation Types — Formal Tokenomics + Adversarial Stress Test
 *
 * Type definitions for Monte Carlo simulation, governance attack modeling,
 * locking stress tests, treasury risk analysis, and institutional readiness scoring.
 */

// ─── Simulation Config ─────────────────────────────────

export interface SimulationConfig {
  /** Number of Monte Carlo iterations */
  iterations: number;
  /** Time horizon in years */
  horizonYears: number;
  /** Monthly time steps */
  stepsPerYear: 12;
  /** Random seed for reproducibility */
  seed: number;
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  iterations: 1000,
  horizonYears: 10,
  stepsPerYear: 12,
  seed: 0x4E585553, // "NXUS"
};

// ─── Tokenomics Model Inputs ─────────────────────────────

export interface TokenomicsInputs {
  /** Initial circulating WTR supply */
  initialWtrSupply: number;
  /** Initial circulating ENG supply */
  initialEngSupply: number;
  /** Initial NXS supply */
  initialNxsSupply: number;
  /** Monthly WTR issuance rate (units/month) */
  wtrIssuanceRate: number;
  /** Monthly ENG issuance rate (units/month) */
  engIssuanceRate: number;
  /** Member growth rate (% per month) */
  memberGrowthRate: number;
  /** Initial active member count */
  initialMembers: number;
  /** Lock participation rate (0-1) */
  lockParticipation: number;
  /** Average lock duration (months) */
  avgLockDuration: number;
  /** Monthly retirement rate (fraction of active supply) */
  retirementRate: number;
  /** NXS reward rate per unit retired */
  nxsRewardRate: number;
  /** Treasury yield rate (% annual) */
  treasuryYieldRate: number;
  /** Monthly revenue growth rate (%) */
  revenueGrowthRate: number;
  /** Initial monthly revenue (USD) */
  initialMonthlyRevenue: number;
  /** Volatility factor for Monte Carlo (0-1) */
  volatility: number;
}

export const DEFAULT_TOKENOMICS: TokenomicsInputs = {
  initialWtrSupply: 500_000,
  initialEngSupply: 250_000,
  initialNxsSupply: 1_000_000,
  wtrIssuanceRate: 25_000,
  engIssuanceRate: 15_000,
  memberGrowthRate: 0.05,
  initialMembers: 500,
  lockParticipation: 0.3,
  avgLockDuration: 6,
  retirementRate: 0.02,
  nxsRewardRate: 0.02,
  treasuryYieldRate: 0.04,
  revenueGrowthRate: 0.03,
  initialMonthlyRevenue: 50_000,
  volatility: 0.15,
};

// ─── Simulation Output (per time step) ─────────────────

export interface TokenomicsSnapshot {
  month: number;
  year: number;
  /** Circulating supplies */
  wtrCirculating: number;
  engCirculating: number;
  nxsCirculating: number;
  /** Locked supplies */
  wtrLocked: number;
  engLocked: number;
  nxsLocked: number;
  /** Retired (burned) totals */
  wtrRetiredTotal: number;
  engRetiredTotal: number;
  /** Active member count */
  activeMembers: number;
  /** Governance participation rate */
  govParticipationRate: number;
  /** Treasury balance (USD) */
  treasuryBalance: number;
  /** Monthly revenue */
  monthlyRevenue: number;
  /** Dividend per member (if applicable) */
  dividendPerMember: number;
  /** Lock ratio (locked / total) */
  lockRatio: number;
  /** Inflation rate (annualized) */
  inflationRate: number;
}

export interface MonteCarloResult {
  /** Percentile results (p5, p25, p50, p75, p95) */
  percentiles: {
    p5: TokenomicsSnapshot[];
    p25: TokenomicsSnapshot[];
    p50: TokenomicsSnapshot[];
    p75: TokenomicsSnapshot[];
    p95: TokenomicsSnapshot[];
  };
  /** Summary scores */
  stabilityIndex: number;
  inflationRiskScore: number;
  govConcentrationRisk: number;
  dividendSustainability: number;
  treasuryRunway: number;
}

// ─── Governance Attack Scenarios ─────────────────────────

export type AttackType =
  | 'whale_accumulation'
  | 'whale_lock_dominance'
  | 'quadratic_gaming'
  | 'federation_collusion'
  | 'low_participation'
  | 'sybil_attack'
  | 'cross_chain_double_vote'
  | 'parameter_hijack'
  | 'treasury_drain'
  | 'ai_advisor_manipulation';

export interface AttackScenario {
  id: AttackType;
  name: string;
  description: string;
  /** Probability of success (0-100) */
  successProbability: number;
  /** Required capital (USD equivalent) */
  requiredCapital: number;
  /** Time to execute (days) */
  timeToExecute: number;
  /** Severity if successful (0-10) */
  severity: number;
  /** Current mitigation in place */
  mitigations: string[];
  /** Recommended additional safeguards */
  recommendations: string[];
  /** Whether current protocol defenses are sufficient */
  adequateDefense: boolean;
}

export interface AttackResistanceReport {
  overallScore: number; // 0-100
  scenarios: AttackScenario[];
  criticalWeaknesses: string[];
  recommendedSafeguards: string[];
}

// ─── Locking Stress Test ─────────────────────────────────

export interface LockingScenario {
  name: string;
  lockParticipation: number; // 0-1
  /** Governance centralization index (0=decentralized, 1=centralized) */
  govCentralization: number;
  /** Liquidity shock risk (0-1) */
  liquidityShockRisk: number;
  /** Market volatility amplification */
  volatilityAmplification: number;
  /** Unlock cliff risk (0-1) */
  unlockCliffRisk: number;
}

export interface LockingStressReport {
  scenarios: LockingScenario[];
  dangerousThreshold: number;
  recommendedMaxBoost: number;
  recommendedMaxLockDuration: number;
}

// ─── Emission Collapse ────────────────────────────────────

export interface EmissionScenario {
  name: string;
  description: string;
  revenueDecline: number;
  treasuryYieldCollapse: number;
  marketCrash: number;
  suddenUnlock: number;
  /** Months until dividend unsustainable */
  dividendSustainableMonths: number;
  /** Months until treasury depleted */
  treasuryDepletionMonths: number;
  /** Governance instability score (0-10) */
  govInstability: number;
  recommendations: string[];
}

export interface EmissionReport {
  scenarios: EmissionScenario[];
  emergencyRules: string[];
  dynamicThrottling: string[];
}

// ─── Treasury Attack Surface ──────────────────────────────

export interface TreasuryThreat {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-1
  impact: number; // 0-10
  riskScore: number; // probability * impact
  defenses: string[];
  gaps: string[];
}

export interface TreasuryAttackReport {
  threats: TreasuryThreat[];
  criticalFailurePoints: string[];
  requiredUpgrades: string[];
  overallRiskScore: number;
}

// ─── Regulatory Compliance ───────────────────────────────

export interface ComplianceRisk {
  category: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100 (higher = more defensible)
  mitigations: string[];
  recommendations: string[];
}

export interface ComplianceReport {
  risks: ComplianceRisk[];
  legalDefensibilityIndex: number; // 0-100
  complianceClarityScore: number; // 0-100
  wordingAdjustments: string[];
  emissionRefinements: string[];
  disclosureEnhancements: string[];
}

// ─── Game Theory ─────────────────────────────────────────

export interface GameTheoryResult {
  nashEquilibriumStable: boolean;
  centralizationDriftRisk: number; // 0-100
  participationDecayRisk: number; // 0-100
  rationalActorIncentiveAlignment: number; // 0-100
  longTermLockSustainability: number; // 0-100
  whaleDeterrenceStrength: number; // 0-100
  federationEquilibrium: number; // 0-100
  findings: string[];
  recommendations: string[];
}

// ─── Institutional Readiness ─────────────────────────────

export interface ReadinessScore {
  governanceRobustness: number; // 0-100
  economicSustainability: number; // 0-100
  attackResistance: number; // 0-100
  legalDefensibility: number; // 0-100
  institutionalReadinessIndex: number; // 0-100
  executiveSummary: string;
  technicalSummary: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// ─── Full Report ────────────────────────────────────────

export interface FullStressTestReport {
  config: SimulationConfig;
  inputs: TokenomicsInputs;
  monteCarloResult: MonteCarloResult;
  attackReport: AttackResistanceReport;
  lockingReport: LockingStressReport;
  emissionReport: EmissionReport;
  treasuryReport: TreasuryAttackReport;
  complianceReport: ComplianceReport;
  gameTheory: GameTheoryResult;
  readiness: ReadinessScore;
  generatedAt: string;
}
