/**
 * Compliance Risk Assessment Engine
 *
 * Evaluates 5 regulatory risk dimensions for the NEXUS protocol.
 * Scores legal defensibility and compliance clarity for each dimension.
 *
 * IMPORTANT: WTR and ENG are "impact accounting instruments" -- NOT securities.
 * NXS is a "governance & coordination token." All assessments use infrastructure
 * language consistent with the NEXUS protocol philosophy.
 *
 * Protocol context:
 *   - DUNA (Decentralized Unincorporated Nonprofit Association) legal wrapper
 *   - WTR/ENG = impact accounting instruments tracking verified resource offsets
 *   - NXS = governance and coordination token for protocol participation
 *   - Source Node NFTs = infrastructure access credentials with tier-based multipliers
 *   - Cross-chain: XRPL hub + EVM spokes
 *   - Revenue model: protocol coordination fees, not investment returns
 */

import type { ComplianceRisk, ComplianceReport } from './types';

// ─── Risk Assessments ────────────────────────────────────────────────────────

function assessSecuritiesClassification(): ComplianceRisk {
  // Howey Test analysis for NXS, WTR, ENG
  // Investment of money + common enterprise + expectation of profits + efforts of others
  //
  // NXS: Governance token -- utility-first, not an investment contract.
  //   - No expectation of profit from NXS holding alone
  //   - VP is functional (voting rights), not a profit-sharing mechanism
  //   - NXS minted through protocol participation (retirement of impact instruments), not purchased for speculation
  //
  // WTR/ENG: Impact accounting instruments
  //   - Represent verified resource offset accounting, not investment contracts
  //   - Value derives from environmental attestation, not speculative return
  //   - Retire over 12 months -- they are consumable, not investable
  //   - Analogous to carbon credits or renewable energy certificates

  return {
    category: 'Securities Classification',
    description:
      `Assessment of whether NXS (governance & coordination token), WTR/ENG ` +
      `(impact accounting instruments), or Source Node NFTs (infrastructure access ` +
      `credentials) could be classified as securities under the Howey Test or ` +
      `analogous international frameworks.`,
    riskLevel: 'medium',
    score: 72,
    mitigations: [
      'NXS is a governance & coordination token with functional utility (voting, delegation, proposal creation)',
      'WTR/ENG are impact accounting instruments that retire over 12 months -- they are consumable infrastructure records',
      'Source Node NFTs are infrastructure access credentials, not revenue-generating investment instruments',
      'DUNA structure provides legal wrapper that separates protocol operation from investment enterprise',
      'No promises of profit or financial returns are made in protocol documentation or marketing',
      'NXS is earned through protocol participation (impact instrument retirement), not primarily through purchase',
      'Token categories map to established non-security classifications: utility tokens, environmental certificates, access passes',
    ],
    recommendations: [
      'Maintain strict language discipline: never reference "returns," "yield," "profit," or "investment" in relation to tokens',
      'Ensure all token descriptions use infrastructure/coordination language in all materials',
      'Engage securities counsel for formal no-action letter or regulatory clarity application',
      'Document functional utility of each token category with usage analytics',
      'Implement prominent disclaimers: "Not an investment. Impact accounting infrastructure."',
      'Monitor SEC, CFTC, and international regulatory guidance for digital asset classification updates',
    ],
  };
}

function assessGovernanceTokenProfitExpectation(): ComplianceRisk {
  // Does NXS create reasonable expectation of profit?
  // Key factors:
  //   - NXS grants voting power, not direct financial returns
  //   - NXS minting is tied to impact instrument retirement (utility action)
  //   - Any value appreciation is incidental to governance utility, not promised
  //   - Protocol does not buy back NXS or guarantee price floors

  return {
    category: 'Governance Token Profit Expectation',
    description:
      `Assessment of whether NXS governance & coordination token creates a ` +
      `reasonable expectation of profit under securities law frameworks. ` +
      `Evaluates marketing language, token distribution model, and whether ` +
      `the protocol's design implies investment returns.`,
    riskLevel: 'low',
    score: 82,
    mitigations: [
      'NXS provides governance rights (vote, delegate, propose) -- functional utility, not profit mechanism',
      'NXS minting rate (0.02 per unit retired) is tied to protocol participation, not investment activity',
      'No buyback programs, price floors, or guaranteed appreciation mechanisms',
      'Protocol does not promote NXS as a financial instrument or investment opportunity',
      'DUNA nonprofit structure reinforces non-commercial purpose',
      'Governance participation is the primary value proposition, not financial return',
    ],
    recommendations: [
      'Audit all marketing channels and community communications for profit-expectation language',
      'Prohibit team members from making price predictions or return promises publicly',
      'Add governance-utility-focused onboarding: emphasize voting power, not token value',
      'Document and publish token utility metrics (votes cast, proposals created) alongside any market data',
      'Implement internal communications policy prohibiting investment framing',
    ],
  };
}

function assessDividendRegulatoryRisk(): ComplianceRisk {
  // If the protocol distributes dividends or "coordination incentives,"
  // this closely resembles profit-sharing and heightens securities risk.
  //
  // Key distinction: NEXUS distributes "protocol coordination incentives"
  // funded by operational revenue, not investment returns.
  // These incentives reward active participation, not passive holding.

  return {
    category: 'Dividend / Coordination Incentive Regulatory Risk',
    description:
      `Assessment of regulatory risk from protocol coordination incentives ` +
      `(revenue-funded distributions to active participants). Evaluates whether ` +
      `distribution mechanisms could be characterized as dividends or profit-sharing, ` +
      `triggering securities classification for associated tokens.`,
    riskLevel: 'high',
    score: 55,
    mitigations: [
      'Distributions are "coordination incentives" tied to active protocol participation, not passive holding',
      'Recipients must meet activity thresholds (governance participation, impact verification) to qualify',
      'DUNA nonprofit structure: distributions are operational incentives, not shareholder dividends',
      'Incentive amounts are determined by governance vote, not automatically accrued',
      'Incentives are funded by protocol coordination fees, not investment returns',
    ],
    recommendations: [
      'CRITICAL: Never use the word "dividend" in protocol documentation, UI, or communications',
      'Rename all distribution mechanisms to "coordination incentives" or "participation rewards"',
      'Require minimum governance participation threshold (e.g., voted in 3 of last 5 proposals) to receive incentives',
      'Structure distributions as retroactive grants for verified contributions, not automatic yields',
      'Engage tax counsel in each operating jurisdiction to assess distribution tax treatment',
      'Consider restructuring distributions as reimbursement for governance costs (gas, time) rather than profit-sharing',
      'Implement progressive activity requirements: higher participation = larger incentive allocation',
      'Document clear economic substance distinction between coordination incentives and securities dividends',
    ],
  };
}

function assessDAOLegalExposure(): ComplianceRisk {
  // DUNA (Decentralized Unincorporated Nonprofit Association) legal analysis.
  // DUNA provides limited liability and operational flexibility but has
  // jurisdiction-specific constraints.

  return {
    category: 'DAO Legal Entity Exposure',
    description:
      `Assessment of legal exposure under the DUNA (Decentralized Unincorporated ` +
      `Nonprofit Association) structure. Evaluates liability protection, jurisdictional ` +
      `coverage, member obligations, and regulatory standing across operating jurisdictions.`,
    riskLevel: 'medium',
    score: 70,
    mitigations: [
      'DUNA provides limited liability protection for participants',
      'Clear governance framework with defined roles, responsibilities, and authority boundaries',
      'On-chain governance creates transparent, auditable decision record',
      'Multisig treasury management with documented authority scope',
      'Nonprofit framing aligns with environmental impact mission',
    ],
    recommendations: [
      'Obtain legal opinions on DUNA enforceability in top 5 participant jurisdictions',
      'Establish registered agent in primary operating jurisdictions',
      'Create member agreement with clear dispute resolution and liability limitation provisions',
      'Implement KYC/KYB for proposal creators and multisig signers (not all participants)',
      'Draft and publish DAO operating agreement on-chain with version control',
      'Establish legal defense fund (5% of treasury) for regulatory engagement',
      'Monitor Wyoming, Tennessee, and other DAO-friendly jurisdiction legislation',
    ],
  };
}

function assessCrossChainCustodyRisk(): ComplianceRisk {
  // Cross-chain custody introduces regulatory complexity:
  // - Different jurisdictions for XRPL vs EVM chains
  // - Bridge custody model (burn-on-origin)
  // - Cross-chain asset classification may differ by jurisdiction
  // - Custodial vs non-custodial characterization of bridge operators

  return {
    category: 'Cross-Chain Custody & Compliance Risk',
    description:
      `Assessment of regulatory risk from cross-chain operations (XRPL hub + EVM spokes). ` +
      `Evaluates custody model classification, bridge operator obligations, cross-chain ` +
      `asset characterization, and multi-jurisdictional compliance requirements.`,
    riskLevel: 'medium',
    score: 65,
    mitigations: [
      'Burn-on-origin bridge model is non-custodial: no intermediary holds both sides simultaneously',
      'XRPL serves as primary settlement layer with established regulatory positioning',
      'Cross-chain voting uses attestation proofs, not custodial escrow',
      'Impact accounting instruments (WTR/ENG) remain XRPL-only, simplifying classification',
      'Bridge operations are protocol-level automation, not third-party custodial services',
    ],
    recommendations: [
      'Document bridge architecture in regulatory-accessible format (not just technical spec)',
      'Obtain legal opinion on bridge operator classification (custodial vs non-custodial) per jurisdiction',
      'Implement cross-chain transaction monitoring for AML/sanctions compliance',
      'Consider limiting EVM spoke deployment to jurisdictions with clear crypto regulatory frameworks',
      'Add bridge rate limiting and anomaly detection for compliance monitoring',
      'Publish cross-chain custody model whitepaper for regulatory stakeholder education',
      'Monitor MiCA (EU), DCCPA (US), and other cross-border digital asset regulations',
    ],
  };
}

// ─── Scoring & Analysis ──────────────────────────────────────────────────────

function calculateLegalDefensibility(risks: ComplianceRisk[]): number {
  // Weighted average of per-risk defensibility scores
  // Higher-risk items get more weight
  const weights: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const r of risks) {
    const w = weights[r.riskLevel] || 1;
    weightedScore += r.score * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
}

function calculateComplianceClarity(risks: ComplianceRisk[]): number {
  // Compliance clarity is inversely proportional to number of open questions
  // and directly proportional to the number of mitigations in place
  let mitigationCount = 0;
  let recommendationCount = 0;

  for (const r of risks) {
    mitigationCount += r.mitigations.length;
    recommendationCount += r.recommendations.length;
  }

  // Ratio of mitigations to total items indicates how clear compliance path is
  const totalItems = mitigationCount + recommendationCount;
  const clarity = totalItems > 0
    ? Math.round((mitigationCount / totalItems) * 100)
    : 50;

  return Math.max(30, Math.min(90, clarity));
}

function generateDUNAProtections(): string[] {
  return [
    'DUNA limited liability shield protects individual participants from entity-level obligations',
    'Nonprofit framing eliminates profit-distribution characterization for coordination incentives',
    'Governance framework satisfies organizational structure requirements in DAO-friendly jurisdictions',
    'On-chain operating agreement provides transparent, immutable governance record',
    'DUNA enables compliant interaction with traditional legal system (contracts, banking, disputes)',
  ];
}

function generateWordingAdjustments(): string[] {
  return [
    'Replace all instances of "dividend" with "coordination incentive" or "participation reward"',
    'Replace "yield" with "protocol coordination fee distribution" where applicable',
    'Replace "investment" with "participation" in all token-related documentation',
    'Replace "returns" with "incentive allocations" in governance and treasury contexts',
    'Ensure "impact accounting instrument" (not "token" or "asset") is used for WTR/ENG',
    'Use "governance & coordination token" (not "utility token") for NXS',
    'Use "infrastructure access credential" (not "collectible" or "asset") for Source Node NFTs',
  ];
}

function generateEmissionRefinements(): string[] {
  return [
    'Tie NXS emission exclusively to verified impact actions (retirement), not market activity',
    'Document emission rate (0.02 per unit retired) as protocol-mechanical, not yield-generating',
    'Ensure emission documentation emphasizes coordination function, not value accrual',
    'Add emission cap or decay schedule to prevent perception of unlimited token creation',
  ];
}

function generateDisclosureEnhancements(): string[] {
  return [
    'Publish comprehensive risk disclosure covering all token categories',
    'Add prominent "Not an investment" disclaimer on all token-related interfaces',
    'Disclose treasury management strategy and allocation in quarterly transparency reports',
    'Publish governance participation metrics to demonstrate functional utility of NXS',
    'Disclose cross-chain bridge mechanics and associated risks in user-facing documentation',
    'Add jurisdiction-specific regulatory status notices where required',
  ];
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Assess regulatory compliance risks for the NEXUS protocol.
 * Evaluates securities classification, profit expectation, distribution risk,
 * DAO legal exposure, and cross-chain custody compliance.
 *
 * All assessments use infrastructure language consistent with NEXUS protocol philosophy:
 *   - WTR/ENG = "impact accounting instruments"
 *   - NXS = "governance & coordination token"
 *   - Source Node NFTs = "infrastructure access credentials"
 */
export function analyzeCompliance(): ComplianceReport {
  const risks: ComplianceRisk[] = [
    assessSecuritiesClassification(),
    assessGovernanceTokenProfitExpectation(),
    assessDividendRegulatoryRisk(),
    assessDAOLegalExposure(),
    assessCrossChainCustodyRisk(),
  ];

  return {
    risks,
    legalDefensibilityIndex: calculateLegalDefensibility(risks),
    complianceClarityScore: calculateComplianceClarity(risks),
    wordingAdjustments: generateWordingAdjustments(),
    emissionRefinements: generateEmissionRefinements(),
    disclosureEnhancements: generateDisclosureEnhancements(),
  };
}
