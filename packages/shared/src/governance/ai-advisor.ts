/**
 * AI Governance Advisor — Advisory-only analysis module
 * Never auto-executes. Logs all recommendations.
 * Provides risk analysis, whale detection, outcome simulation.
 */

export interface AIAdvisorRecommendation {
  id: string;
  type: 'proposal_risk' | 'whale_alert' | 'emission_suggestion' | 'treasury_rebalance' | 'parameter_tune';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  analysis: string;
  recommendation: string;
  confidence: number; // 0-1
  relatedProposalId?: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface AdvisorConfig {
  enabled: boolean;
  /** Log all recommendations (required) */
  loggingEnabled: true;
  /** Auto-execute is NEVER allowed */
  autoExecute: false;
  /** Whale detection threshold (% of total VP) */
  whaleThreshold: number;
  /** Minimum confidence to surface recommendation */
  minConfidence: number;
}

export const DEFAULT_ADVISOR_CONFIG: AdvisorConfig = {
  enabled: false, // requires governance vote to enable
  loggingEnabled: true,
  autoExecute: false, // NEVER true
  whaleThreshold: 0.15, // 15% of total VP
  minConfidence: 0.6,
};

/** Analyze a proposal for risk factors */
export function analyzeProposalRisk(proposal: {
  type: string;
  treasuryImpact?: number;
  parameterChanges?: string[];
  votingPowerConcentration?: number;
}): AIAdvisorRecommendation {
  const risks: string[] = [];
  let severity: AIAdvisorRecommendation['severity'] = 'info';
  let confidence = 0.7;

  if (proposal.treasuryImpact && proposal.treasuryImpact > 100000) {
    risks.push(`High treasury impact: $${proposal.treasuryImpact.toLocaleString()}`);
    severity = 'warning';
    confidence = 0.85;
  }

  if (proposal.parameterChanges && proposal.parameterChanges.length > 3) {
    risks.push(`Multiple parameter changes (${proposal.parameterChanges.length}) increase complexity risk`);
    severity = 'warning';
  }

  if (proposal.votingPowerConcentration && proposal.votingPowerConcentration > 0.3) {
    risks.push('Voting power concentration above 30% — potential capture risk');
    severity = 'critical';
    confidence = 0.9;
  }

  if (proposal.type === 'emergency') {
    risks.push('Emergency proposal bypasses standard timelock');
    severity = severity === 'critical' ? 'critical' : 'warning';
  }

  return {
    id: `adv-${Date.now()}`,
    type: 'proposal_risk',
    severity,
    title: `Risk Analysis: ${proposal.type} proposal`,
    analysis: risks.length > 0 ? risks.join('. ') + '.' : 'No significant risks detected.',
    recommendation: risks.length > 0
      ? 'Review identified risks before voting. Consider extended voting period for high-impact proposals.'
      : 'Proposal appears low-risk. Standard voting procedures apply.',
    confidence,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
}

/** Detect potential whale capture */
export function detectWhaleCapture(
  voterPowers: Array<{ wallet: string; power: number }>,
  config: AdvisorConfig = DEFAULT_ADVISOR_CONFIG,
): AIAdvisorRecommendation | null {
  const totalPower = voterPowers.reduce((s, v) => s + v.power, 0);
  if (totalPower === 0) return null;

  const whales = voterPowers.filter(v => (v.power / totalPower) > config.whaleThreshold);
  if (whales.length === 0) return null;

  const whaleShare = whales.reduce((s, w) => s + w.power, 0) / totalPower;

  return {
    id: `adv-whale-${Date.now()}`,
    type: 'whale_alert',
    severity: whaleShare > 0.5 ? 'critical' : 'warning',
    title: `Whale Concentration Alert: ${(whaleShare * 100).toFixed(1)}% of VP`,
    analysis: `${whales.length} address(es) control ${(whaleShare * 100).toFixed(1)}% of total voting power. ` +
      `Threshold: ${(config.whaleThreshold * 100).toFixed(0)}%.`,
    recommendation: whaleShare > 0.5
      ? 'Consider enabling quadratic voting mode or vote cap to mitigate concentration risk.'
      : 'Monitor concentration levels. Current safeguards may be sufficient.',
    confidence: 0.95,
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };
}
