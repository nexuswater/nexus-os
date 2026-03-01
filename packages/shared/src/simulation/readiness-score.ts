/**
 * Institutional Readiness Score Engine
 *
 * Calculates a composite readiness score from all simulation engine reports.
 * Produces governance robustness, economic sustainability, attack resistance,
 * legal defensibility, overall index, letter grade, and executive/technical summaries.
 *
 * Scoring methodology:
 *   Each category (0-100) is weighted and combined into an overall index.
 *   Letter grade follows standard academic scale on the overall index.
 */

import type {
  AttackResistanceReport,
  LockingStressReport,
  EmissionReport,
  TreasuryAttackReport,
  ComplianceReport,
  GameTheoryResult,
  ReadinessScore,
} from './types';

// ─── Category Weights ────────────────────────────────────────────────────────

const WEIGHTS = {
  governanceRobustness: 0.25,
  economicSustainability: 0.25,
  attackResistance: 0.25,
  legalDefensibility: 0.25,
};

// ─── Category Score Calculators ──────────────────────────────────────────────

function calculateGovernanceRobustness(
  attackReport: AttackResistanceReport,
  lockingReport: LockingStressReport,
  gameTheory: GameTheoryResult,
): number {
  // Governance robustness is a function of:
  //   - Attack resistance for governance-specific attacks
  //   - Locking health (balanced lock participation)
  //   - Game theory equilibrium stability
  //   - Participation sustainability

  // Extract governance-specific attack scores
  const govAttackTypes = [
    'whale_accumulation', 'whale_lock_dominance', 'quadratic_gaming',
    'federation_collusion', 'low_participation', 'parameter_hijack',
  ];

  const govAttacks = attackReport.scenarios.filter(s =>
    govAttackTypes.includes(s.id)
  );

  // Average defense adequacy for governance attacks
  const govDefenseScore = govAttacks.length > 0
    ? govAttacks.reduce((sum, s) => {
        const defenseScore = s.adequateDefense
          ? Math.max(50, 100 - s.successProbability)
          : Math.max(20, 70 - s.successProbability);
        return sum + defenseScore;
      }, 0) / govAttacks.length
    : 50;

  // Locking health from stress test
  const lockingScores = lockingReport.scenarios.map(s => {
    // Invert centralization and risk metrics
    const centralScore = (1 - s.govCentralization) * 100;
    const liquidityScore = (1 - s.liquidityShockRisk) * 100;
    const cliffScore = (1 - s.unlockCliffRisk) * 100;
    return (centralScore + liquidityScore + cliffScore) / 3;
  });
  const avgLockingScore = lockingScores.reduce((a, b) => a + b, 0) / lockingScores.length;

  // Game theory equilibrium
  const equilibriumScore = gameTheory.nashEquilibriumStable ? 75 : 45;
  const participationScore = 100 - gameTheory.participationDecayRisk;
  const centralizationScore = 100 - gameTheory.centralizationDriftRisk;
  const gameTheoryAvg = (equilibriumScore + participationScore + centralizationScore +
    gameTheory.federationEquilibrium) / 4;

  // Weighted composite
  const composite = govDefenseScore * 0.35 + avgLockingScore * 0.25 + gameTheoryAvg * 0.40;

  return clampScore(composite);
}

function calculateEconomicSustainability(
  emissionReport: EmissionReport,
  lockingReport: LockingStressReport,
  gameTheory: GameTheoryResult,
): number {
  // Economic sustainability is a function of:
  //   - Dividend/incentive sustainability across stress scenarios
  //   - Treasury depletion risk
  //   - Lock sustainability (long-term participation incentives)
  //   - Rational actor alignment

  // Emission scenario analysis
  const emissionScores = emissionReport.scenarios.map(s => {
    // Score based on how many months of sustainability
    const dividendScore = Math.min(100, (s.dividendSustainableMonths / 36) * 100);
    const treasuryScore = Math.min(100, (s.treasuryDepletionMonths / 48) * 100);
    const govStabilityScore = (10 - s.govInstability) * 10;
    return (dividendScore + treasuryScore + govStabilityScore) / 3;
  });
  const avgEmissionScore = emissionScores.reduce((a, b) => a + b, 0) / emissionScores.length;

  // Locking sustainability
  const lockVolatilityScores = lockingReport.scenarios.map(s => {
    // Lower volatility amplification is better
    return Math.max(0, 100 - (s.volatilityAmplification - 1) * 50);
  });
  const avgLockVolatility = lockVolatilityScores.reduce((a, b) => a + b, 0) / lockVolatilityScores.length;

  // Game theory economic dimensions
  const lockSustainability = gameTheory.longTermLockSustainability;
  const actorAlignment = gameTheory.rationalActorIncentiveAlignment;
  const gameEconAvg = (lockSustainability + actorAlignment) / 2;

  // Composite
  const composite = avgEmissionScore * 0.45 + avgLockVolatility * 0.20 + gameEconAvg * 0.35;

  return clampScore(composite);
}

function calculateAttackResistance(
  attackReport: AttackResistanceReport,
  treasuryReport: TreasuryAttackReport,
  gameTheory: GameTheoryResult,
): number {
  // Attack resistance combines:
  //   - Overall governance attack resistance
  //   - Treasury attack surface risk
  //   - Whale deterrence strength

  const govResistance = attackReport.overallScore;

  // Treasury risk (invert: higher risk = lower resistance)
  const treasuryResistance = Math.max(0, 100 - treasuryReport.overallRiskScore);

  // Whale deterrence from game theory
  const whaleDeterrence = gameTheory.whaleDeterrenceStrength;

  // Count of adequate defenses
  const adequateDefensesPct = attackReport.scenarios.filter(s => s.adequateDefense).length /
    attackReport.scenarios.length * 100;

  // Composite
  const composite = govResistance * 0.35 + treasuryResistance * 0.30 +
    whaleDeterrence * 0.15 + adequateDefensesPct * 0.20;

  return clampScore(composite);
}

function calculateLegalDefensibility(
  complianceReport: ComplianceReport,
): number {
  // Legal defensibility from compliance analysis
  const legalIndex = complianceReport.legalDefensibilityIndex;
  const clarityScore = complianceReport.complianceClarityScore;

  // Factor in severity of compliance risks
  const riskLevelScores: Record<string, number> = {
    low: 90,
    medium: 65,
    high: 35,
    critical: 10,
  };

  const riskScores = complianceReport.risks.map(r => riskLevelScores[r.riskLevel] || 50);
  const avgRiskScore = riskScores.length > 0
    ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    : 50;

  // Composite
  const composite = legalIndex * 0.40 + clarityScore * 0.30 + avgRiskScore * 0.30;

  return clampScore(composite);
}

// ─── Grade & Summary Generators ──────────────────────────────────────────────

function assignGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function generateExecutiveSummary(
  governance: number,
  economic: number,
  attack: number,
  legal: number,
  overall: number,
  grade: string,
): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (governance >= 70) strengths.push('governance robustness');
  else weaknesses.push('governance robustness');

  if (economic >= 70) strengths.push('economic sustainability');
  else weaknesses.push('economic sustainability');

  if (attack >= 70) strengths.push('attack resistance');
  else weaknesses.push('attack resistance');

  if (legal >= 70) strengths.push('legal defensibility');
  else weaknesses.push('legal defensibility');

  let summary = `NEXUS Protocol Institutional Readiness: Grade ${grade} (${overall}/100). `;

  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.join(', ')}. `;
  }
  if (weaknesses.length > 0) {
    summary += `Areas requiring attention: ${weaknesses.join(', ')}. `;
  }

  if (overall >= 80) {
    summary += 'The protocol demonstrates strong institutional readiness for production deployment. ';
  } else if (overall >= 65) {
    summary += 'The protocol shows adequate readiness with specific areas that should be hardened before institutional-grade deployment. ';
  } else if (overall >= 50) {
    summary += 'The protocol needs significant improvements before institutional deployment. Priority remediation recommended. ';
  } else {
    summary += 'The protocol requires fundamental architectural improvements before institutional consideration. ';
  }

  return summary;
}

function generateTechnicalSummary(
  governance: number,
  economic: number,
  attack: number,
  legal: number,
  attackReport: AttackResistanceReport,
  treasuryReport: TreasuryAttackReport,
  gameTheory: GameTheoryResult,
): string {
  const criticalIssues: string[] = [];

  // Governance
  if (governance < 60) {
    criticalIssues.push(
      `Governance robustness (${governance}/100): ` +
      `${attackReport.criticalWeaknesses.length} critical weaknesses identified`
    );
  }

  // Attack surface
  if (attack < 60) {
    const inadequateDefenses = attackReport.scenarios.filter(s => !s.adequateDefense).length;
    criticalIssues.push(
      `Attack resistance (${attack}/100): ${inadequateDefenses} of ${attackReport.scenarios.length} ` +
      `attack vectors have inadequate defenses`
    );
  }

  // Treasury
  if (treasuryReport.overallRiskScore > 15) {
    criticalIssues.push(
      `Treasury risk score: ${treasuryReport.overallRiskScore}/100, ` +
      `${treasuryReport.criticalFailurePoints.length} critical failure points`
    );
  }

  // Game theory
  if (!gameTheory.nashEquilibriumStable) {
    criticalIssues.push('Nash equilibrium is unstable -- protocol incentives may not sustain participation');
  }
  if (gameTheory.centralizationDriftRisk > 50) {
    criticalIssues.push(`Centralization drift risk: ${gameTheory.centralizationDriftRisk}/100`);
  }

  let summary = `Technical Assessment: Governance=${governance}, Economic=${economic}, ` +
    `Attack=${attack}, Legal=${legal}. `;

  if (criticalIssues.length > 0) {
    summary += `Critical issues (${criticalIssues.length}): ${criticalIssues.join('; ')}. `;
  } else {
    summary += 'No critical technical issues identified. ';
  }

  summary += `Nash equilibrium: ${gameTheory.nashEquilibriumStable ? 'STABLE' : 'UNSTABLE'}. ` +
    `Whale deterrence: ${gameTheory.whaleDeterrenceStrength}/100. ` +
    `Federation equilibrium: ${gameTheory.federationEquilibrium}/100.`;

  return summary;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function clampScore(score: number): number {
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Calculate the institutional readiness score from all simulation engine reports.
 *
 * @param attackReport - Governance attack resistance report
 * @param lockingReport - Locking stress test report
 * @param emissionReport - Emission collapse scenario report
 * @param treasuryReport - Treasury risk analysis report
 * @param complianceReport - Regulatory compliance assessment
 * @param gameTheory - Game theory equilibrium analysis
 *
 * @returns ReadinessScore with category scores, overall index, letter grade, and summaries
 */
export function calculateReadinessScore(
  attackReport: AttackResistanceReport,
  lockingReport: LockingStressReport,
  emissionReport: EmissionReport,
  treasuryReport: TreasuryAttackReport,
  complianceReport: ComplianceReport,
  gameTheory: GameTheoryResult,
): ReadinessScore {
  // Calculate category scores
  const governanceRobustness = calculateGovernanceRobustness(
    attackReport, lockingReport, gameTheory
  );
  const economicSustainability = calculateEconomicSustainability(
    emissionReport, lockingReport, gameTheory
  );
  const attackResistance = calculateAttackResistance(
    attackReport, treasuryReport, gameTheory
  );
  const legalDefensibility = calculateLegalDefensibility(complianceReport);

  // Calculate weighted overall index
  const overallIndex = clampScore(
    governanceRobustness * WEIGHTS.governanceRobustness +
    economicSustainability * WEIGHTS.economicSustainability +
    attackResistance * WEIGHTS.attackResistance +
    legalDefensibility * WEIGHTS.legalDefensibility
  );

  const grade = assignGrade(overallIndex);

  const executiveSummary = generateExecutiveSummary(
    governanceRobustness, economicSustainability,
    attackResistance, legalDefensibility,
    overallIndex, grade
  );

  const technicalSummary = generateTechnicalSummary(
    governanceRobustness, economicSustainability,
    attackResistance, legalDefensibility,
    attackReport, treasuryReport, gameTheory
  );

  return {
    governanceRobustness,
    economicSustainability,
    attackResistance,
    legalDefensibility,
    institutionalReadinessIndex: overallIndex,
    executiveSummary,
    technicalSummary,
    grade,
  };
}
