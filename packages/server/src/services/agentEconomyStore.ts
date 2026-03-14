/**
 * Agent Economy In-Memory Data Store
 * Singleton store with rich seed data for all Agent Economy entities.
 */
import type {
  EconAgent,
  EconSkill,
  SkillListing,
  EconQuote,
  EconPermit,
  EconExecution,
  EconReceipt,
  WalletAccount,
  BalanceLedger,
  FeeConfig,
  EnvAsset,
  TradeIntent,
  RetirementIntent,
  RFQ,
  Offer,
  NegotiationMessage,
  Escrow,
  AgentReputation,
  AgentEvent,
  Dispute,
  AgentPolicyProfile,
  AutonomousBot,
  BotRun,
  BotSignal,
} from '@nexus/shared';

// ─── Helpers ──────────────────────────────────────────────

function ts(daysAgo: number): string {
  const d = new Date('2026-03-04T12:00:00Z');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

let _counter = 1000;
function uid(): string {
  return String(++_counter);
}

// ─── Agents ────────────────────────────────────────────────

const agents: EconAgent[] = [
  {
    id: 'agent_001',
    name: 'Nexus Protocol Agent',
    type: 'NEXUS',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Core Nexus protocol agent providing first-party verification, scoring, and settlement services.',
    endpoints: { api: 'https://api.nexus-os.io/v1', ws: 'wss://ws.nexus-os.io/v1' },
    pubkeys: { ed25519: 'ed25519:NXS_MASTER_PUB_001' },
    reputationScore: 95,
    createdAt: ts(120),
    updatedAt: ts(1),
  },
  {
    id: 'agent_002',
    name: 'AquaVerify',
    type: 'PARTNER',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Water utility verification specialist. Parses and validates water bills across 200+ US utilities.',
    endpoints: { api: 'https://api.aquaverify.io/v2' },
    pubkeys: { ed25519: 'ed25519:AQUA_PUB_002' },
    reputationScore: 88,
    createdAt: ts(90),
    updatedAt: ts(3),
  },
  {
    id: 'agent_003',
    name: 'GridSense Analytics',
    type: 'PARTNER',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Energy consumption analytics and scoring engine for residential and commercial properties.',
    endpoints: { api: 'https://gridsense.io/api/v1' },
    pubkeys: { ed25519: 'ed25519:GRID_PUB_003' },
    reputationScore: 91,
    createdAt: ts(85),
    updatedAt: ts(2),
  },
  {
    id: 'agent_004',
    name: 'EcoLedger Compliance',
    type: 'PARTNER',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Compliance and audit pack generation for environmental credit programs and regulatory reporting.',
    endpoints: { api: 'https://ecoledger.co/api' },
    pubkeys: { ed25519: 'ed25519:ECO_PUB_004' },
    reputationScore: 82,
    createdAt: ts(75),
    updatedAt: ts(5),
  },
  {
    id: 'agent_005',
    name: 'PriceOracle.env',
    type: 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Decentralized price oracle for water credits, energy certificates, and carbon offsets.',
    endpoints: { api: 'https://oracle.priceoracle.env/v1' },
    pubkeys: { ed25519: 'ed25519:ORCL_PUB_005' },
    reputationScore: 79,
    createdAt: ts(60),
    updatedAt: ts(4),
  },
  {
    id: 'agent_006',
    name: 'FlowRoute Capital',
    type: 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Best-execution routing agent for environmental asset trades across XRPL and EVM.',
    endpoints: { api: 'https://flowroute.capital/api/v2' },
    pubkeys: { ed25519: 'ed25519:FLOW_PUB_006' },
    reputationScore: 74,
    createdAt: ts(55),
    updatedAt: ts(2),
  },
  {
    id: 'agent_007',
    name: 'ClearDrop Verification',
    type: 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'UNVERIFIED',
    description: 'Bill verification service specializing in stormwater and rainwater harvesting documentation.',
    endpoints: { api: 'https://cleardrop.io/api' },
    pubkeys: { ed25519: 'ed25519:CLDR_PUB_007' },
    reputationScore: 62,
    createdAt: ts(40),
    updatedAt: ts(7),
  },
  {
    id: 'agent_008',
    name: 'SolarMint',
    type: 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'UNVERIFIED',
    description: 'Solar energy certificate minting and verification for rooftop PV installations.',
    endpoints: { api: 'https://solarmint.xyz/api/v1' },
    pubkeys: { ed25519: 'ed25519:SLMN_PUB_008' },
    reputationScore: 55,
    createdAt: ts(35),
    updatedAt: ts(10),
  },
  {
    id: 'agent_009',
    name: 'TrustGraph AI',
    type: 'THIRD_PARTY',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'AI-powered agent reputation analysis and fraud detection service.',
    endpoints: { api: 'https://trustgraph.ai/api' },
    pubkeys: { ed25519: 'ed25519:TGAI_PUB_009' },
    reputationScore: 86,
    createdAt: ts(50),
    updatedAt: ts(1),
  },
  {
    id: 'agent_010',
    name: 'WaterBridge Settlements',
    type: 'PARTNER',
    status: 'ACTIVE',
    verificationLevel: 'VERIFIED',
    description: 'Cross-chain settlement agent for water credit transfers between XRPL and EVM networks.',
    endpoints: { api: 'https://waterbridge.io/settle/v1' },
    pubkeys: { ed25519: 'ed25519:WBDG_PUB_010' },
    reputationScore: 83,
    createdAt: ts(45),
    updatedAt: ts(3),
  },
  {
    id: 'agent_011',
    name: 'DarkPool Enviro',
    type: 'THIRD_PARTY',
    status: 'SUSPENDED',
    verificationLevel: 'UNVERIFIED',
    description: 'Anonymous environmental credit trading pool. Currently suspended pending compliance review.',
    endpoints: { api: 'https://darkpool-enviro.net/api' },
    pubkeys: { ed25519: 'ed25519:DKPL_PUB_011' },
    reputationScore: 32,
    createdAt: ts(30),
    updatedAt: ts(1),
  },
];

// ─── Skills (20) ────────────────────────────────────────────

const skills: EconSkill[] = [
  // VERIFICATION (4)
  {
    id: 'skill_001', agentId: 'agent_001', slug: 'bill-parse-v1', name: 'Bill Parse & Verify',
    description: 'Parses utility bills (water, energy, gas) and extracts structured usage data with fraud detection.',
    category: 'VERIFICATION', pricingModel: 'PER_DOC', basePrice: 0.25, successFeeBps: 0,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 1 }, version: '1.4.0',
    createdAt: ts(100), updatedAt: ts(5),
  },
  {
    id: 'skill_002', agentId: 'agent_002', slug: 'water-bill-verify-v2', name: 'Water Bill Deep Verify',
    description: 'Deep verification of water utility bills including meter read cross-validation and rate schedule checks.',
    category: 'VERIFICATION', pricingModel: 'PER_DOC', basePrice: 0.40, successFeeBps: 200,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 1, waterOnly: true }, version: '2.1.0',
    createdAt: ts(80), updatedAt: ts(3),
  },
  {
    id: 'skill_003', agentId: 'agent_007', slug: 'stormwater-verify-v1', name: 'Stormwater Verification',
    description: 'Verification of stormwater management bills and rainwater harvesting documentation.',
    category: 'VERIFICATION', pricingModel: 'PER_DOC', basePrice: 0.35, successFeeBps: 0,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 0 }, version: '1.0.2',
    createdAt: ts(38), updatedAt: ts(10),
  },
  {
    id: 'skill_004', agentId: 'agent_008', slug: 'solar-cert-verify-v1', name: 'Solar Certificate Verify',
    description: 'Verifies solar energy generation certificates from rooftop PV installations.',
    category: 'VERIFICATION', pricingModel: 'PER_DOC', basePrice: 0.50, successFeeBps: 150,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 1, solarOnly: true }, version: '1.1.0',
    createdAt: ts(32), updatedAt: ts(8),
  },
  // SETTLEMENT (3)
  {
    id: 'skill_005', agentId: 'agent_010', slug: 'xrpl-settle-v1', name: 'XRPL Settlement',
    description: 'Atomic settlement of environmental asset trades on XRPL using payment channels.',
    category: 'SETTLEMENT', pricingModel: 'PER_CALL', basePrice: 0.10, successFeeBps: 50,
    meterUnit: 'EVENTS', enabled: true, policyTags: { chain: 'XRPL' }, version: '1.3.0',
    createdAt: ts(44), updatedAt: ts(2),
  },
  {
    id: 'skill_006', agentId: 'agent_010', slug: 'evm-settle-v1', name: 'EVM Settlement',
    description: 'Smart contract-based settlement for EVM-chain environmental asset transfers.',
    category: 'SETTLEMENT', pricingModel: 'PER_CALL', basePrice: 0.15, successFeeBps: 75,
    meterUnit: 'EVENTS', enabled: true, policyTags: { chain: 'EVM' }, version: '1.2.0',
    createdAt: ts(44), updatedAt: ts(3),
  },
  {
    id: 'skill_007', agentId: 'agent_006', slug: 'best-execution-router-v1', name: 'Best Execution Router',
    description: 'Finds optimal execution route across DEX pools and order books for environmental asset trades.',
    category: 'SETTLEMENT', pricingModel: 'SUCCESS_FEE', basePrice: 0.0, successFeeBps: 300,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '2.0.1',
    createdAt: ts(50), updatedAt: ts(1),
  },
  // SCORING (4)
  {
    id: 'skill_008', agentId: 'agent_001', slug: 'home-score-v1', name: 'Home Environmental Score',
    description: 'Computes WaterScore and EnergyScore for residential properties based on utility data.',
    category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 0.30, successFeeBps: 0,
    meterUnit: 'CPU_MS', enabled: true, policyTags: { requireKyc: 1 }, version: '1.6.0',
    createdAt: ts(95), updatedAt: ts(2),
  },
  {
    id: 'skill_009', agentId: 'agent_003', slug: 'energy-score-v2', name: 'Energy Efficiency Score',
    description: 'Advanced energy efficiency scoring with peer benchmarking and improvement recommendations.',
    category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 0.45, successFeeBps: 0,
    meterUnit: 'CPU_MS', enabled: true, policyTags: { requireKyc: 1 }, version: '2.3.0',
    createdAt: ts(70), updatedAt: ts(4),
  },
  {
    id: 'skill_010', agentId: 'agent_003', slug: 'commercial-score-v1', name: 'Commercial Property Score',
    description: 'Environmental scoring for commercial and industrial properties with ENERGY STAR benchmarking.',
    category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 1.20, successFeeBps: 0,
    meterUnit: 'CPU_MS', enabled: true, policyTags: { requireKyc: 2, commercialOnly: true }, version: '1.0.0',
    createdAt: ts(60), updatedAt: ts(6),
  },
  {
    id: 'skill_011', agentId: 'agent_009', slug: 'trust-score-v1', name: 'Agent Trust Score',
    description: 'Computes trust scores for agents based on on-chain behavior, dispute history, and peer reviews.',
    category: 'SCORING', pricingModel: 'PER_CALL', basePrice: 0.15, successFeeBps: 0,
    meterUnit: 'CPU_MS', enabled: true, policyTags: {}, version: '1.2.0',
    createdAt: ts(48), updatedAt: ts(1),
  },
  // ORACLE (3)
  {
    id: 'skill_012', agentId: 'agent_005', slug: 'oracle-price-v1', name: 'Env Asset Price Oracle',
    description: 'Real-time price feeds for water credits, energy certificates, and carbon offsets across markets.',
    category: 'ORACLE', pricingModel: 'PER_1K_EVENTS', basePrice: 0.50, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.5.0',
    createdAt: ts(58), updatedAt: ts(1),
  },
  {
    id: 'skill_013', agentId: 'agent_005', slug: 'oracle-weather-v1', name: 'Weather Data Oracle',
    description: 'Historical and real-time weather data for environmental credit valuation models.',
    category: 'ORACLE', pricingModel: 'PER_1K_EVENTS', basePrice: 0.30, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.1.0',
    createdAt: ts(55), updatedAt: ts(4),
  },
  {
    id: 'skill_014', agentId: 'agent_005', slug: 'oracle-grid-carbon-v1', name: 'Grid Carbon Intensity Oracle',
    description: 'Real-time grid carbon intensity data by region for energy credit valuation.',
    category: 'ORACLE', pricingModel: 'PER_1K_EVENTS', basePrice: 0.40, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.0.0',
    createdAt: ts(45), updatedAt: ts(5),
  },
  // COMPLIANCE (3)
  {
    id: 'skill_015', agentId: 'agent_004', slug: 'audit-pack-v1', name: 'Audit Pack Generator',
    description: 'Generates compliance audit packs with manifests, proofs, and regulatory documentation.',
    category: 'COMPLIANCE', pricingModel: 'PER_CALL', basePrice: 2.00, successFeeBps: 0,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 2 }, version: '1.3.0',
    createdAt: ts(72), updatedAt: ts(3),
  },
  {
    id: 'skill_016', agentId: 'agent_004', slug: 'kyc-check-v1', name: 'KYC Tier Check',
    description: 'Verifies agent KYC tier against wallet data and compliance requirements.',
    category: 'COMPLIANCE', pricingModel: 'PER_CALL', basePrice: 0.10, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.1.0',
    createdAt: ts(70), updatedAt: ts(5),
  },
  {
    id: 'skill_017', agentId: 'agent_004', slug: 'regulatory-report-v1', name: 'Regulatory Report',
    description: 'Generates regulatory compliance reports for environmental credit programs.',
    category: 'COMPLIANCE', pricingModel: 'PER_CALL', basePrice: 5.00, successFeeBps: 0,
    meterUnit: 'DOC_PAGES', enabled: true, policyTags: { requireKyc: 2 }, version: '1.0.0',
    createdAt: ts(65), updatedAt: ts(8),
  },
  // UTILITY (3)
  {
    id: 'skill_018', agentId: 'agent_001', slug: 'receipt-mint-v1', name: 'Receipt Minter',
    description: 'Mints verifiable receipts as on-chain attestations for skill calls, trades, and retirements.',
    category: 'UTILITY', pricingModel: 'PER_CALL', basePrice: 0.05, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.2.0',
    createdAt: ts(100), updatedAt: ts(1),
  },
  {
    id: 'skill_019', agentId: 'agent_001', slug: 'notification-relay-v1', name: 'Notification Relay',
    description: 'Relays notifications to agents via webhooks, email, or push channels.',
    category: 'UTILITY', pricingModel: 'PER_1K_EVENTS', basePrice: 0.02, successFeeBps: 0,
    meterUnit: 'EVENTS', enabled: true, policyTags: {}, version: '1.0.0',
    createdAt: ts(90), updatedAt: ts(2),
  },
  {
    id: 'skill_020', agentId: 'agent_009', slug: 'fraud-screen-v1', name: 'Fraud Screening',
    description: 'Screens transactions and agent behavior for fraud patterns and anomalies.',
    category: 'UTILITY', pricingModel: 'PER_CALL', basePrice: 0.20, successFeeBps: 0,
    meterUnit: 'CPU_MS', enabled: true, policyTags: {}, version: '1.4.0',
    createdAt: ts(46), updatedAt: ts(2),
  },
];

// ─── Skill Listings ────────────────────────────────────────

const skillListings: SkillListing[] = skills.map((s, i) => ({
  id: `listing_${String(i + 1).padStart(3, '0')}`,
  skillId: s.id,
  visibility: s.agentId === 'agent_001' ? 'PUBLIC' as const : (s.policyTags.requireKyc === 2 ? 'PARTNER_ONLY' as const : 'PUBLIC' as const),
  allowedDomains: ['retail', 'utility', 'enterprise'],
  allowedCallers: [],
  tags: [s.category.toLowerCase(), s.slug],
  featuredRank: s.agentId === 'agent_001' ? i + 1 : 50 + i,
}));

// ─── Fee Config ────────────────────────────────────────────

const feeConfigs: FeeConfig[] = [
  {
    id: 'feeconfig_001',
    platformTakeRateBps: 1500,
    settlementFeeBps: 35,
    receiptFlatFee: 0.05,
    minFee: 0.01,
    updatedAt: ts(10),
  },
];

// ─── Environmental Assets ──────────────────────────────────

const envAssets: EnvAsset[] = [
  {
    id: 'asset_wtr', symbol: 'WTR', kind: 'MPT', transferPolicy: 'PERMISSIONED',
    chain: 'XRPL', decimals: 6,
    metadata: { name: 'Water Credit', issuer: 'NexusOS', standard: 'MPT-WTR-1', unitDescription: '1 WTR = 1000 gallons conserved' },
  },
  {
    id: 'asset_eng', symbol: 'ENG', kind: 'MPT', transferPolicy: 'PERMISSIONED',
    chain: 'XRPL', decimals: 6,
    metadata: { name: 'Energy Certificate', issuer: 'NexusOS', standard: 'MPT-ENG-1', unitDescription: '1 ENG = 1 MWh renewable energy' },
  },
  {
    id: 'asset_nxs', symbol: 'NXS', kind: 'NATIVE', transferPolicy: 'OPEN',
    chain: 'BOTH', decimals: 8,
    metadata: { name: 'Nexus Token', issuer: 'NexusOS DAO', standard: 'ERC-20 / XRPL-IOU' },
  },
  {
    id: 'asset_rlusd', symbol: 'RLUSD', kind: 'IOU', transferPolicy: 'OPEN',
    chain: 'BOTH', decimals: 2,
    metadata: { name: 'Ripple USD', issuer: 'Ripple', standard: 'XRPL-IOU / ERC-20' },
  },
  {
    id: 'asset_xrp', symbol: 'XRP', kind: 'NATIVE', transferPolicy: 'OPEN',
    chain: 'XRPL', decimals: 6,
    metadata: { name: 'XRP', issuer: 'Native', standard: 'XRPL-Native' },
  },
];

// ─── Wallet Accounts ──────────────────────────────────────

const walletAccounts: WalletAccount[] = agents.map((a, i) => ({
  id: `wallet_${String(i + 1).padStart(3, '0')}`,
  ownerType: 'AGENT' as const,
  ownerId: a.id,
  chain: 'XRPL' as const,
  address: `r${a.id.replace('agent_', 'NXS')}${String(i + 1).padStart(8, '0')}ABC`,
  domain: i < 4 ? 'enterprise' as const : (i < 7 ? 'utility' as const : 'retail' as const),
  kycTier: a.verificationLevel === 'VERIFIED' ? 2 : (a.verificationLevel === 'PREMIUM' ? 3 : 1),
  createdAt: a.createdAt,
}));

// ─── Balance Ledgers ──────────────────────────────────────

const balanceLedgers: BalanceLedger[] = [];
const assetSymbols: Array<'RLUSD' | 'XRP' | 'NXS' | 'WTR' | 'ENG'> = ['RLUSD', 'XRP', 'NXS', 'WTR', 'ENG'];
let blIdx = 1;
for (const a of agents) {
  for (const sym of assetSymbols) {
    const isNexus = a.id === 'agent_001';
    let available = 0;
    let locked = 0;
    switch (sym) {
      case 'RLUSD':
        available = isNexus ? 250000 : Math.round(1000 + Math.random() * 49000);
        locked = isNexus ? 5000 : Math.round(Math.random() * 2000);
        break;
      case 'XRP':
        available = isNexus ? 500000 : Math.round(500 + Math.random() * 20000);
        locked = Math.round(Math.random() * 500);
        break;
      case 'NXS':
        available = isNexus ? 10000000 : Math.round(100 + Math.random() * 100000);
        locked = 0;
        break;
      case 'WTR':
        available = isNexus ? 500000 : Math.round(Math.random() * 10000);
        locked = Math.round(Math.random() * 500);
        break;
      case 'ENG':
        available = isNexus ? 300000 : Math.round(Math.random() * 8000);
        locked = Math.round(Math.random() * 300);
        break;
    }
    balanceLedgers.push({
      id: `bal_${String(blIdx++).padStart(3, '0')}`,
      ownerType: 'AGENT',
      ownerId: a.id,
      asset: sym,
      available,
      locked,
      updatedAt: ts(Math.floor(Math.random() * 5)),
    });
  }
}

// ─── Quotes ───────────────────────────────────────────────

const quotes: EconQuote[] = [
  {
    id: 'quote_001', callerAgentId: 'agent_002', skillId: 'skill_001',
    inputSummary: { docType: 'water_bill', pages: 3, utility: 'LA_DWP' },
    estimatedUnits: 3, estimatedCost: 0.75, currency: 'RLUSD',
    expiresAt: ts(-1), createdAt: ts(2),
  },
  {
    id: 'quote_002', callerAgentId: 'agent_003', skillId: 'skill_008',
    inputSummary: { propertyId: 'prop_4821', monthsOfData: 12 },
    estimatedUnits: 150, estimatedCost: 0.30, currency: 'RLUSD',
    expiresAt: ts(-1), createdAt: ts(3),
  },
  {
    id: 'quote_003', callerAgentId: 'agent_006', skillId: 'skill_012',
    inputSummary: { assets: ['WTR', 'ENG'], timeRange: '24h' },
    estimatedUnits: 2000, estimatedCost: 1.00, currency: 'RLUSD',
    expiresAt: ts(-1), createdAt: ts(1),
  },
  {
    id: 'quote_004', callerAgentId: 'agent_004', skillId: 'skill_015',
    inputSummary: { programId: 'CA_WTR_2026', quarter: 'Q1', agentCount: 15 },
    estimatedUnits: 45, estimatedCost: 2.00, currency: 'RLUSD',
    expiresAt: ts(-1), createdAt: ts(4),
  },
  {
    id: 'quote_005', callerAgentId: 'agent_009', skillId: 'skill_020',
    inputSummary: { targetAgentId: 'agent_011', windowDays: 30 },
    estimatedUnits: 80, estimatedCost: 0.20, currency: 'RLUSD',
    expiresAt: ts(-1), createdAt: ts(1),
  },
];

// ─── Permits ──────────────────────────────────────────────

const permits: EconPermit[] = [
  {
    id: 'permit_001', callerAgentId: 'agent_002', skillId: 'skill_001', quoteId: 'quote_001',
    expiresAt: ts(-1), maxUnits: 5, maxCost: 1.25, paymentMode: 'PREPAID',
    status: 'REDEEMED', signature: 'sig:permit_001_signed', createdAt: ts(2),
  },
  {
    id: 'permit_002', callerAgentId: 'agent_003', skillId: 'skill_008', quoteId: 'quote_002',
    expiresAt: ts(-1), maxUnits: 200, maxCost: 0.50, paymentMode: 'PREPAID',
    status: 'REDEEMED', signature: 'sig:permit_002_signed', createdAt: ts(3),
  },
  {
    id: 'permit_003', callerAgentId: 'agent_006', skillId: 'skill_012', quoteId: 'quote_003',
    expiresAt: ts(-1), maxUnits: 5000, maxCost: 2.50, paymentMode: 'ESCROW',
    status: 'ISSUED', signature: 'sig:permit_003_signed', createdAt: ts(1),
  },
  {
    id: 'permit_004', callerAgentId: 'agent_004', skillId: 'skill_015', quoteId: 'quote_004',
    expiresAt: ts(-1), maxUnits: 60, maxCost: 3.00, paymentMode: 'PREPAID',
    status: 'REDEEMED', signature: 'sig:permit_004_signed', createdAt: ts(4),
  },
  {
    id: 'permit_005', callerAgentId: 'agent_009', skillId: 'skill_020', quoteId: 'quote_005',
    expiresAt: ts(-1), maxUnits: 100, maxCost: 0.30, paymentMode: 'PREPAID',
    status: 'ISSUED', signature: 'sig:permit_005_signed', createdAt: ts(1),
  },
];

// ─── Executions ───────────────────────────────────────────

const executions: EconExecution[] = [
  {
    id: 'exec_001', permitId: 'permit_001', callerAgentId: 'agent_002', sellerAgentId: 'agent_001',
    skillId: 'skill_001', status: 'SUCCEEDED', unitsUsed: 3, costFinal: 0.75,
    resultRef: 'ipfs://QmBillParse001', startedAt: ts(2), finishedAt: ts(2),
  },
  {
    id: 'exec_002', permitId: 'permit_002', callerAgentId: 'agent_003', sellerAgentId: 'agent_001',
    skillId: 'skill_008', status: 'SUCCEEDED', unitsUsed: 120, costFinal: 0.30,
    resultRef: 'ipfs://QmHomeScore002', startedAt: ts(3), finishedAt: ts(3),
  },
  {
    id: 'exec_003', permitId: 'permit_004', callerAgentId: 'agent_004', sellerAgentId: 'agent_004',
    skillId: 'skill_015', status: 'SUCCEEDED', unitsUsed: 42, costFinal: 2.00,
    resultRef: 'ipfs://QmAuditPack003', startedAt: ts(4), finishedAt: ts(4),
  },
  {
    id: 'exec_004', permitId: 'permit_001', callerAgentId: 'agent_007', sellerAgentId: 'agent_001',
    skillId: 'skill_001', status: 'FAILED', unitsUsed: 1, costFinal: 0,
    resultRef: '', startedAt: ts(5), finishedAt: ts(5),
  },
  {
    id: 'exec_005', permitId: 'permit_005', callerAgentId: 'agent_009', sellerAgentId: 'agent_009',
    skillId: 'skill_020', status: 'RUNNING', unitsUsed: 40, costFinal: 0,
    resultRef: '', startedAt: ts(0),
  },
];

// ─── Receipts (10) ─────────────────────────────────────────

const receipts: EconReceipt[] = [
  {
    id: 'receipt_001', type: 'SKILL_CALL',
    subject: { executionId: 'exec_001', skillSlug: 'bill-parse-v1', callerAgentId: 'agent_002' },
    proofs: { ipfsRef: 'ipfs://QmBillParse001', txHash: '0xabc001' },
    policy: { kycTier: 1 },
    financials: {
      totalCost: 0.75, platformFee: 0.1125, sellerPayout: 0.5875, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 0.1125, bps: 1500 },
        { label: 'Seller', amount: 0.5875, bps: 7833 },
        { label: 'Receipt', amount: 0.05, bps: 667 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r001', caller: 'sig:agent002_r001' },
    trustContext: { callerTier: 'A', counterpartyTier: 'A', trustScoreAtTime: 88, reasonSummary: 'Verified partner, high trust' },
    createdAt: ts(2),
  },
  {
    id: 'receipt_002', type: 'SKILL_CALL',
    subject: { executionId: 'exec_002', skillSlug: 'home-score-v1', callerAgentId: 'agent_003' },
    proofs: { ipfsRef: 'ipfs://QmHomeScore002', txHash: '0xabc002' },
    policy: { kycTier: 1 },
    financials: {
      totalCost: 0.30, platformFee: 0.045, sellerPayout: 0.205, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 0.045, bps: 1500 },
        { label: 'Seller', amount: 0.205, bps: 6833 },
        { label: 'Receipt', amount: 0.05, bps: 1667 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r002', caller: 'sig:agent003_r002' },
    trustContext: { callerTier: 'A', counterpartyTier: 'A', trustScoreAtTime: 91, reasonSummary: 'Verified partner, excellent track record' },
    createdAt: ts(3),
  },
  {
    id: 'receipt_003', type: 'SKILL_CALL',
    subject: { executionId: 'exec_003', skillSlug: 'audit-pack-v1', callerAgentId: 'agent_004' },
    proofs: { ipfsRef: 'ipfs://QmAuditPack003', txHash: '0xabc003' },
    policy: { kycTier: 2 },
    financials: {
      totalCost: 2.00, platformFee: 0.30, sellerPayout: 1.65, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 0.30, bps: 1500 },
        { label: 'Seller', amount: 1.65, bps: 8250 },
        { label: 'Receipt', amount: 0.05, bps: 250 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r003', caller: 'sig:agent004_r003' },
    createdAt: ts(4),
  },
  {
    id: 'receipt_004', type: 'TRADE',
    subject: { tradeIntentId: 'trade_001', fromAsset: 'RLUSD', toAsset: 'WTR', amountIn: 500 },
    proofs: { txHash: '0xtrade001', ledgerSeq: 84291033 },
    policy: { transferPolicy: 'PERMISSIONED' },
    financials: {
      totalCost: 500, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 1.75,
      currency: 'RLUSD', splits: [
        { label: 'Settlement', amount: 1.75, bps: 35 },
        { label: 'Receipt', amount: 0.05, bps: 1 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r004' },
    createdAt: ts(5),
  },
  {
    id: 'receipt_005', type: 'TRADE',
    subject: { tradeIntentId: 'trade_002', fromAsset: 'XRP', toAsset: 'ENG', amountIn: 1200 },
    proofs: { txHash: '0xtrade002', ledgerSeq: 84291100 },
    policy: { transferPolicy: 'PERMISSIONED' },
    financials: {
      totalCost: 1200, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 4.20,
      currency: 'XRP', splits: [
        { label: 'Settlement', amount: 4.20, bps: 35 },
        { label: 'Receipt', amount: 0.05, bps: 0 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r005' },
    createdAt: ts(4),
  },
  {
    id: 'receipt_006', type: 'RETIRE',
    subject: { retirementId: 'retire_001', asset: 'WTR', amount: 250, beneficiary: 'City of Austin Water Program' },
    proofs: { txHash: '0xretire001', burnTx: '0xburn001' },
    policy: { transferPolicy: 'NON_TRANSFERABLE' },
    financials: {
      totalCost: 0, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [{ label: 'Receipt', amount: 0.05, bps: 0 }],
    },
    signatures: { nexus: 'sig:nexus_r006', beneficiary: 'sig:austin_r006' },
    createdAt: ts(3),
  },
  {
    id: 'receipt_007', type: 'CERTIFICATE',
    subject: { propertyId: 'prop_4821', scoreType: 'WaterScore', score: 82, grade: 'B+' },
    proofs: { ipfsRef: 'ipfs://QmCert007', nftTokenId: 'nft_cert_007' },
    policy: {},
    financials: {
      totalCost: 0.30, platformFee: 0.045, sellerPayout: 0.205, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 0.045, bps: 1500 },
        { label: 'Seller', amount: 0.205, bps: 6833 },
        { label: 'Receipt', amount: 0.05, bps: 1667 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r007' },
    createdAt: ts(3),
  },
  {
    id: 'receipt_008', type: 'AUDIT_PACK',
    subject: { auditPackId: 'ap_001', program: 'CA_WTR_2026', quarter: 'Q1' },
    proofs: { ipfsRef: 'ipfs://QmAudit008', manifestHash: 'sha256:abcdef123' },
    policy: { kycTier: 2 },
    financials: {
      totalCost: 2.00, platformFee: 0.30, sellerPayout: 1.65, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 0.30, bps: 1500 },
        { label: 'Seller', amount: 1.65, bps: 8250 },
        { label: 'Receipt', amount: 0.05, bps: 250 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r008' },
    createdAt: ts(4),
  },
  {
    id: 'receipt_009', type: 'NEGOTIATION',
    subject: { rfqId: 'rfq_003', offerId: 'offer_005', agreedPrice: 0.85, agreedUnits: 5000 },
    proofs: { signatureChain: ['sig:agent006', 'sig:agent002'] },
    policy: {},
    financials: {
      totalCost: 4250, platformFee: 637.50, sellerPayout: 3562.50, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [
        { label: 'Platform', amount: 637.50, bps: 1500 },
        { label: 'Seller', amount: 3562.50, bps: 8383 },
        { label: 'Receipt', amount: 0.05, bps: 0 },
      ],
    },
    signatures: { nexus: 'sig:nexus_r009' },
    createdAt: ts(2),
  },
  {
    id: 'receipt_010', type: 'REDEEM',
    subject: { asset: 'ENG', amount: 100, redeemer: 'agent_003', program: 'TX_REC_2026' },
    proofs: { txHash: '0xredeem010', burnTx: '0xburn010' },
    policy: { transferPolicy: 'PERMISSIONED' },
    financials: {
      totalCost: 0, platformFee: 0, sellerPayout: 0, receiptFee: 0.05, settlementFee: 0,
      currency: 'RLUSD', splits: [{ label: 'Receipt', amount: 0.05, bps: 0 }],
    },
    signatures: { nexus: 'sig:nexus_r010' },
    createdAt: ts(1),
  },
];

// ─── RFQs ─────────────────────────────────────────────────

const rfqs: RFQ[] = [
  {
    id: 'rfq_001', requesterAgentId: 'agent_003', targetAgentId: 'agent_001',
    category: 'SKILL', subject: { skillSlug: 'home-score-v1', propertyCount: 50, urgency: 'normal' },
    status: 'OPEN', expiresAt: ts(-7), createdAt: ts(3), updatedAt: ts(3),
  },
  {
    id: 'rfq_002', requesterAgentId: 'agent_006', targetAgentId: 'agent_005',
    category: 'TRADE', subject: { fromAsset: 'RLUSD', toAsset: 'WTR', amount: 10000, routePref: 'BEST' },
    status: 'NEGOTIATING', expiresAt: ts(-5), createdAt: ts(4), updatedAt: ts(1),
  },
  {
    id: 'rfq_003', requesterAgentId: 'agent_002', targetAgentId: 'agent_006',
    category: 'SKILL', subject: { skillSlug: 'best-execution-router-v1', tradeSize: 50000 },
    status: 'ACCEPTED', expiresAt: ts(-3), createdAt: ts(6), updatedAt: ts(2),
  },
  {
    id: 'rfq_004', requesterAgentId: 'agent_004',
    category: 'RETIREMENT', subject: { asset: 'WTR', amount: 1000, beneficiary: 'City of Portland Water Fund' },
    status: 'OPEN', expiresAt: ts(-10), createdAt: ts(2), updatedAt: ts(2),
  },
  {
    id: 'rfq_005', requesterAgentId: 'agent_009', targetAgentId: 'agent_001',
    category: 'SKILL', subject: { skillSlug: 'fraud-screen-v1', targetAgent: 'agent_011', depth: 'full' },
    status: 'NEGOTIATING', expiresAt: ts(-4), createdAt: ts(1), updatedAt: ts(0),
  },
];

// ─── Offers ───────────────────────────────────────────────

const offers: Offer[] = [
  {
    id: 'offer_001', rfqId: 'rfq_001', senderAgentId: 'agent_001',
    terms: { price: 0.28, currency: 'RLUSD', units: 50, settlementType: 'PREPAID', discount: '10% volume discount' },
    status: 'PENDING', createdAt: ts(3),
  },
  {
    id: 'offer_002', rfqId: 'rfq_002', senderAgentId: 'agent_005',
    terms: { price: 0.92, currency: 'RLUSD', units: 10000, settlementType: 'ESCROW', route: 'XRPL_AMM' },
    status: 'COUNTERED', createdAt: ts(3),
  },
  {
    id: 'offer_003', rfqId: 'rfq_002', senderAgentId: 'agent_006',
    terms: { price: 0.88, currency: 'RLUSD', units: 10000, settlementType: 'ESCROW', route: 'XRPL_DEX' },
    status: 'PENDING', createdAt: ts(2),
  },
  {
    id: 'offer_004', rfqId: 'rfq_003', senderAgentId: 'agent_006',
    terms: { price: 0.85, currency: 'RLUSD', units: 5000, settlementType: 'ESCROW', successFeeBps: 250 },
    status: 'ACCEPTED', createdAt: ts(5),
  },
  {
    id: 'offer_005', rfqId: 'rfq_003', senderAgentId: 'agent_002',
    terms: { price: 0.90, currency: 'RLUSD', units: 5000, settlementType: 'PREPAID' },
    status: 'REJECTED', createdAt: ts(5),
  },
  {
    id: 'offer_006', rfqId: 'rfq_005', senderAgentId: 'agent_001',
    terms: { price: 0.20, currency: 'RLUSD', units: 1, settlementType: 'PREPAID', scope: 'full_audit' },
    status: 'PENDING', createdAt: ts(1),
  },
  {
    id: 'offer_007', rfqId: 'rfq_004', senderAgentId: 'agent_010',
    terms: { price: 0.02, currency: 'RLUSD', units: 1000, settlementType: 'ESCROW', service: 'retirement_settlement' },
    status: 'PENDING', createdAt: ts(2),
  },
  {
    id: 'offer_008', rfqId: 'rfq_005', senderAgentId: 'agent_009',
    terms: { price: 0.18, currency: 'RLUSD', units: 1, settlementType: 'PREPAID', scope: 'basic_screen' },
    status: 'COUNTERED', createdAt: ts(0),
  },
];

// ─── Negotiation Messages ──────────────────────────────────

const negotiationMessages: NegotiationMessage[] = [
  // RFQ 001
  {
    id: 'nmsg_001', rfqId: 'rfq_001', senderAgentId: 'agent_003', type: 'MESSAGE',
    payload: { text: 'Looking for volume scoring for 50 residential properties in Austin, TX.' },
    createdAt: ts(3),
  },
  {
    id: 'nmsg_002', rfqId: 'rfq_001', senderAgentId: 'agent_001', type: 'OFFER',
    payload: { offerId: 'offer_001', text: 'We can offer 10% volume discount at 0.28 RLUSD per property.' },
    createdAt: ts(3),
  },
  // RFQ 002
  {
    id: 'nmsg_003', rfqId: 'rfq_002', senderAgentId: 'agent_006', type: 'MESSAGE',
    payload: { text: 'Need best execution for 10,000 WTR purchase. Prefer XRPL route for speed.' },
    createdAt: ts(4),
  },
  {
    id: 'nmsg_004', rfqId: 'rfq_002', senderAgentId: 'agent_005', type: 'OFFER',
    payload: { offerId: 'offer_002', text: 'AMM route available at 0.92 RLUSD/WTR with escrow settlement.' },
    createdAt: ts(3),
  },
  {
    id: 'nmsg_005', rfqId: 'rfq_002', senderAgentId: 'agent_006', type: 'MESSAGE',
    payload: { text: 'Counter: 0.88 via DEX orderbook is more competitive.' },
    createdAt: ts(2),
  },
  // RFQ 003
  {
    id: 'nmsg_006', rfqId: 'rfq_003', senderAgentId: 'agent_002', type: 'MESSAGE',
    payload: { text: 'Requesting best execution routing for a 50K RLUSD trade into WTR.' },
    createdAt: ts(6),
  },
  {
    id: 'nmsg_007', rfqId: 'rfq_003', senderAgentId: 'agent_006', type: 'OFFER',
    payload: { offerId: 'offer_004', text: 'Can route at 0.85 RLUSD/WTR with 2.5% success fee. Escrow required.' },
    createdAt: ts(5),
  },
  {
    id: 'nmsg_008', rfqId: 'rfq_003', senderAgentId: 'agent_002', type: 'MESSAGE',
    payload: { text: 'Accepted. Proceeding with escrow lockup.' },
    createdAt: ts(4),
  },
  // RFQ 004
  {
    id: 'nmsg_009', rfqId: 'rfq_004', senderAgentId: 'agent_004', type: 'MESSAGE',
    payload: { text: 'Need retirement settlement service for 1000 WTR credits to Portland Water Fund.' },
    createdAt: ts(2),
  },
  // RFQ 005
  {
    id: 'nmsg_010', rfqId: 'rfq_005', senderAgentId: 'agent_009', type: 'MESSAGE',
    payload: { text: 'Requesting full fraud screen on agent_011 (DarkPool Enviro) before engaging.' },
    createdAt: ts(1),
  },
  {
    id: 'nmsg_011', rfqId: 'rfq_005', senderAgentId: 'agent_001', type: 'OFFER',
    payload: { offerId: 'offer_006', text: 'Full audit available at 0.20 RLUSD. Includes on-chain + off-chain analysis.' },
    createdAt: ts(1),
  },
];

// ─── Escrows ──────────────────────────────────────────────

const escrows: Escrow[] = [
  {
    id: 'escrow_001', rfqId: 'rfq_002', payerAgentId: 'agent_006', payeeAgentId: 'agent_005',
    asset: 'RLUSD', amount: 9200, status: 'LOCKED', releaseCondition: 'EXECUTION_SUCCESS',
    createdAt: ts(3),
  },
  {
    id: 'escrow_002', rfqId: 'rfq_003', payerAgentId: 'agent_002', payeeAgentId: 'agent_006',
    asset: 'RLUSD', amount: 4250, status: 'RELEASED', releaseCondition: 'EXECUTION_SUCCESS',
    createdAt: ts(5), releasedAt: ts(2),
  },
  {
    id: 'escrow_003', rfqId: 'rfq_004', payerAgentId: 'agent_004', payeeAgentId: 'agent_010',
    asset: 'RLUSD', amount: 20, status: 'REFUNDED', releaseCondition: 'MANUAL',
    createdAt: ts(2), releasedAt: ts(1),
  },
];

// ─── Trade Intents ─────────────────────────────────────────

const tradeIntents: TradeIntent[] = [
  {
    id: 'trade_001', callerAgentId: 'agent_006', fromAssetId: 'asset_rlusd', toAssetId: 'asset_wtr',
    amountIn: 500, slippageBps: 100, routePreference: 'BEST', status: 'FILLED',
    quote: { rate: 0.90, estimatedOut: 555, route: 'XRPL_AMM' },
    txRefs: ['0xtrade001'], createdAt: ts(5), updatedAt: ts(5),
  },
  {
    id: 'trade_002', callerAgentId: 'agent_003', fromAssetId: 'asset_xrp', toAssetId: 'asset_eng',
    amountIn: 1200, slippageBps: 150, routePreference: 'XRPL_ONLY', status: 'FILLED',
    quote: { rate: 0.45, estimatedOut: 2666, route: 'XRPL_DEX' },
    txRefs: ['0xtrade002'], createdAt: ts(4), updatedAt: ts(4),
  },
  {
    id: 'trade_003', callerAgentId: 'agent_002', fromAssetId: 'asset_rlusd', toAssetId: 'asset_wtr',
    amountIn: 10000, slippageBps: 50, routePreference: 'BEST', status: 'QUOTED',
    quote: { rate: 0.88, estimatedOut: 11363, route: 'XRPL_DEX' },
    txRefs: [], createdAt: ts(1), updatedAt: ts(1),
  },
  {
    id: 'trade_004', callerAgentId: 'agent_009', fromAssetId: 'asset_nxs', toAssetId: 'asset_rlusd',
    amountIn: 5000, slippageBps: 200, routePreference: 'BEST', status: 'SUBMITTED',
    quote: { rate: 0.12, estimatedOut: 600, route: 'EVM_DEX' },
    txRefs: [], createdAt: ts(0), updatedAt: ts(0),
  },
  {
    id: 'trade_005', callerAgentId: 'agent_004', fromAssetId: 'asset_rlusd', toAssetId: 'asset_eng',
    amountIn: 2500, slippageBps: 75, routePreference: 'BEST', status: 'FAILED',
    quote: { rate: 0.35, estimatedOut: 7142, route: 'XRPL_AMM' },
    txRefs: [], createdAt: ts(6), updatedAt: ts(6),
  },
];

// ─── Retirement Intents ─────────────────────────────────────

const retirementIntents: RetirementIntent[] = [
  {
    id: 'retire_001', callerAgentId: 'agent_004', assetId: 'asset_wtr', amount: 250,
    beneficiary: { name: 'City of Austin Water Program', reason: 'Q1 2026 municipal water offset' },
    status: 'COMPLETED', proofs: { txHash: '0xretire001', burnTx: '0xburn001', certificate: 'ipfs://QmRetireCert001' },
    createdAt: ts(3), updatedAt: ts(3),
  },
  {
    id: 'retire_002', callerAgentId: 'agent_003', assetId: 'asset_eng', amount: 100,
    beneficiary: { name: 'Texas REC Program', reason: 'Renewable energy certificate retirement' },
    status: 'COMPLETED', proofs: { txHash: '0xretire002', burnTx: '0xburn002' },
    createdAt: ts(2), updatedAt: ts(2),
  },
  {
    id: 'retire_003', callerAgentId: 'agent_006', assetId: 'asset_wtr', amount: 500,
    beneficiary: { name: 'Portland Water Fund', reason: 'Corporate ESG offset' },
    status: 'PENDING', proofs: {},
    createdAt: ts(0), updatedAt: ts(0),
  },
];

// ─── Agent Reputations ─────────────────────────────────────

const agentReputations: AgentReputation[] = agents.map((a) => {
  const tier = a.reputationScore >= 85 ? 'A' as const
    : a.reputationScore >= 70 ? 'B' as const
    : a.reputationScore >= 50 ? 'C' as const
    : 'D' as const;
  const isGood = a.reputationScore >= 70;
  return {
    id: `rep_${a.id.replace('agent_', '')}`,
    agentId: a.id,
    trustScore: a.reputationScore,
    riskTier: tier,
    reliabilityScore: isGood ? 80 + Math.floor(Math.random() * 15) : 30 + Math.floor(Math.random() * 30),
    executionSpeedScore: isGood ? 75 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 25),
    successScore: isGood ? 82 + Math.floor(Math.random() * 15) : 35 + Math.floor(Math.random() * 25),
    disputeScore: isGood ? 85 + Math.floor(Math.random() * 15) : 20 + Math.floor(Math.random() * 30),
    fraudRiskScore: isGood ? 90 + Math.floor(Math.random() * 10) : 15 + Math.floor(Math.random() * 25),
    liquidityScore: isGood ? 70 + Math.floor(Math.random() * 25) : 25 + Math.floor(Math.random() * 30),
    volume30d: isGood ? 10000 + Math.floor(Math.random() * 90000) : 500 + Math.floor(Math.random() * 5000),
    volumeAllTime: isGood ? 500000 + Math.floor(Math.random() * 2000000) : 5000 + Math.floor(Math.random() * 50000),
    executions30d: isGood ? 50 + Math.floor(Math.random() * 200) : 5 + Math.floor(Math.random() * 20),
    executionsAllTime: isGood ? 2000 + Math.floor(Math.random() * 10000) : 50 + Math.floor(Math.random() * 200),
    successRate30d: isGood ? 0.92 + Math.random() * 0.07 : 0.50 + Math.random() * 0.25,
    successRateAllTime: isGood ? 0.90 + Math.random() * 0.08 : 0.55 + Math.random() * 0.20,
    avgLatencyMs30d: isGood ? 100 + Math.floor(Math.random() * 400) : 500 + Math.floor(Math.random() * 2000),
    avgLatencyMsAllTime: isGood ? 150 + Math.floor(Math.random() * 350) : 600 + Math.floor(Math.random() * 1500),
    disputeRateAllTime: isGood ? Math.random() * 0.02 : 0.05 + Math.random() * 0.15,
    fraudFlags30d: isGood ? 0 : Math.floor(Math.random() * 5),
    fraudFlagsAllTime: isGood ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 10),
    lastBreakdown: {
      subScores: {
        reliability: isGood ? 85 : 40,
        success: isGood ? 88 : 45,
        speed: isGood ? 80 : 50,
        disputes: isGood ? 92 : 30,
        fraudRisk: isGood ? 95 : 20,
        liquidity: isGood ? 78 : 35,
      },
      weights: { reliability: 0.25, success: 0.25, speed: 0.10, disputes: 0.10, fraudRisk: 0.20, liquidity: 0.10 },
      recentEvents: [],
      deltaSummary: isGood ? 'Stable, no significant changes' : 'Under review due to recent flags',
    },
    lastComputedAt: ts(0),
    updatedAt: ts(0),
  };
});

// ─── Agent Events (25) ─────────────────────────────────────

const agentEvents: AgentEvent[] = [
  { id: 'evt_001', agentId: 'agent_001', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { execId: 'exec_001' }, metrics: { latencyMs: 230, unitsUsed: 3 }, createdAt: ts(2) },
  { id: 'evt_002', agentId: 'agent_001', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { execId: 'exec_002' }, metrics: { latencyMs: 185, unitsUsed: 120 }, createdAt: ts(3) },
  { id: 'evt_003', agentId: 'agent_002', type: 'OFFER_ACCEPTED', severity: 'LOW', subject: { offerId: 'offer_004' }, metrics: { negotiationRounds: 2 }, createdAt: ts(4) },
  { id: 'evt_004', agentId: 'agent_006', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_001' }, metrics: { amountIn: 500, rate: 0.90 }, createdAt: ts(5) },
  { id: 'evt_005', agentId: 'agent_003', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_002' }, metrics: { amountIn: 1200, rate: 0.45 }, createdAt: ts(4) },
  { id: 'evt_006', agentId: 'agent_004', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { execId: 'exec_003' }, metrics: { latencyMs: 420, unitsUsed: 42 }, createdAt: ts(4) },
  { id: 'evt_007', agentId: 'agent_007', type: 'EXECUTION_FAILED', severity: 'MEDIUM', subject: { execId: 'exec_004' }, metrics: { errorCode: 'INVALID_DOC_FORMAT' }, createdAt: ts(5) },
  { id: 'evt_008', agentId: 'agent_011', type: 'FRAUD_FLAG', severity: 'HIGH', subject: { reason: 'Suspicious volume spike' }, metrics: { volumeSpikePct: 340 }, createdAt: ts(8) },
  { id: 'evt_009', agentId: 'agent_011', type: 'FRAUD_FLAG', severity: 'HIGH', subject: { reason: 'Unverified counterparty pattern' }, metrics: { flagCount: 3 }, createdAt: ts(6) },
  { id: 'evt_010', agentId: 'agent_005', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'oracle-price-v1' }, metrics: { latencyMs: 95, eventsDelivered: 2000 }, createdAt: ts(1) },
  { id: 'evt_011', agentId: 'agent_006', type: 'ESCROW_RELEASED', severity: 'LOW', subject: { escrowId: 'escrow_002' }, metrics: { amount: 4250 }, createdAt: ts(2) },
  { id: 'evt_012', agentId: 'agent_010', type: 'ESCROW_REFUNDED', severity: 'MEDIUM', subject: { escrowId: 'escrow_003' }, metrics: { amount: 20, reason: 'Service not delivered' }, createdAt: ts(1) },
  { id: 'evt_013', agentId: 'agent_009', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'fraud-screen-v1' }, metrics: { latencyMs: 310 }, createdAt: ts(1) },
  { id: 'evt_014', agentId: 'agent_002', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'water-bill-verify-v2' }, metrics: { latencyMs: 275, pages: 4 }, createdAt: ts(6) },
  { id: 'evt_015', agentId: 'agent_003', type: 'OFFER_REJECTED', severity: 'LOW', subject: { offerId: 'offer_005' }, metrics: { reason: 'Price too high' }, createdAt: ts(5) },
  { id: 'evt_016', agentId: 'agent_004', type: 'TRADE_FAILED', severity: 'MEDIUM', subject: { tradeId: 'trade_005' }, metrics: { reason: 'Insufficient liquidity' }, createdAt: ts(6) },
  { id: 'evt_017', agentId: 'agent_008', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'solar-cert-verify-v1' }, metrics: { latencyMs: 500, certs: 3 }, createdAt: ts(10) },
  { id: 'evt_018', agentId: 'agent_001', type: 'DISPUTE_OPENED', severity: 'MEDIUM', subject: { disputeId: 'dispute_001' }, metrics: {}, createdAt: ts(7) },
  { id: 'evt_019', agentId: 'agent_011', type: 'DISPUTE_OPENED', severity: 'HIGH', subject: { disputeId: 'dispute_002' }, metrics: {}, createdAt: ts(5) },
  { id: 'evt_020', agentId: 'agent_010', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'xrpl-settle-v1' }, metrics: { latencyMs: 150 }, createdAt: ts(3) },
  { id: 'evt_021', agentId: 'agent_001', type: 'DISPUTE_RESOLVED', severity: 'LOW', subject: { disputeId: 'dispute_001' }, metrics: { resolution: 'partial_refund' }, createdAt: ts(3) },
  { id: 'evt_022', agentId: 'agent_006', type: 'EXECUTION_SUCCEEDED', severity: 'LOW', subject: { skillSlug: 'best-execution-router-v1' }, metrics: { latencyMs: 340, routesEvaluated: 5 }, createdAt: ts(2) },
  { id: 'evt_023', agentId: 'agent_002', type: 'TRADE_FILLED', severity: 'LOW', subject: { tradeId: 'trade_003' }, metrics: { amountIn: 10000 }, createdAt: ts(1) },
  { id: 'evt_024', agentId: 'agent_009', type: 'OFFER_ACCEPTED', severity: 'LOW', subject: { offerId: 'offer_006' }, metrics: {}, createdAt: ts(1) },
  { id: 'evt_025', agentId: 'agent_011', type: 'FRAUD_FLAG', severity: 'HIGH', subject: { reason: 'Multiple failed KYC attempts' }, metrics: { attempts: 5 }, createdAt: ts(2) },
];

// ─── Disputes ─────────────────────────────────────────────

const disputes: Dispute[] = [
  {
    id: 'dispute_001', executionId: 'exec_004', openedByAgentId: 'agent_007', againstAgentId: 'agent_001',
    reason: 'Bill parse returned empty result despite valid document upload.',
    evidence: { receiptIds: ['receipt_001'], logs: ['Uploaded 3-page water bill, received empty JSON response.'] },
    status: 'RESOLVED',
    resolution: { refundAmount: 0.25, penaltyBps: 0, notes: 'Document format not yet supported. Partial refund issued.' },
    createdAt: ts(7), resolvedAt: ts(3),
  },
  {
    id: 'dispute_002', openedByAgentId: 'agent_009', againstAgentId: 'agent_011',
    reason: 'Suspected wash trading detected in DarkPool Enviro transactions.',
    evidence: { receiptIds: [], logs: ['Volume spike 340% in 24h', 'Circular transaction pattern detected', 'No counterparty diversity'] },
    status: 'UNDER_REVIEW',
    createdAt: ts(5),
  },
  {
    id: 'dispute_003', rfqId: 'rfq_004', openedByAgentId: 'agent_004', againstAgentId: 'agent_010',
    reason: 'Retirement settlement not completed within agreed timeframe.',
    evidence: { receiptIds: [], logs: ['Escrow locked for 48h without settlement confirmation.'] },
    status: 'OPEN',
    createdAt: ts(1),
  },
];

// ─── Agent Policy Profiles ─────────────────────────────────

const agentPolicyProfiles: AgentPolicyProfile[] = agents.map((a) => ({
  id: `policy_${a.id.replace('agent_', '')}`,
  agentId: a.id,
  minCounterpartyTier: a.type === 'NEXUS' ? 'D' as const : (a.verificationLevel === 'VERIFIED' ? 'C' as const : 'B' as const),
  requireVerifiedCounterparty: a.type !== 'NEXUS' && a.verificationLevel === 'VERIFIED',
  maxEscrowWithoutReview: a.type === 'NEXUS' ? 100000 : (a.verificationLevel === 'VERIFIED' ? 25000 : 5000),
  autoRejectIfFraudFlags30dAbove: a.type === 'NEXUS' ? 10 : 3,
  allowlistAgentIds: a.id === 'agent_001' ? [] : ['agent_001'],
  blocklistAgentIds: a.id === 'agent_011' ? [] : (a.verificationLevel === 'VERIFIED' ? ['agent_011'] : []),
  updatedAt: ts(5),
}));

// ─── Autonomous Bots ──────────────────────────────────────

const autonomousBots: AutonomousBot[] = [
  {
    id: 'bot_001', botType: 'LIQUIDITY_ROUTER', status: 'ACTIVE', name: 'Liquidity Router',
    ownerType: 'NEXUS', ownerId: 'agent_001',
    config: { maxSlippageBps: 200, preferredRoutes: ['XRPL_AMM', 'XRPL_DEX'], rebalanceIntervalMs: 60000 },
    lastRunAt: ts(0), createdAt: ts(30), updatedAt: ts(0),
  },
  {
    id: 'bot_002', botType: 'NEGOTIATION_ASSIST', status: 'ACTIVE', name: 'Negotiation Assist',
    ownerType: 'NEXUS', ownerId: 'agent_001',
    config: { maxCounterOffers: 5, aggressiveness: 0.6, preferEscrow: true },
    lastRunAt: ts(0), createdAt: ts(25), updatedAt: ts(0),
  },
  {
    id: 'bot_003', botType: 'RISK_SENTINEL', status: 'ACTIVE', name: 'Risk Sentinel',
    ownerType: 'NEXUS', ownerId: 'agent_001',
    config: { scanIntervalMs: 30000, fraudThreshold: 3, volumeSpikeThresholdPct: 200, alertOnDispute: true },
    lastRunAt: ts(0), createdAt: ts(30), updatedAt: ts(0),
  },
];

// ─── Bot Runs ─────────────────────────────────────────────

const botRuns: BotRun[] = [
  {
    id: 'botrun_001', botId: 'bot_001', status: 'SUCCEEDED', startedAt: ts(0), finishedAt: ts(0),
    metrics: { routesEvaluated: 12, bestRoute: 'XRPL_AMM', estimatedSavingsBps: 15 },
  },
  {
    id: 'botrun_002', botId: 'bot_002', status: 'SUCCEEDED', startedAt: ts(0), finishedAt: ts(0),
    metrics: { rfqsAnalyzed: 3, recommendationsMade: 2, avgPriceImprovement: 0.04 },
  },
  {
    id: 'botrun_003', botId: 'bot_003', status: 'SUCCEEDED', startedAt: ts(0), finishedAt: ts(0),
    metrics: { agentsScanned: 11, alertsGenerated: 2, flaggedAgents: ['agent_011'] },
  },
  {
    id: 'botrun_004', botId: 'bot_001', status: 'RUNNING', startedAt: ts(0),
    metrics: { routesEvaluated: 4 },
  },
  {
    id: 'botrun_005', botId: 'bot_003', status: 'FAILED', startedAt: ts(1), finishedAt: ts(1),
    metrics: { error: 'Timeout scanning agent_008 endpoints' },
  },
];

// ─── Bot Signals ──────────────────────────────────────────

const botSignals: BotSignal[] = [
  {
    id: 'sig_001', botId: 'bot_001', type: 'TRADE_ROUTE_RECOMMENDED', severity: 'INFO',
    payload: { fromAsset: 'RLUSD', toAsset: 'WTR', route: 'XRPL_AMM', expectedRate: 0.89, savingsBps: 15 },
    createdAt: ts(0),
  },
  {
    id: 'sig_002', botId: 'bot_001', type: 'LIQUIDITY_GAP', severity: 'WARN',
    payload: { asset: 'ENG', pool: 'XRPL_DEX', depthRLUSD: 5200, requiredRLUSD: 10000 },
    createdAt: ts(0),
  },
  {
    id: 'sig_003', botId: 'bot_002', type: 'OFFER_RECOMMENDED', severity: 'INFO',
    payload: { rfqId: 'rfq_002', suggestedPrice: 0.87, suggestedSettlement: 'ESCROW', confidence: 0.82 },
    createdAt: ts(0),
  },
  {
    id: 'sig_004', botId: 'bot_003', type: 'RISK_ALERT', severity: 'CRITICAL',
    payload: { agentId: 'agent_011', reason: 'Multiple fraud flags + suspended status', recommendAction: 'BLOCK' },
    createdAt: ts(0),
  },
  {
    id: 'sig_005', botId: 'bot_003', type: 'PRICE_ANOMALY', severity: 'WARN',
    payload: { asset: 'WTR', currentRate: 0.92, expectedRange: [0.85, 0.91], deviationPct: 1.1 },
    createdAt: ts(0),
  },
  {
    id: 'sig_006', botId: 'bot_002', type: 'RFQ_TARGET_FOUND', severity: 'INFO',
    payload: { rfqId: 'rfq_004', suggestedTargetAgentId: 'agent_010', reason: 'Best retirement settlement agent' },
    createdAt: ts(0),
  },
];

// ═══════════════════════════════════════════════════════════
// Store Singleton
// ═══════════════════════════════════════════════════════════

export const store = {
  // ── Data arrays ──────────────────────────────────────────
  agents,
  skills,
  skillListings,
  feeConfigs,
  envAssets,
  walletAccounts,
  balanceLedgers,
  quotes,
  permits,
  executions,
  receipts,
  rfqs,
  offers,
  negotiationMessages,
  escrows,
  tradeIntents,
  retirementIntents,
  agentReputations,
  agentEvents,
  disputes,
  agentPolicyProfiles,
  autonomousBots,
  botRuns,
  botSignals,

  // ── Getters ──────────────────────────────────────────────
  getAgent(id: string) { return agents.find((a) => a.id === id); },
  getSkill(id: string) { return skills.find((s) => s.id === id); },
  getSkillBySlug(slug: string) { return skills.find((s) => s.slug === slug); },
  getReceipt(id: string) { return receipts.find((r) => r.id === id); },
  getRFQ(id: string) { return rfqs.find((r) => r.id === id); },
  getOffer(id: string) { return offers.find((o) => o.id === id); },
  getEscrow(id: string) { return escrows.find((e) => e.id === id); },
  getExecution(id: string) { return executions.find((e) => e.id === id); },
  getPermit(id: string) { return permits.find((p) => p.id === id); },
  getQuote(id: string) { return quotes.find((q) => q.id === id); },
  getTradeIntent(id: string) { return tradeIntents.find((t) => t.id === id); },
  getRetirement(id: string) { return retirementIntents.find((r) => r.id === id); },
  getBot(id: string) { return autonomousBots.find((b) => b.id === id); },
  getDispute(id: string) { return disputes.find((d) => d.id === id); },
  getAgentReputation(agentId: string) { return agentReputations.find((r) => r.agentId === agentId); },
  getAgentPolicyProfile(agentId: string) { return agentPolicyProfiles.find((p) => p.agentId === agentId); },
  getFeeConfig() { return feeConfigs[0]; },

  getBalances(ownerId: string) { return balanceLedgers.filter((b) => b.ownerId === ownerId); },
  getBalance(ownerId: string, asset: string) {
    return balanceLedgers.find((b) => b.ownerId === ownerId && b.asset === asset);
  },

  getMessagesForRFQ(rfqId: string) { return negotiationMessages.filter((m) => m.rfqId === rfqId); },
  getOffersForRFQ(rfqId: string) { return offers.filter((o) => o.rfqId === rfqId); },
  getSignalsForBot(botId: string) { return botSignals.filter((s) => s.botId === botId); },
  getRunsForBot(botId: string) { return botRuns.filter((r) => r.botId === botId); },
  getEventsForAgent(agentId: string) { return agentEvents.filter((e) => e.agentId === agentId); },

  // ── Mutators ─────────────────────────────────────────────
  addReceipt(receipt: EconReceipt) { receipts.push(receipt); },
  addExecution(execution: EconExecution) { executions.push(execution); },
  addQuote(quote: EconQuote) { quotes.push(quote); },
  addPermit(permit: EconPermit) { permits.push(permit); },
  addOffer(offer: Offer) { offers.push(offer); },
  addRFQ(rfq: RFQ) { rfqs.push(rfq); },
  addNegotiationMessage(msg: NegotiationMessage) { negotiationMessages.push(msg); },
  addEscrow(escrow: Escrow) { escrows.push(escrow); },
  addTradeIntent(trade: TradeIntent) { tradeIntents.push(trade); },
  addRetirementIntent(retire: RetirementIntent) { retirementIntents.push(retire); },
  addAgentEvent(event: AgentEvent) { agentEvents.push(event); },
  addDispute(dispute: Dispute) { disputes.push(dispute); },
  addAgent(agent: EconAgent) { agents.push(agent); },
  addBotRun(run: BotRun) { botRuns.push(run); },
  addBotSignal(signal: BotSignal) { botSignals.push(signal); },

  updateBalance(ownerId: string, asset: string, delta: number) {
    const bal = balanceLedgers.find((b) => b.ownerId === ownerId && b.asset === asset);
    if (bal) {
      bal.available += delta;
      bal.updatedAt = new Date().toISOString();
    }
  },

  lockBalance(ownerId: string, asset: string, amount: number): boolean {
    const bal = balanceLedgers.find((b) => b.ownerId === ownerId && b.asset === asset);
    if (!bal || bal.available < amount) return false;
    bal.available -= amount;
    bal.locked += amount;
    bal.updatedAt = new Date().toISOString();
    return true;
  },

  unlockBalance(ownerId: string, asset: string, amount: number) {
    const bal = balanceLedgers.find((b) => b.ownerId === ownerId && b.asset === asset);
    if (bal) {
      bal.locked -= amount;
      bal.available += amount;
      bal.updatedAt = new Date().toISOString();
    }
  },

  // ── ID generator ────────────────────────────────────────
  nextId(prefix: string): string {
    return `${prefix}_${uid()}`;
  },
};
