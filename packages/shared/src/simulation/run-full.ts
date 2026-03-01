/**
 * Full Stress Test Orchestrator
 *
 * Runs all simulation engines and produces a comprehensive
 * FullStressTestReport for institutional readiness assessment.
 *
 * Engines orchestrated:
 *   1. Governance Attack Analysis
 *   2. Locking Stress Test
 *   3. Emission Collapse Scenarios
 *   4. Treasury Risk Analysis
 *   5. Compliance Risk Assessment
 *   6. Game Theory Equilibrium
 *   7. Institutional Readiness Score (composite)
 */

import type {
  SimulationConfig,
  TokenomicsInputs,
  FullStressTestReport,
  AttackResistanceReport,
  LockingStressReport,
  EmissionReport,
  TreasuryAttackReport,
  ComplianceReport,
  GameTheoryResult,
  ReadinessScore,
} from './types';
import { DEFAULT_SIM_CONFIG, DEFAULT_TOKENOMICS } from './types';
import { runMonteCarloSimulation } from './monte-carlo';
import { analyzeGovernanceAttacks } from './governance-attacks';
import { analyzeLockingStress } from './locking-stress';
import { analyzeEmissionScenarios } from './emission-scenarios';
import { analyzeTreasuryRisk } from './treasury-risk';
import { analyzeCompliance } from './compliance-model';
import { analyzeGameTheory } from './game-theory';
import { calculateReadinessScore } from './readiness-score';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface StressTestOptions {
  /** Override default tokenomics inputs */
  inputs?: Partial<TokenomicsInputs>;
  /** Override default simulation config */
  config?: Partial<SimulationConfig>;
  /** Skip Monte Carlo simulation (faster, stress-test-only mode) */
  skipMonteCarlo?: boolean;
  /** Verbose logging to console */
  verbose?: boolean;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Run the complete adversarial stress test suite.
 *
 * Executes all simulation engines in sequence:
 *   1. Monte Carlo tokenomics simulation (optional)
 *   2. Governance attack analysis (10 scenarios)
 *   3. Locking stress test (3 scenarios: 10%, 50%, 80%)
 *   4. Emission collapse scenarios (4 scenarios)
 *   5. Treasury risk analysis (6 threat vectors)
 *   6. Regulatory compliance assessment (5 risk dimensions)
 *   7. Game theory equilibrium analysis (8 dimensions)
 *   8. Institutional readiness score (composite)
 *
 * @param options - Optional overrides for inputs, config, and behavior
 * @returns FullStressTestReport with all engine results and readiness score
 */
export function runFullStressTest(
  options: StressTestOptions = {},
): FullStressTestReport {
  const startTime = Date.now();

  const inputs: TokenomicsInputs = {
    ...DEFAULT_TOKENOMICS,
    ...options.inputs,
  };

  const config: SimulationConfig = {
    ...DEFAULT_SIM_CONFIG,
    ...options.config,
  };

  const log = options.verbose
    ? (msg: string) => console.log(`[NEXUS Stress Test] ${msg}`)
    : (_msg: string) => {};

  // ─── Phase 1: Monte Carlo Simulation ─────────────────────────────────────

  log('Phase 1: Running Monte Carlo tokenomics simulation...');
  const monteCarloResult = options.skipMonteCarlo
    ? runMonteCarloSimulation(inputs, { ...config, iterations: 10 }) // minimal run for types
    : runMonteCarloSimulation(inputs, config);
  log(`  Monte Carlo complete: stability=${monteCarloResult.stabilityIndex}, ` +
    `inflation_risk=${monteCarloResult.inflationRiskScore}, ` +
    `treasury_runway=${monteCarloResult.treasuryRunway} months`);

  // ─── Phase 2: Governance Attack Analysis ─────────────────────────────────

  log('Phase 2: Analyzing governance attack vectors...');
  const attackReport: AttackResistanceReport = analyzeGovernanceAttacks();
  log(`  Attack resistance: ${attackReport.overallScore}/100, ` +
    `${attackReport.criticalWeaknesses.length} critical weaknesses`);

  // ─── Phase 3: Locking Stress Test ────────────────────────────────────────

  log('Phase 3: Running locking stress test...');
  const lockingReport: LockingStressReport = analyzeLockingStress();
  log(`  Locking analysis: ${lockingReport.scenarios.length} scenarios, ` +
    `dangerous threshold: ${(lockingReport.dangerousThreshold * 100).toFixed(0)}%`);

  // ─── Phase 4: Emission Collapse Scenarios ────────────────────────────────

  log('Phase 4: Modeling emission collapse scenarios...');
  const emissionReport: EmissionReport = analyzeEmissionScenarios();
  log(`  Emission analysis: ${emissionReport.scenarios.length} scenarios, ` +
    `${emissionReport.emergencyRules.length} emergency rules defined`);

  // ─── Phase 5: Treasury Risk Analysis ─────────────────────────────────────

  log('Phase 5: Analyzing treasury attack surface...');
  const treasuryReport: TreasuryAttackReport = analyzeTreasuryRisk();
  log(`  Treasury risk: ${treasuryReport.overallRiskScore}/100, ` +
    `${treasuryReport.criticalFailurePoints.length} critical failure points`);

  // ─── Phase 6: Compliance Assessment ──────────────────────────────────────

  log('Phase 6: Assessing regulatory compliance...');
  const complianceReport: ComplianceReport = analyzeCompliance();
  log(`  Compliance: defensibility=${complianceReport.legalDefensibilityIndex}/100, ` +
    `clarity=${complianceReport.complianceClarityScore}/100`);

  // ─── Phase 7: Game Theory Analysis ───────────────────────────────────────

  log('Phase 7: Evaluating game theory equilibrium...');
  const gameTheory: GameTheoryResult = analyzeGameTheory();
  log(`  Game theory: Nash stable=${gameTheory.nashEquilibriumStable}, ` +
    `whale deterrence=${gameTheory.whaleDeterrenceStrength}/100, ` +
    `centralization drift risk=${gameTheory.centralizationDriftRisk}/100`);

  // ─── Phase 8: Institutional Readiness Score ──────────────────────────────

  log('Phase 8: Calculating institutional readiness score...');
  const readiness: ReadinessScore = calculateReadinessScore(
    attackReport,
    lockingReport,
    emissionReport,
    treasuryReport,
    complianceReport,
    gameTheory,
  );
  log(`  Readiness: Grade ${readiness.grade} (${readiness.institutionalReadinessIndex}/100)`);
  log(`    Governance: ${readiness.governanceRobustness}/100`);
  log(`    Economic: ${readiness.economicSustainability}/100`);
  log(`    Attack: ${readiness.attackResistance}/100`);
  log(`    Legal: ${readiness.legalDefensibility}/100`);

  // ─── Assemble Report ────────────────────────────────────────────────────

  const executionTimeMs = Date.now() - startTime;
  log(`\nComplete. Total execution time: ${executionTimeMs}ms`);

  return {
    config,
    inputs,
    monteCarloResult,
    attackReport,
    lockingReport,
    emissionReport,
    treasuryReport,
    complianceReport,
    gameTheory,
    readiness,
    generatedAt: new Date().toISOString(),
  };
}
