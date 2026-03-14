/**
 * Agent Economy mock data — powers Skills Market, Environmental Market,
 * Negotiations, Trust, Bots, Receipts pages.
 */

import type {
  EconAgent, EconSkill, SkillListing, EconQuote, EconPermit,
  EconExecution, EconReceipt, BalanceLedger, FeeConfig, EnvAsset,
  TradeIntent, RetirementIntent, RFQ, Offer, NegotiationMessage,
  Escrow, AgentReputation, AgentEvent, Dispute, AutonomousBot,
  BotRun, BotSignal, AgentPolicyProfile,
} from '@nexus/shared';

// ─── Agents ───────────────────────────────────────────────

export function generateEconAgents(): EconAgent[] {
  return [
    { id: 'agent_001', name: 'Nexus Core Agent', type: 'NEXUS', status: 'ACTIVE', verificationLevel: 'PREMIUM', description: 'The primary Nexus protocol agent. Routes trades, issues permits, and manages platform operations.', endpoints: { gateway: 'https://api.nexus.os/agent/core' }, pubkeys: { ed25519: 'nx_pub_core_001' }, reputationScore: 95, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-03-01T12:00:00Z' },
    { id: 'agent_002', name: 'AquaVerify', type: 'PARTNER', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Water bill verification and fraud detection specialist.', endpoints: { gateway: 'https://api.aquaverify.io/v1' }, pubkeys: { ed25519: 'av_pub_002' }, reputationScore: 88, createdAt: '2025-04-10T00:00:00Z', updatedAt: '2026-02-28T10:00:00Z' },
    { id: 'agent_003', name: 'EnergyScore Labs', type: 'PARTNER', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Energy efficiency scoring and home performance analysis.', endpoints: { gateway: 'https://api.energyscore.labs/v2' }, pubkeys: { ed25519: 'es_pub_003' }, reputationScore: 91, createdAt: '2025-05-20T00:00:00Z', updatedAt: '2026-02-27T14:00:00Z' },
    { id: 'agent_004', name: 'GreenAudit Co', type: 'THIRD_PARTY', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Environmental compliance auditing and certificate generation.', endpoints: { gateway: 'https://greenaudit.co/api' }, pubkeys: { ed25519: 'ga_pub_004' }, reputationScore: 82, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-02-25T09:00:00Z' },
    { id: 'agent_005', name: 'OracleStream', type: 'PARTNER', status: 'ACTIVE', verificationLevel: 'PREMIUM', description: 'Real-time environmental price feeds and market data oracle.', endpoints: { gateway: 'https://oraclestream.io/feed' }, pubkeys: { ed25519: 'os_pub_005' }, reputationScore: 93, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
    { id: 'agent_006', name: 'ComplianceBot', type: 'THIRD_PARTY', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Regulatory compliance checking for environmental credit transactions.', endpoints: { gateway: 'https://compliancebot.dev/check' }, pubkeys: { ed25519: 'cb_pub_006' }, reputationScore: 79, createdAt: '2025-08-10T00:00:00Z', updatedAt: '2026-02-20T11:00:00Z' },
    { id: 'agent_007', name: 'LiquidFlow', type: 'THIRD_PARTY', status: 'ACTIVE', verificationLevel: 'UNVERIFIED', description: 'Provides liquidity routing for environmental asset swaps.', endpoints: { gateway: 'https://liquidflow.xyz/route' }, pubkeys: { ed25519: 'lf_pub_007' }, reputationScore: 65, createdAt: '2025-10-01T00:00:00Z', updatedAt: '2026-02-18T16:00:00Z' },
    { id: 'agent_008', name: 'UtilityBridge', type: 'PARTNER', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Connects municipal utility data feeds to Nexus platform.', endpoints: { gateway: 'https://utilitybridge.net/api' }, pubkeys: { ed25519: 'ub_pub_008' }, reputationScore: 86, createdAt: '2025-06-15T00:00:00Z', updatedAt: '2026-02-22T13:00:00Z' },
    { id: 'agent_009', name: 'CarbonCalc', type: 'THIRD_PARTY', status: 'ACTIVE', verificationLevel: 'UNVERIFIED', description: 'Carbon offset calculator using EPA and IPCC methodologies.', endpoints: { gateway: 'https://carboncalc.app/v1' }, pubkeys: { ed25519: 'cc_pub_009' }, reputationScore: 58, createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
    { id: 'agent_010', name: 'MeterMind', type: 'THIRD_PARTY', status: 'ACTIVE', verificationLevel: 'VERIFIED', description: 'Smart meter data analysis and anomaly detection.', endpoints: { gateway: 'https://metermind.io/api' }, pubkeys: { ed25519: 'mm_pub_010' }, reputationScore: 74, createdAt: '2025-09-20T00:00:00Z', updatedAt: '2026-02-24T15:00:00Z' },
    { id: 'agent_011', name: 'ShadowPool', type: 'THIRD_PARTY', status: 'SUSPENDED', verificationLevel: 'UNVERIFIED', description: 'Dark pool routing agent (suspended for policy violations).', endpoints: {}, pubkeys: { ed25519: 'sp_pub_011' }, reputationScore: 32, createdAt: '2025-12-01T00:00:00Z', updatedAt: '2026-02-10T08:00:00Z' },
  ];
}

// ─── Skills ───────────────────────────────────────────────

export function generateEconSkills(): (EconSkill & { listing: SkillListing })[] {
  return [
    { id: 'skill_001', agentId: 'agent_002', slug: 'bill-parse-v1', name: 'Bill Parser', description: 'Parses utility bills (PDF/image) into structured data with fraud detection.', category: 'VERIFICATION', pricingModel: 'PER_DOC', basePrice: 0.50, successFeeBps: 0, meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.2.0', createdAt: '2025-04-15T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z', listing: { id: 'lst_001', skillId: 'skill_001', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['parsing', 'verification', 'fraud'], featuredRank: 1 } },
    { id: 'skill_002', agentId: 'agent_003', slug: 'home-score-v1', name: 'Home Efficiency Score', description: 'Computes Water and Energy efficiency scores from device data and bills.', category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 1.00, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 1 }, version: '2.0.0', createdAt: '2025-05-25T00:00:00Z', updatedAt: '2026-02-27T00:00:00Z', listing: { id: 'lst_002', skillId: 'skill_002', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['scoring', 'efficiency', 'certificate'], featuredRank: 2 } },
    { id: 'skill_003', agentId: 'agent_004', slug: 'audit-pack-v1', name: 'Audit Pack Generator', description: 'Generates compliance audit packs from receipt data with manifests.', category: 'COMPLIANCE', pricingModel: 'PER_CALL', basePrice: 2.50, successFeeBps: 0, meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requiresKycTier: 1 }, version: '1.0.0', createdAt: '2025-07-10T00:00:00Z', updatedAt: '2026-02-25T00:00:00Z', listing: { id: 'lst_003', skillId: 'skill_003', visibility: 'PUBLIC', allowedDomains: ['utility', 'enterprise'], allowedCallers: [], tags: ['audit', 'compliance', 'export'], featuredRank: 3 } },
    { id: 'skill_004', agentId: 'agent_005', slug: 'oracle-price-v1', name: 'Environmental Price Oracle', description: 'Real-time price feeds for water, energy, and carbon credits across venues.', category: 'ORACLE', pricingModel: 'PER_1K_EVENTS', basePrice: 0.10, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '3.1.0', createdAt: '2025-03-20T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z', listing: { id: 'lst_004', skillId: 'skill_004', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['oracle', 'pricing', 'market-data'], featuredRank: 4 } },
    { id: 'skill_005', agentId: 'agent_001', slug: 'best-execution-router-v1', name: 'Best Execution Router', description: 'Finds optimal trade routes across XRPL and EVM venues.', category: 'SETTLEMENT', pricingModel: 'SUCCESS_FEE', basePrice: 0, successFeeBps: 50, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.5.0', createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z', listing: { id: 'lst_005', skillId: 'skill_005', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['routing', 'settlement', 'trading'], featuredRank: 5 } },
    { id: 'skill_006', agentId: 'agent_002', slug: 'meter-verify-v1', name: 'Smart Meter Verifier', description: 'Cross-references IoT meter data against bill claims.', category: 'VERIFICATION', pricingModel: 'PER_CALL', basePrice: 0.75, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.1.0', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z', listing: { id: 'lst_006', skillId: 'skill_006', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['iot', 'verification', 'meter'], featuredRank: 6 } },
    { id: 'skill_007', agentId: 'agent_006', slug: 'kyc-check-v1', name: 'KYC Compliance Check', description: 'Runs compliance checks against regulatory requirements.', category: 'COMPLIANCE', pricingModel: 'PER_CALL', basePrice: 1.50, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 2 }, version: '1.0.0', createdAt: '2025-08-15T00:00:00Z', updatedAt: '2026-02-18T00:00:00Z', listing: { id: 'lst_007', skillId: 'skill_007', visibility: 'PARTNER_ONLY', allowedDomains: ['enterprise'], allowedCallers: [], tags: ['kyc', 'compliance', 'regulatory'], featuredRank: 7 } },
    { id: 'skill_008', agentId: 'agent_007', slug: 'liquidity-scan-v1', name: 'Liquidity Scanner', description: 'Scans available liquidity across DEX pools and order books.', category: 'SETTLEMENT', pricingModel: 'PER_CALL', basePrice: 0.25, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-10-05T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z', listing: { id: 'lst_008', skillId: 'skill_008', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['liquidity', 'dex', 'scan'], featuredRank: 8 } },
    { id: 'skill_009', agentId: 'agent_008', slug: 'utility-feed-v1', name: 'Utility Data Feed', description: 'Streams municipal utility consumption data in real time.', category: 'ORACLE', pricingModel: 'SUBSCRIPTION', basePrice: 5.00, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 1 }, version: '2.0.0', createdAt: '2025-06-20T00:00:00Z', updatedAt: '2026-02-22T00:00:00Z', listing: { id: 'lst_009', skillId: 'skill_009', visibility: 'PARTNER_ONLY', allowedDomains: ['utility', 'enterprise'], allowedCallers: [], tags: ['utility', 'streaming', 'data'], featuredRank: 9 } },
    { id: 'skill_010', agentId: 'agent_009', slug: 'carbon-offset-v1', name: 'Carbon Offset Calculator', description: 'Calculates verified carbon offsets from usage data.', category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 0.80, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-11-10T00:00:00Z', updatedAt: '2026-02-12T00:00:00Z', listing: { id: 'lst_010', skillId: 'skill_010', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['carbon', 'offset', 'esg'], featuredRank: 10 } },
    { id: 'skill_011', agentId: 'agent_010', slug: 'anomaly-detect-v1', name: 'Usage Anomaly Detector', description: 'Detects unusual usage patterns in water and energy data.', category: 'VERIFICATION', pricingModel: 'PER_1K_EVENTS', basePrice: 0.15, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.3.0', createdAt: '2025-09-25T00:00:00Z', updatedAt: '2026-02-24T00:00:00Z', listing: { id: 'lst_011', skillId: 'skill_011', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['anomaly', 'detection', 'monitoring'], featuredRank: 11 } },
    { id: 'skill_012', agentId: 'agent_001', slug: 'settlement-xrpl-v1', name: 'XRPL Settlement', description: 'Executes atomic settlements on XRP Ledger.', category: 'SETTLEMENT', pricingModel: 'PER_CALL', basePrice: 0.02, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z', listing: { id: 'lst_012', skillId: 'skill_012', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['settlement', 'xrpl', 'atomic'], featuredRank: 12 } },
    { id: 'skill_013', agentId: 'agent_003', slug: 'water-score-v2', name: 'Advanced Water Score', description: 'Deep analysis of water efficiency with peer benchmarking.', category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 1.25, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 1 }, version: '2.1.0', createdAt: '2025-08-01T00:00:00Z', updatedAt: '2026-02-26T00:00:00Z', listing: { id: 'lst_013', skillId: 'skill_013', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['water', 'scoring', 'benchmark'], featuredRank: 13 } },
    { id: 'skill_014', agentId: 'agent_005', slug: 'weather-oracle-v1', name: 'Weather Impact Oracle', description: 'Weather data feeds correlated to energy/water usage patterns.', category: 'ORACLE', pricingModel: 'PER_1K_EVENTS', basePrice: 0.08, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z', listing: { id: 'lst_014', skillId: 'skill_014', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['weather', 'oracle', 'correlation'], featuredRank: 14 } },
    { id: 'skill_015', agentId: 'agent_004', slug: 'cert-generate-v1', name: 'Certificate Generator', description: 'Issues environmental impact certificates with proof chains.', category: 'COMPLIANCE', pricingModel: 'PER_DOC', basePrice: 3.00, successFeeBps: 0, meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requiresKycTier: 1 }, version: '1.0.0', createdAt: '2025-07-15T00:00:00Z', updatedAt: '2026-02-25T00:00:00Z', listing: { id: 'lst_015', skillId: 'skill_015', visibility: 'PUBLIC', allowedDomains: ['utility', 'enterprise'], allowedCallers: [], tags: ['certificate', 'impact', 'proof'], featuredRank: 15 } },
    { id: 'skill_016', agentId: 'agent_010', slug: 'leak-detect-v1', name: 'Leak Detection', description: 'Identifies water leaks from meter data patterns.', category: 'VERIFICATION', pricingModel: 'PER_CALL', basePrice: 0.60, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.1.0', createdAt: '2025-10-15T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z', listing: { id: 'lst_016', skillId: 'skill_016', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['leak', 'detection', 'water'], featuredRank: 16 } },
    { id: 'skill_017', agentId: 'agent_006', slug: 'report-builder-v1', name: 'ESG Report Builder', description: 'Generates comprehensive ESG reports from platform data.', category: 'UTILITY', pricingModel: 'PER_DOC', basePrice: 4.00, successFeeBps: 0, meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requiresKycTier: 2 }, version: '1.0.0', createdAt: '2025-09-01T00:00:00Z', updatedAt: '2026-02-18T00:00:00Z', listing: { id: 'lst_017', skillId: 'skill_017', visibility: 'PARTNER_ONLY', allowedDomains: ['enterprise'], allowedCallers: [], tags: ['esg', 'report', 'enterprise'], featuredRank: 17 } },
    { id: 'skill_018', agentId: 'agent_008', slug: 'batch-verify-v1', name: 'Batch Verification', description: 'Verifies batches of utility data in bulk.', category: 'UTILITY', pricingModel: 'PER_1K_EVENTS', basePrice: 0.20, successFeeBps: 0, meterUnit: 'EVENTS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.2.0', createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-02-22T00:00:00Z', listing: { id: 'lst_018', skillId: 'skill_018', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['batch', 'verify', 'bulk'], featuredRank: 18 } },
    { id: 'skill_019', agentId: 'agent_003', slug: 'energy-benchmark-v1', name: 'Energy Benchmarker', description: 'Benchmarks energy usage against regional and demographic peers.', category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 0.90, successFeeBps: 0, meterUnit: 'CPU_MS', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-06-10T00:00:00Z', updatedAt: '2026-02-26T00:00:00Z', listing: { id: 'lst_019', skillId: 'skill_019', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility'], allowedCallers: [], tags: ['energy', 'benchmark', 'peer'], featuredRank: 19 } },
    { id: 'skill_020', agentId: 'agent_009', slug: 'data-export-v1', name: 'Data Export Service', description: 'Exports user environmental data in standard formats.', category: 'UTILITY', pricingModel: 'PER_CALL', basePrice: 0.30, successFeeBps: 0, meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requiresKycTier: 0 }, version: '1.0.0', createdAt: '2025-12-01T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z', listing: { id: 'lst_020', skillId: 'skill_020', visibility: 'PUBLIC', allowedDomains: ['retail', 'utility', 'enterprise'], allowedCallers: [], tags: ['export', 'data', 'download'], featuredRank: 20 } },
  ];
}

// ─── Environmental Assets ─────────────────────────────────

export function generateEnvAssets(): EnvAsset[] {
  return [
    { id: 'asset_wtr', symbol: 'WTR', kind: 'MPT', transferPolicy: 'PERMISSIONED', chain: 'XRPL', decimals: 6, metadata: { name: 'Water Impact Token', description: 'Represents verified water savings' } },
    { id: 'asset_eng', symbol: 'ENG', kind: 'MPT', transferPolicy: 'PERMISSIONED', chain: 'XRPL', decimals: 6, metadata: { name: 'Energy Impact Token', description: 'Represents verified energy reduction' } },
    { id: 'asset_nxs', symbol: 'NXS', kind: 'NATIVE', transferPolicy: 'OPEN', chain: 'BOTH', decimals: 6, metadata: { name: 'Nexus Governance Token', description: 'Protocol governance and utility' } },
    { id: 'asset_rlusd', symbol: 'RLUSD', kind: 'IOU', transferPolicy: 'OPEN', chain: 'XRPL', decimals: 2, metadata: { name: 'Ripple USD', description: 'USD-backed stablecoin on XRPL' } },
    { id: 'asset_xrp', symbol: 'XRP', kind: 'NATIVE', transferPolicy: 'OPEN', chain: 'XRPL', decimals: 6, metadata: { name: 'XRP', description: 'Native XRPL asset' } },
  ];
}

// ─── Balances ─────────────────────────────────────────────

export function generateBalances(): BalanceLedger[] {
  return [
    { id: 'bal_001', ownerType: 'AGENT', ownerId: 'agent_001', asset: 'RLUSD', available: 250000, locked: 5000, updatedAt: '2026-03-01T12:00:00Z' },
    { id: 'bal_002', ownerType: 'AGENT', ownerId: 'agent_001', asset: 'NXS', available: 1200000, locked: 0, updatedAt: '2026-03-01T12:00:00Z' },
    { id: 'bal_003', ownerType: 'AGENT', ownerId: 'agent_002', asset: 'RLUSD', available: 45000, locked: 1200, updatedAt: '2026-02-28T10:00:00Z' },
    { id: 'bal_004', ownerType: 'AGENT', ownerId: 'agent_003', asset: 'RLUSD', available: 62000, locked: 0, updatedAt: '2026-02-27T14:00:00Z' },
    { id: 'bal_005', ownerType: 'AGENT', ownerId: 'agent_004', asset: 'RLUSD', available: 18500, locked: 500, updatedAt: '2026-02-25T09:00:00Z' },
    { id: 'bal_006', ownerType: 'AGENT', ownerId: 'agent_005', asset: 'RLUSD', available: 88000, locked: 0, updatedAt: '2026-03-01T08:00:00Z' },
    { id: 'bal_007', ownerType: 'USER', ownerId: 'user_demo', asset: 'RLUSD', available: 5200, locked: 150, updatedAt: '2026-03-01T10:00:00Z' },
    { id: 'bal_008', ownerType: 'USER', ownerId: 'user_demo', asset: 'WTR', available: 12400, locked: 0, updatedAt: '2026-03-01T10:00:00Z' },
    { id: 'bal_009', ownerType: 'USER', ownerId: 'user_demo', asset: 'ENG', available: 8600, locked: 0, updatedAt: '2026-03-01T10:00:00Z' },
    { id: 'bal_010', ownerType: 'USER', ownerId: 'user_demo', asset: 'NXS', available: 34500, locked: 0, updatedAt: '2026-03-01T10:00:00Z' },
  ];
}

// ─── Fee Config ───────────────────────────────────────────

export function generateFeeConfig(): FeeConfig {
  return {
    id: 'feeconfig_001',
    platformTakeRateBps: 1500,
    settlementFeeBps: 35,
    receiptFlatFee: 0.05,
    minFee: 0.01,
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ─── Receipts ─────────────────────────────────────────────

export function generateEconReceipts(): EconReceipt[] {
  return [
    {
      id: 'rcpt_001', type: 'SKILL_CALL', createdAt: '2026-03-01T09:15:00Z',
      subject: { skillSlug: 'bill-parse-v1', callerAgentId: 'agent_001', sellerAgentId: 'agent_002' },
      proofs: { billHash: '0x7a3f...e8b2', oracleSignature: 'sig_av_001' },
      policy: { domain: 'retail', kycTier: 1, allowed: true },
      financials: { totalCost: 0.50, platformFee: 0.075, sellerPayout: 0.375, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'AquaVerify', amount: 0.375, bps: 7500 }, { label: 'Nexus Platform', amount: 0.075, bps: 1500 }, { label: 'Receipt Fee', amount: 0.05, bps: 1000 }] },
      signatures: { nexus: 'sig_nx_001', seller: 'sig_av_001' },
      trustContext: { callerTier: 'A', counterpartyTier: 'A', trustScoreAtTime: 88, reasonSummary: 'Both parties verified, high trust' },
    },
    {
      id: 'rcpt_002', type: 'SKILL_CALL', createdAt: '2026-03-01T10:30:00Z',
      subject: { skillSlug: 'home-score-v1', callerAgentId: 'agent_001', sellerAgentId: 'agent_003' },
      proofs: { scoreHash: '0x9e2b...c1d5', certificateRef: 'cert_002' },
      policy: { domain: 'retail', kycTier: 1, allowed: true },
      financials: { totalCost: 1.00, platformFee: 0.15, sellerPayout: 0.80, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'EnergyScore Labs', amount: 0.80, bps: 8000 }, { label: 'Nexus Platform', amount: 0.15, bps: 1500 }, { label: 'Receipt Fee', amount: 0.05, bps: 500 }] },
      signatures: { nexus: 'sig_nx_002', seller: 'sig_es_002' },
      trustContext: { callerTier: 'A', counterpartyTier: 'A', trustScoreAtTime: 91, reasonSummary: 'Verified partner, premium tier' },
    },
    {
      id: 'rcpt_003', type: 'TRADE', createdAt: '2026-02-28T14:22:00Z',
      subject: { fromAsset: 'WTR', toAsset: 'NXS', amountIn: 5000, amountOut: 420, route: 'XRPL AMM' },
      proofs: { txHash: '0xabc123...def', blockNumber: 84291050 },
      policy: { domain: 'retail', transferPolicy: 'PERMISSIONED', allowed: true },
      financials: { totalCost: 5000, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 1.75, currency: 'WTR', splits: [{ label: 'Settlement Fee', amount: 1.75, bps: 35 }, { label: 'Receipt Fee', amount: 0.05, bps: 1 }] },
      signatures: { nexus: 'sig_nx_003' },
    },
    {
      id: 'rcpt_004', type: 'REDEEM', createdAt: '2026-02-27T11:00:00Z',
      subject: { asset: 'WTR', amount: 2000, rewardNXS: 168, rewardRate: 0.084 },
      proofs: { txHash: '0xdef456...ghi' },
      policy: { domain: 'retail', allowed: true },
      financials: { totalCost: 2000, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 0, currency: 'WTR', splits: [{ label: 'Receipt Fee', amount: 0.05, bps: 0 }] },
      signatures: { nexus: 'sig_nx_004' },
    },
    {
      id: 'rcpt_005', type: 'RETIRE', createdAt: '2026-02-26T16:45:00Z',
      subject: { asset: 'ENG', amount: 1500, beneficiary: 'City of Phoenix', reason: 'Q1 2026 Carbon Offset' },
      proofs: { burnTxHash: '0xghi789...jkl', certificateRef: 'cert_ret_005' },
      policy: { domain: 'enterprise', allowed: true },
      financials: { totalCost: 1500, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 0, currency: 'ENG', splits: [{ label: 'Receipt Fee', amount: 0.05, bps: 0 }] },
      signatures: { nexus: 'sig_nx_005' },
    },
    {
      id: 'rcpt_006', type: 'NEGOTIATION', createdAt: '2026-02-25T09:30:00Z',
      subject: { rfqId: 'rfq_003', skillSlug: 'audit-pack-v1', finalPrice: 25, units: 10, counterparty: 'GreenAudit Co' },
      proofs: { escrowRef: 'escrow_001' },
      policy: { domain: 'utility', allowed: true },
      financials: { totalCost: 25, platformFee: 3.75, sellerPayout: 21.20, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'GreenAudit Co', amount: 21.20, bps: 8480 }, { label: 'Nexus Platform', amount: 3.75, bps: 1500 }, { label: 'Receipt Fee', amount: 0.05, bps: 20 }] },
      signatures: { nexus: 'sig_nx_006', seller: 'sig_ga_006' },
      trustContext: { callerTier: 'A', counterpartyTier: 'B', trustScoreAtTime: 82, reasonSummary: 'Verified third-party, good history' },
    },
    {
      id: 'rcpt_007', type: 'SKILL_CALL', createdAt: '2026-02-24T13:15:00Z',
      subject: { skillSlug: 'oracle-price-v1', callerAgentId: 'agent_001', sellerAgentId: 'agent_005' },
      proofs: { dataHash: '0xlmn012...opq' },
      policy: { domain: 'retail', allowed: true },
      financials: { totalCost: 0.10, platformFee: 0.015, sellerPayout: 0.035, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'OracleStream', amount: 0.035, bps: 3500 }, { label: 'Nexus Platform', amount: 0.015, bps: 1500 }, { label: 'Receipt Fee', amount: 0.05, bps: 5000 }] },
      signatures: { nexus: 'sig_nx_007', seller: 'sig_os_007' },
    },
    {
      id: 'rcpt_008', type: 'CERTIFICATE', createdAt: '2026-02-23T10:00:00Z',
      subject: { type: 'Environmental Impact Certificate', issuedTo: 'Demo User', period: 'Jan 2026', waterScore: 74, energyScore: 68 },
      proofs: { certificateHash: '0xrst345...uvw', issuerSignature: 'sig_es_008' },
      policy: { domain: 'retail', allowed: true },
      financials: { totalCost: 0, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'Receipt Fee', amount: 0.05, bps: 0 }] },
      signatures: { nexus: 'sig_nx_008' },
    },
    {
      id: 'rcpt_009', type: 'TRADE', createdAt: '2026-02-22T15:30:00Z',
      subject: { fromAsset: 'ENG', toAsset: 'RLUSD', amountIn: 3000, amountOut: 252, route: 'XRPL DEX' },
      proofs: { txHash: '0xwxy678...zab' },
      policy: { domain: 'retail', allowed: true },
      financials: { totalCost: 3000, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 1.05, currency: 'ENG', splits: [{ label: 'Settlement Fee', amount: 1.05, bps: 35 }, { label: 'Receipt Fee', amount: 0.05, bps: 2 }] },
      signatures: { nexus: 'sig_nx_009' },
    },
    {
      id: 'rcpt_010', type: 'AUDIT_PACK', createdAt: '2026-02-21T08:45:00Z',
      subject: { receiptCount: 15, period: 'Q4 2025', format: 'PDF+JSON', generator: 'GreenAudit Co' },
      proofs: { manifestHash: '0xcde901...fgh', ipfsRef: 'QmAuditPack010' },
      policy: { domain: 'enterprise', allowed: true },
      financials: { totalCost: 2.50, platformFee: 0.375, sellerPayout: 2.075, receiptFee: 0.05, settlementFee: 0, currency: 'RLUSD', splits: [{ label: 'GreenAudit Co', amount: 2.075, bps: 8300 }, { label: 'Nexus Platform', amount: 0.375, bps: 1500 }, { label: 'Receipt Fee', amount: 0.05, bps: 200 }] },
      signatures: { nexus: 'sig_nx_010', seller: 'sig_ga_010' },
    },
  ];
}

// ─── RFQs + Negotiation ───────────────────────────────────

export function generateRFQs(): RFQ[] {
  return [
    { id: 'rfq_001', requesterAgentId: 'agent_001', category: 'SKILL', subject: { skillSlug: 'bill-parse-v1', documents: 50, region: 'Southwest US' }, status: 'OPEN', expiresAt: '2026-03-05T00:00:00Z', createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
    { id: 'rfq_002', requesterAgentId: 'agent_008', targetAgentId: 'agent_005', category: 'TRADE', subject: { fromAsset: 'WTR', toAsset: 'NXS', amount: 50000 }, status: 'NEGOTIATING', expiresAt: '2026-03-04T00:00:00Z', createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-03-01T14:00:00Z' },
    { id: 'rfq_003', requesterAgentId: 'agent_001', targetAgentId: 'agent_004', category: 'SKILL', subject: { skillSlug: 'audit-pack-v1', receiptCount: 10, period: 'Q1 2026' }, status: 'ACCEPTED', expiresAt: '2026-03-03T00:00:00Z', createdAt: '2026-02-25T09:00:00Z', updatedAt: '2026-02-25T12:00:00Z' },
    { id: 'rfq_004', requesterAgentId: 'agent_006', category: 'RETIREMENT', subject: { asset: 'ENG', amount: 10000, beneficiary: 'Arizona Energy Authority' }, status: 'OPEN', expiresAt: '2026-03-06T00:00:00Z', createdAt: '2026-03-01T11:00:00Z', updatedAt: '2026-03-01T11:00:00Z' },
    { id: 'rfq_005', requesterAgentId: 'agent_010', targetAgentId: 'agent_002', category: 'REDEMPTION', subject: { asset: 'WTR', amount: 5000 }, status: 'NEGOTIATING', expiresAt: '2026-03-04T12:00:00Z', createdAt: '2026-02-28T16:00:00Z', updatedAt: '2026-03-01T09:00:00Z' },
  ];
}

export function generateOffers(): Offer[] {
  return [
    { id: 'offer_001', rfqId: 'rfq_001', senderAgentId: 'agent_002', terms: { price: 22, currency: 'RLUSD', units: 50, settlementType: 'ESCROW' }, status: 'PENDING', createdAt: '2026-03-01T09:00:00Z' },
    { id: 'offer_002', rfqId: 'rfq_001', senderAgentId: 'agent_010', terms: { price: 18, currency: 'RLUSD', units: 50, settlementType: 'PREPAID' }, status: 'PENDING', createdAt: '2026-03-01T09:30:00Z' },
    { id: 'offer_003', rfqId: 'rfq_002', senderAgentId: 'agent_005', terms: { price: 4200, currency: 'NXS', units: 50000, settlementType: 'ESCROW', route: 'XRPL AMM' }, status: 'COUNTERED', createdAt: '2026-02-28T12:00:00Z' },
    { id: 'offer_004', rfqId: 'rfq_002', senderAgentId: 'agent_008', terms: { price: 3800, currency: 'NXS', units: 50000, settlementType: 'ESCROW', route: 'XRPL AMM' }, status: 'PENDING', createdAt: '2026-03-01T14:00:00Z' },
    { id: 'offer_005', rfqId: 'rfq_003', senderAgentId: 'agent_004', terms: { price: 30, currency: 'RLUSD', units: 10, settlementType: 'ESCROW' }, status: 'COUNTERED', createdAt: '2026-02-25T09:30:00Z' },
    { id: 'offer_006', rfqId: 'rfq_003', senderAgentId: 'agent_001', terms: { price: 25, currency: 'RLUSD', units: 10, settlementType: 'ESCROW' }, status: 'ACCEPTED', createdAt: '2026-02-25T10:00:00Z' },
    { id: 'offer_007', rfqId: 'rfq_005', senderAgentId: 'agent_002', terms: { price: 420, currency: 'NXS', units: 5000, settlementType: 'ESCROW' }, status: 'PENDING', createdAt: '2026-03-01T09:00:00Z' },
    { id: 'offer_008', rfqId: 'rfq_004', senderAgentId: 'agent_004', terms: { price: 200, currency: 'RLUSD', units: 10000, settlementType: 'ESCROW' }, status: 'PENDING', createdAt: '2026-03-01T12:00:00Z' },
  ];
}

export function generateNegotiationMessages(): NegotiationMessage[] {
  return [
    { id: 'nmsg_001', rfqId: 'rfq_003', senderAgentId: 'agent_001', type: 'MESSAGE', payload: { text: 'We need audit packs for 10 retirement receipts from Q1 2026.' }, createdAt: '2026-02-25T09:00:00Z' },
    { id: 'nmsg_002', rfqId: 'rfq_003', senderAgentId: 'agent_004', type: 'OFFER', payload: { text: 'I can deliver within 24 hours. 30 RLUSD.', offerId: 'offer_005' }, createdAt: '2026-02-25T09:30:00Z' },
    { id: 'nmsg_003', rfqId: 'rfq_003', senderAgentId: 'agent_001', type: 'OFFER', payload: { text: 'Counter: 25 RLUSD. We have a standing relationship.', offerId: 'offer_006' }, createdAt: '2026-02-25T10:00:00Z' },
    { id: 'nmsg_004', rfqId: 'rfq_003', senderAgentId: 'agent_004', type: 'MESSAGE', payload: { text: 'Accepted. Escrow locked. Generating audit packs now.' }, createdAt: '2026-02-25T10:30:00Z' },
    { id: 'nmsg_005', rfqId: 'rfq_002', senderAgentId: 'agent_008', type: 'MESSAGE', payload: { text: 'Looking to swap 50,000 WTR to NXS. Need best execution.' }, createdAt: '2026-02-28T10:00:00Z' },
    { id: 'nmsg_006', rfqId: 'rfq_002', senderAgentId: 'agent_005', type: 'OFFER', payload: { text: 'Route via XRPL AMM. Estimated 4,200 NXS output.', offerId: 'offer_003' }, createdAt: '2026-02-28T12:00:00Z' },
    { id: 'nmsg_007', rfqId: 'rfq_002', senderAgentId: 'agent_008', type: 'OFFER', payload: { text: 'Counter: looking for at least 3,800 NXS minimum.', offerId: 'offer_004' }, createdAt: '2026-03-01T14:00:00Z' },
  ];
}

export function generateEscrows(): Escrow[] {
  return [
    { id: 'escrow_001', rfqId: 'rfq_003', payerAgentId: 'agent_001', payeeAgentId: 'agent_004', asset: 'RLUSD', amount: 25, status: 'RELEASED', releaseCondition: 'EXECUTION_SUCCESS', createdAt: '2026-02-25T10:30:00Z', releasedAt: '2026-02-25T12:00:00Z' },
    { id: 'escrow_002', rfqId: 'rfq_002', payerAgentId: 'agent_008', payeeAgentId: 'agent_005', asset: 'RLUSD', amount: 4200, status: 'LOCKED', releaseCondition: 'EXECUTION_SUCCESS', createdAt: '2026-03-01T14:30:00Z' },
    { id: 'escrow_003', rfqId: 'rfq_005', payerAgentId: 'agent_010', payeeAgentId: 'agent_002', asset: 'RLUSD', amount: 420, status: 'LOCKED', releaseCondition: 'EXECUTION_SUCCESS', createdAt: '2026-03-01T09:30:00Z' },
  ];
}

// ─── Trust / Reputation ───────────────────────────────────

export function generateAgentReputations(): AgentReputation[] {
  const make = (agentId: string, trust: number, rel: number, exec: number, succ: number, disp: number, fraud: number, liq: number, vol30d: number, execs30d: number): AgentReputation => ({
    id: `rep_${agentId}`, agentId, trustScore: trust,
    riskTier: trust >= 85 ? 'A' : trust >= 70 ? 'B' : trust >= 50 ? 'C' : 'D',
    reliabilityScore: rel, executionSpeedScore: exec, successScore: succ,
    disputeScore: disp, fraudRiskScore: fraud, liquidityScore: liq,
    volume30d: vol30d, volumeAllTime: vol30d * 12, executions30d: execs30d, executionsAllTime: execs30d * 12,
    successRate30d: succ / 100, successRateAllTime: (succ - 2) / 100,
    avgLatencyMs30d: Math.round(1000 - exec * 8), avgLatencyMsAllTime: Math.round(1200 - exec * 8),
    disputeRateAllTime: (100 - disp) / 1000, fraudFlags30d: fraud < 70 ? 3 : fraud < 85 ? 1 : 0,
    fraudFlagsAllTime: fraud < 70 ? 8 : fraud < 85 ? 2 : 0,
    lastBreakdown: {
      subScores: { reliability: rel, success: succ, speed: exec, disputes: disp, fraudRisk: fraud, liquidity: liq },
      weights: { reliability: 0.25, success: 0.25, speed: 0.10, disputes: 0.10, fraudRisk: 0.20, liquidity: 0.10 },
      recentEvents: [], deltaSummary: trust > 80 ? 'Stable — consistent performance' : trust > 60 ? 'Improving — recent successes' : 'Declining — review needed',
    },
    lastComputedAt: '2026-03-01T12:00:00Z', updatedAt: '2026-03-01T12:00:00Z',
  });
  return [
    make('agent_001', 95, 98, 92, 97, 95, 99, 90, 250000, 1200),
    make('agent_002', 88, 90, 85, 92, 88, 95, 75, 45000, 800),
    make('agent_003', 91, 93, 88, 94, 90, 97, 80, 62000, 650),
    make('agent_004', 82, 85, 78, 88, 82, 90, 70, 18500, 320),
    make('agent_005', 93, 95, 90, 96, 92, 98, 85, 88000, 2400),
    make('agent_006', 79, 80, 75, 82, 78, 85, 72, 12000, 280),
    make('agent_007', 65, 68, 62, 70, 65, 72, 55, 8500, 150),
    make('agent_008', 86, 88, 82, 90, 85, 92, 78, 35000, 520),
    make('agent_009', 58, 60, 55, 62, 58, 65, 48, 4200, 95),
    make('agent_010', 74, 76, 72, 78, 74, 80, 65, 15000, 400),
    make('agent_011', 32, 35, 28, 38, 30, 25, 30, 1200, 20),
  ];
}

export function generateAgentEvents(): AgentEvent[] {
  return [
    { id: 'evt_001', agentId: 'agent_001', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_001' }, metrics: { latencyMs: 120, cost: 0.50 }, createdAt: '2026-03-01T09:15:00Z' },
    { id: 'evt_002', agentId: 'agent_002', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_002' }, metrics: { latencyMs: 340, cost: 0.50 }, createdAt: '2026-03-01T09:16:00Z' },
    { id: 'evt_003', agentId: 'agent_003', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_003' }, metrics: { latencyMs: 450, cost: 1.00 }, createdAt: '2026-03-01T10:30:00Z' },
    { id: 'evt_004', agentId: 'agent_004', type: 'OFFER_ACCEPTED', severity: 'LOW', subject: { rfqId: 'rfq_003', offerId: 'offer_006' }, metrics: { price: 25 }, createdAt: '2026-02-25T10:30:00Z' },
    { id: 'evt_005', agentId: 'agent_004', type: 'ESCROW_RELEASED', severity: 'LOW', subject: { escrowId: 'escrow_001' }, metrics: { amount: 25 }, createdAt: '2026-02-25T12:00:00Z' },
    { id: 'evt_006', agentId: 'agent_005', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_001' }, metrics: { volume: 5000 }, createdAt: '2026-02-28T14:22:00Z' },
    { id: 'evt_007', agentId: 'agent_007', type: 'EXECUTION_FAILED', severity: 'MEDIUM', subject: { executionId: 'exec_fail_001' }, metrics: { error: 'Timeout', latencyMs: 30000 }, createdAt: '2026-02-27T08:00:00Z' },
    { id: 'evt_008', agentId: 'agent_011', type: 'FRAUD_FLAG', severity: 'HIGH', subject: { reason: 'Suspicious transaction patterns' }, metrics: { flagCount: 3 }, createdAt: '2026-02-10T08:00:00Z' },
    { id: 'evt_009', agentId: 'agent_009', type: 'EXECUTION_FAILED', severity: 'LOW', subject: { executionId: 'exec_fail_002' }, metrics: { error: 'Bad input' }, createdAt: '2026-02-20T11:00:00Z' },
    { id: 'evt_010', agentId: 'agent_001', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_003' }, metrics: { volume: 2000 }, createdAt: '2026-02-22T15:30:00Z' },
    { id: 'evt_011', agentId: 'agent_006', type: 'OFFER_REJECTED', severity: 'LOW', subject: { rfqId: 'rfq_old_001' }, metrics: {}, createdAt: '2026-02-18T14:00:00Z' },
    { id: 'evt_012', agentId: 'agent_008', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_006' }, metrics: { latencyMs: 200 }, createdAt: '2026-02-22T13:00:00Z' },
    { id: 'evt_013', agentId: 'agent_010', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_007' }, metrics: { latencyMs: 380 }, createdAt: '2026-02-24T15:00:00Z' },
    { id: 'evt_014', agentId: 'agent_011', type: 'DISPUTE_OPENED', severity: 'HIGH', subject: { disputeId: 'disp_001' }, metrics: {}, createdAt: '2026-02-12T10:00:00Z' },
    { id: 'evt_015', agentId: 'agent_002', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_008' }, metrics: { latencyMs: 250 }, createdAt: '2026-02-26T09:00:00Z' },
    { id: 'evt_016', agentId: 'agent_003', type: 'OFFER_ACCEPTED', severity: 'LOW', subject: { rfqId: 'rfq_old_002' }, metrics: { price: 15 }, createdAt: '2026-02-20T16:00:00Z' },
    { id: 'evt_017', agentId: 'agent_005', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_009' }, metrics: { latencyMs: 90 }, createdAt: '2026-02-28T08:00:00Z' },
    { id: 'evt_018', agentId: 'agent_007', type: 'ESCROW_REFUNDED', severity: 'MEDIUM', subject: { escrowId: 'escrow_old_001' }, metrics: { amount: 150 }, createdAt: '2026-02-15T12:00:00Z' },
    { id: 'evt_019', agentId: 'agent_001', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_010' }, metrics: { latencyMs: 110 }, createdAt: '2026-03-01T11:00:00Z' },
    { id: 'evt_020', agentId: 'agent_004', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_011' }, metrics: { latencyMs: 520 }, createdAt: '2026-02-24T10:00:00Z' },
    { id: 'evt_021', agentId: 'agent_006', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_012' }, metrics: { latencyMs: 600 }, createdAt: '2026-02-19T14:00:00Z' },
    { id: 'evt_022', agentId: 'agent_009', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { executionId: 'exec_013' }, metrics: { latencyMs: 800 }, createdAt: '2026-02-16T11:00:00Z' },
    { id: 'evt_023', agentId: 'agent_008', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_004' }, metrics: { volume: 8000 }, createdAt: '2026-02-26T10:00:00Z' },
    { id: 'evt_024', agentId: 'agent_011', type: 'DISPUTE_RESOLVED', severity: 'HIGH', subject: { disputeId: 'disp_001', resolution: 'Penalty applied' }, metrics: { penaltyBps: 500 }, createdAt: '2026-02-20T09:00:00Z' },
    { id: 'evt_025', agentId: 'agent_010', type: 'OFFER_ACCEPTED', severity: 'LOW', subject: { rfqId: 'rfq_005', offerId: 'offer_007' }, metrics: { price: 420 }, createdAt: '2026-03-01T09:30:00Z' },
  ];
}

export function generateDisputes(): Dispute[] {
  return [
    { id: 'disp_001', executionId: 'exec_fail_sp_001', openedByAgentId: 'agent_006', againstAgentId: 'agent_011', reason: 'Failed to deliver audit results after escrow was locked. Agent unresponsive for 48 hours.', evidence: { receiptIds: ['rcpt_old_001'], logs: ['Escrow locked at 2026-02-10, no delivery by 2026-02-12'] }, status: 'RESOLVED', resolution: { refundAmount: 150, penaltyBps: 500, notes: 'Full refund issued. Agent suspended pending review.' }, createdAt: '2026-02-12T10:00:00Z', resolvedAt: '2026-02-20T09:00:00Z' },
    { id: 'disp_002', rfqId: 'rfq_old_003', openedByAgentId: 'agent_009', againstAgentId: 'agent_007', reason: 'Liquidity route returned significantly worse execution than quoted. 15% slippage vs 2% quoted.', evidence: { receiptIds: ['rcpt_old_002'], logs: ['Quoted 2% slippage, actual 15.2%'] }, status: 'UNDER_REVIEW', createdAt: '2026-02-25T14:00:00Z' },
    { id: 'disp_003', executionId: 'exec_fail_009', openedByAgentId: 'agent_010', againstAgentId: 'agent_009', reason: 'Carbon offset calculation returned incorrect EPA methodology results.', evidence: { receiptIds: [], logs: ['EPA v2024.3 methodology not applied correctly'] }, status: 'OPEN', createdAt: '2026-03-01T08:00:00Z' },
  ];
}

// ─── Autonomous Bots ──────────────────────────────────────

export function generateBots(): AutonomousBot[] {
  return [
    { id: 'bot_001', botType: 'LIQUIDITY_ROUTER', status: 'ACTIVE', name: 'Nexus Liquidity Router', ownerType: 'NEXUS', config: { scanInterval: 30, minLiquidityThreshold: 10000, maxSlippageBps: 100 }, lastRunAt: '2026-03-01T12:00:00Z', createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-03-01T12:00:00Z' },
    { id: 'bot_002', botType: 'NEGOTIATION_ASSIST', status: 'ACTIVE', name: 'Nexus Deal Advisor', ownerType: 'NEXUS', config: { strategy: 'balanced', maxCounterOffers: 3, priceAnchorBps: 500 }, lastRunAt: '2026-03-01T11:45:00Z', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-03-01T11:45:00Z' },
    { id: 'bot_003', botType: 'RISK_SENTINEL', status: 'ACTIVE', name: 'Nexus Risk Monitor', ownerType: 'NEXUS', config: { fraudThreshold: 2, disputeRateThreshold: 0.05, volumeAnomalyStdDev: 3 }, lastRunAt: '2026-03-01T12:05:00Z', createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-03-01T12:05:00Z' },
  ];
}

export function generateBotSignals(): BotSignal[] {
  return [
    { id: 'sig_001', botId: 'bot_001', type: 'TRADE_ROUTE_RECOMMENDED', severity: 'INFO', payload: { tradeId: 'rfq_002', recommendedRoute: 'XRPL AMM', estimatedOutput: 4150, slippageBps: 45 }, createdAt: '2026-03-01T12:00:00Z' },
    { id: 'sig_002', botId: 'bot_001', type: 'LIQUIDITY_GAP', severity: 'WARN', payload: { pair: 'ENG/RLUSD', availableLiquidity: 5200, requiredLiquidity: 15000, venue: 'XRPL DEX' }, createdAt: '2026-03-01T11:30:00Z' },
    { id: 'sig_003', botId: 'bot_002', type: 'OFFER_RECOMMENDED', severity: 'INFO', payload: { rfqId: 'rfq_001', suggestedPrice: 20, currency: 'RLUSD', strategy: 'balanced', confidence: 0.85 }, createdAt: '2026-03-01T11:45:00Z' },
    { id: 'sig_004', botId: 'bot_003', type: 'RISK_ALERT', severity: 'CRITICAL', payload: { agentId: 'agent_011', reason: 'Multiple fraud flags + unresolved disputes', trustScore: 32, action: 'Suspension recommended' }, createdAt: '2026-03-01T12:05:00Z' },
    { id: 'sig_005', botId: 'bot_003', type: 'PRICE_ANOMALY', severity: 'WARN', payload: { pair: 'WTR/NXS', expectedPrice: 0.084, observedPrice: 0.092, deviationPct: 9.5, venue: 'XRPL AMM' }, createdAt: '2026-03-01T11:00:00Z' },
    { id: 'sig_006', botId: 'bot_002', type: 'OFFER_RECOMMENDED', severity: 'INFO', payload: { rfqId: 'rfq_004', suggestedPrice: 180, currency: 'RLUSD', strategy: 'firm', confidence: 0.72 }, createdAt: '2026-03-01T11:50:00Z' },
  ];
}

export function generateBotRuns(): BotRun[] {
  return [
    { id: 'run_001', botId: 'bot_001', status: 'SUCCEEDED', startedAt: '2026-03-01T12:00:00Z', finishedAt: '2026-03-01T12:00:02Z', metrics: { tradesScanned: 5, routesComputed: 3, signalsEmitted: 2 } },
    { id: 'run_002', botId: 'bot_002', status: 'SUCCEEDED', startedAt: '2026-03-01T11:45:00Z', finishedAt: '2026-03-01T11:45:01Z', metrics: { rfqsScanned: 5, recommendationsEmitted: 2 } },
    { id: 'run_003', botId: 'bot_003', status: 'SUCCEEDED', startedAt: '2026-03-01T12:05:00Z', finishedAt: '2026-03-01T12:05:03Z', metrics: { agentsScanned: 11, alertsEmitted: 2 } },
    { id: 'run_004', botId: 'bot_001', status: 'SUCCEEDED', startedAt: '2026-03-01T11:30:00Z', finishedAt: '2026-03-01T11:30:02Z', metrics: { tradesScanned: 5, routesComputed: 2, signalsEmitted: 1 } },
    { id: 'run_005', botId: 'bot_003', status: 'SUCCEEDED', startedAt: '2026-03-01T11:00:00Z', finishedAt: '2026-03-01T11:00:02Z', metrics: { agentsScanned: 11, alertsEmitted: 1 } },
  ];
}
