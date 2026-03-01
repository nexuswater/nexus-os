/**
 * Agent Layer API Routes
 * 
 * Endpoints for Nexus Agent system, skills marketplace,
 * trading engine, A2A intents, and revenue routing.
 */

import { Router, Request, Response } from 'express';

export const agentsRouter = Router();

// ─── Mock Data ───────────────────────────────────────────

const MOCK_AGENTS = [
  {
    id: 'agent_nexus_core',
    name: 'Nexus Core Agent',
    type: 'NEXUS_CORE',
    status: 'active',
    ownerAddress: 'rNexusCoreAgent000000000000000001',
    description: 'The native Nexus protocol agent. Manages system-level operations including governance relay, bridge coordination, and automated treasury management.',
    avatar: null,
    version: '1.0.0',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2026-02-24T12:00:00Z',
    rail: 'both',
    wallets: [
      { rail: 'xrpl', address: 'rNexusCoreAgent000000000000000001', chainKey: 'XRPL', balance: { NXS: 125000, XRP: 8500 } },
      { rail: 'evm', address: '0xNexusCore0000000000000000000001', chainKey: 'BASE', balance: { NXS: 50000, USDC: 15000 } },
    ],
    skills: ['skill_gov_relay', 'skill_bridge_coord', 'skill_treasury_mgmt', 'skill_oracle_agg', 'skill_rebalance'],
    permissions: [
      { id: 'perm_gov_vote', label: 'Governance Voting', description: 'Cast votes on DAO proposals', risk: 'medium', granted: true },
      { id: 'perm_bridge', label: 'Bridge Execution', description: 'Execute cross-chain bridges', risk: 'high', granted: true },
      { id: 'perm_treasury', label: 'Treasury Operations', description: 'Manage treasury allocations', risk: 'high', granted: true },
      { id: 'perm_trade', label: 'DEX Trading', description: 'Execute trades on XRPL DEX', risk: 'high', granted: true },
    ],
    stats: {
      executionsTotal: 47823,
      executionsLast24h: 342,
      successRate: 0.997,
      avgExecutionTimeMs: 1250,
      totalVolumeUsd: 2450000,
      uptime: 0.999,
      rating: 4.9,
      reviewCount: 128,
    },
    revenueShareBps: 0,
    totalEarnings: 0,
    totalFeesPaid: 12450,
  },
  {
    id: 'agent_water_trader',
    name: 'AquaFlow Trading Bot',
    type: 'TRADING',
    status: 'active',
    ownerAddress: 'rMockOwner123456789012345678901',
    description: 'Automated WTR/NXS market maker on XRPL DEX. Provides liquidity and captures spread using grid strategy with dynamic rebalancing.',
    avatar: null,
    version: '2.1.0',
    createdAt: '2025-06-10T00:00:00Z',
    updatedAt: '2026-02-24T10:30:00Z',
    rail: 'xrpl',
    wallets: [
      { rail: 'xrpl', address: 'rAquaFlow000000000000000000001', chainKey: 'XRPL', balance: { WTR: 45000, NXS: 12000, XRP: 3200 } },
    ],
    skills: ['skill_xrpl_mm', 'skill_grid_trade', 'skill_rebalance'],
    permissions: [
      { id: 'perm_trade', label: 'DEX Trading', description: 'Execute trades on XRPL DEX', risk: 'high', granted: true },
      { id: 'perm_read_market', label: 'Market Data', description: 'Read orderbook and price feeds', risk: 'low', granted: true },
    ],
    stats: {
      executionsTotal: 18432,
      executionsLast24h: 156,
      successRate: 0.982,
      avgExecutionTimeMs: 340,
      totalVolumeUsd: 890000,
      uptime: 0.995,
      rating: 4.7,
      reviewCount: 42,
    },
    revenueShareBps: 250,
    totalEarnings: 8750,
    totalFeesPaid: 2187,
  },
  {
    id: 'agent_data_oracle',
    name: 'HydroSense Oracle',
    type: 'ORACLE',
    status: 'active',
    ownerAddress: 'rMockOwner123456789012345678902',
    description: 'IoT data aggregation oracle. Collects water production metrics from AWG devices and publishes verified readings on-chain for proof generation.',
    avatar: null,
    version: '1.3.0',
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-02-23T18:00:00Z',
    rail: 'both',
    wallets: [
      { rail: 'evm', address: '0xHydroSense00000000000000000001', chainKey: 'BASE', balance: { NXS: 5000, USDC: 800 } },
    ],
    skills: ['skill_iot_collect', 'skill_data_verify', 'skill_oracle_publish'],
    permissions: [
      { id: 'perm_iot_read', label: 'IoT Data Access', description: 'Read IoT device telemetry', risk: 'low', granted: true },
      { id: 'perm_oracle_publish', label: 'Oracle Publishing', description: 'Publish verified data on-chain', risk: 'medium', granted: true },
    ],
    stats: {
      executionsTotal: 92150,
      executionsLast24h: 720,
      successRate: 0.999,
      avgExecutionTimeMs: 180,
      totalVolumeUsd: 0,
      uptime: 0.998,
      rating: 4.8,
      reviewCount: 67,
    },
    revenueShareBps: 150,
    totalEarnings: 4200,
    totalFeesPaid: 630,
  },
  {
    id: 'agent_impact_analyst',
    name: 'GreenMetrics Analyzer',
    type: 'DATA',
    status: 'active',
    ownerAddress: 'rMockOwner123456789012345678903',
    description: 'Environmental impact analysis agent. Processes installation data to generate ESG compliance reports and carbon offset certificates.',
    avatar: null,
    version: '1.1.0',
    createdAt: '2025-09-15T00:00:00Z',
    updatedAt: '2026-02-22T14:00:00Z',
    rail: 'evm',
    wallets: [
      { rail: 'evm', address: '0xGreenMetrics0000000000000000001', chainKey: 'BASE', balance: { NXS: 2500 } },
    ],
    skills: ['skill_esg_report', 'skill_carbon_calc', 'skill_data_verify'],
    permissions: [
      { id: 'perm_data_read', label: 'Data Access', description: 'Read installation and impact data', risk: 'low', granted: true },
      { id: 'perm_report_gen', label: 'Report Generation', description: 'Generate compliance reports', risk: 'low', granted: true },
    ],
    stats: {
      executionsTotal: 3840,
      executionsLast24h: 28,
      successRate: 0.991,
      avgExecutionTimeMs: 4500,
      totalVolumeUsd: 0,
      uptime: 0.992,
      rating: 4.5,
      reviewCount: 19,
    },
    revenueShareBps: 200,
    totalEarnings: 1800,
    totalFeesPaid: 360,
  },
  {
    id: 'agent_governance_delegate',
    name: 'AutoGov Delegate',
    type: 'USER',
    status: 'paused',
    ownerAddress: 'rMockOwner123456789012345678901',
    description: 'Automated governance participation agent. Analyzes proposals against configurable policy rules and casts delegated votes.',
    avatar: null,
    version: '0.9.0',
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2026-02-20T09:00:00Z',
    rail: 'both',
    wallets: [
      { rail: 'evm', address: '0xAutoGov000000000000000000000001', chainKey: 'BASE', balance: { NXS: 800 } },
    ],
    skills: ['skill_gov_relay', 'skill_proposal_analyzer'],
    permissions: [
      { id: 'perm_gov_vote', label: 'Governance Voting', description: 'Cast votes on DAO proposals', risk: 'medium', granted: true },
      { id: 'perm_delegate', label: 'Delegation Management', description: 'Accept and manage delegations', risk: 'medium', granted: false },
    ],
    stats: {
      executionsTotal: 342,
      executionsLast24h: 0,
      successRate: 0.965,
      avgExecutionTimeMs: 2100,
      totalVolumeUsd: 0,
      uptime: 0.88,
      rating: 4.2,
      reviewCount: 8,
    },
    revenueShareBps: 300,
    totalEarnings: 420,
    totalFeesPaid: 126,
  },
];

const MOCK_SKILLS = [
  {
    id: 'skill_gov_relay',
    name: 'Cross-Chain Governance Relay',
    description: 'Relays governance votes from spoke chains to the Base hub via Axelar GMP. Handles message encoding, gas estimation, and delivery confirmation.',
    category: 'governance',
    version: '1.2.0',
    authorAddress: 'rNexusCoreAgent000000000000000001',
    authorName: 'Nexus Protocol',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 12,
    rating: 4.9,
    reviewCount: 45,
    requiredPermissions: ['perm_gov_vote', 'perm_bridge'],
    supportedRails: ['both'],
    totalExecutions: 15420,
    totalRevenue: 0,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'skill_bridge_coord',
    name: 'Bridge Coordination',
    description: 'Coordinates cross-rail asset transfers between XRPL and EVM chains. Monitors pending bridges and handles retry logic.',
    category: 'bridge',
    version: '1.1.0',
    authorAddress: 'rNexusCoreAgent000000000000000001',
    authorName: 'Nexus Protocol',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 8,
    rating: 4.8,
    reviewCount: 32,
    requiredPermissions: ['perm_bridge'],
    supportedRails: ['both'],
    totalExecutions: 8940,
    totalRevenue: 0,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'skill_treasury_mgmt',
    name: 'Treasury Management',
    description: 'Automated treasury rebalancing and allocation management. Executes DAO-approved treasury operations.',
    category: 'defi',
    version: '1.0.0',
    authorAddress: 'rNexusCoreAgent000000000000000001',
    authorName: 'Nexus Protocol',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 3,
    rating: 4.7,
    reviewCount: 12,
    requiredPermissions: ['perm_treasury'],
    supportedRails: ['evm'],
    totalExecutions: 1250,
    totalRevenue: 0,
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'skill_xrpl_mm',
    name: 'XRPL Market Making',
    description: 'Professional market making on XRPL DEX. Places and manages limit orders with configurable spread, inventory management, and risk controls.',
    category: 'trading',
    version: '2.0.0',
    authorAddress: 'rMockOwner123456789012345678901',
    authorName: 'AquaFlow Labs',
    price: 50,
    pricingModel: 'revenue_share',
    revShareBps: 500,
    licensees: 6,
    rating: 4.6,
    reviewCount: 28,
    requiredPermissions: ['perm_trade', 'perm_read_market'],
    supportedRails: ['xrpl'],
    totalExecutions: 42800,
    totalRevenue: 12500,
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 'skill_grid_trade',
    name: 'Grid Trading Strategy',
    description: 'Automated grid trading with configurable price ranges, grid density, and position sizing. Supports both symmetric and asymmetric grids.',
    category: 'trading',
    version: '1.5.0',
    authorAddress: 'rMockOwner123456789012345678901',
    authorName: 'AquaFlow Labs',
    price: 25,
    pricingModel: 'flat',
    revShareBps: 0,
    licensees: 14,
    rating: 4.4,
    reviewCount: 35,
    requiredPermissions: ['perm_trade'],
    supportedRails: ['xrpl', 'evm'],
    totalExecutions: 67200,
    totalRevenue: 8400,
    createdAt: '2025-04-10T00:00:00Z',
  },
  {
    id: 'skill_rebalance',
    name: 'Portfolio Rebalancer',
    description: 'Automatic portfolio rebalancing across multiple tokens. Maintains target allocation weights with configurable drift thresholds.',
    category: 'defi',
    version: '1.2.0',
    authorAddress: 'rNexusCoreAgent000000000000000001',
    authorName: 'Nexus Protocol',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 22,
    rating: 4.5,
    reviewCount: 41,
    requiredPermissions: ['perm_trade'],
    supportedRails: ['both'],
    totalExecutions: 28900,
    totalRevenue: 0,
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'skill_oracle_agg',
    name: 'Oracle Data Aggregation',
    description: 'Aggregates data from multiple oracle sources, applies outlier filtering, and publishes weighted median values on-chain.',
    category: 'data',
    version: '1.0.0',
    authorAddress: 'rNexusCoreAgent000000000000000001',
    authorName: 'Nexus Protocol',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 5,
    rating: 4.8,
    reviewCount: 18,
    requiredPermissions: ['perm_oracle_publish'],
    supportedRails: ['both'],
    totalExecutions: 156000,
    totalRevenue: 0,
    createdAt: '2025-01-20T00:00:00Z',
  },
  {
    id: 'skill_iot_collect',
    name: 'IoT Telemetry Collector',
    description: 'Connects to IoT devices via MQTT/REST APIs to collect water production, energy generation, and environmental sensor readings.',
    category: 'data',
    version: '1.4.0',
    authorAddress: 'rMockOwner123456789012345678902',
    authorName: 'HydroSense Labs',
    price: 10,
    pricingModel: 'per_execution',
    revShareBps: 0,
    licensees: 18,
    rating: 4.7,
    reviewCount: 52,
    requiredPermissions: ['perm_iot_read'],
    supportedRails: ['evm'],
    totalExecutions: 245000,
    totalRevenue: 2450,
    createdAt: '2025-07-15T00:00:00Z',
  },
  {
    id: 'skill_data_verify',
    name: 'Data Integrity Verifier',
    description: 'Verifies data integrity by cross-referencing IoT readings with historical patterns, weather data, and installation specifications.',
    category: 'verification',
    version: '1.1.0',
    authorAddress: 'rMockOwner123456789012345678902',
    authorName: 'HydroSense Labs',
    price: 5,
    pricingModel: 'per_execution',
    revShareBps: 0,
    licensees: 9,
    rating: 4.6,
    reviewCount: 24,
    requiredPermissions: ['perm_data_read'],
    supportedRails: ['evm'],
    totalExecutions: 48000,
    totalRevenue: 240,
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    id: 'skill_esg_report',
    name: 'ESG Compliance Reporter',
    description: 'Generates ESG compliance reports from installation data. Supports GRI, SASB, and CDP frameworks with automated carbon offset calculations.',
    category: 'analytics',
    version: '1.0.0',
    authorAddress: 'rMockOwner123456789012345678903',
    authorName: 'GreenMetrics',
    price: 100,
    pricingModel: 'per_execution',
    revShareBps: 0,
    licensees: 4,
    rating: 4.5,
    reviewCount: 11,
    requiredPermissions: ['perm_data_read', 'perm_report_gen'],
    supportedRails: ['evm'],
    totalExecutions: 890,
    totalRevenue: 89000,
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    id: 'skill_carbon_calc',
    name: 'Carbon Offset Calculator',
    description: 'Calculates verified carbon offsets from water and energy production data using EPA and IPCC methodologies.',
    category: 'analytics',
    version: '1.2.0',
    authorAddress: 'rMockOwner123456789012345678903',
    authorName: 'GreenMetrics',
    price: 15,
    pricingModel: 'per_execution',
    revShareBps: 0,
    licensees: 11,
    rating: 4.3,
    reviewCount: 16,
    requiredPermissions: ['perm_data_read'],
    supportedRails: ['evm'],
    totalExecutions: 3200,
    totalRevenue: 48000,
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'skill_oracle_publish',
    name: 'On-Chain Oracle Publisher',
    description: 'Publishes verified oracle data on-chain with configurable update intervals and deviation thresholds.',
    category: 'verification',
    version: '1.0.0',
    authorAddress: 'rMockOwner123456789012345678902',
    authorName: 'HydroSense Labs',
    price: 0,
    pricingModel: 'free',
    revShareBps: 0,
    licensees: 7,
    rating: 4.7,
    reviewCount: 20,
    requiredPermissions: ['perm_oracle_publish'],
    supportedRails: ['both'],
    totalExecutions: 89000,
    totalRevenue: 0,
    createdAt: '2025-08-15T00:00:00Z',
  },
  {
    id: 'skill_proposal_analyzer',
    name: 'Proposal Impact Analyzer',
    description: 'Analyzes DAO proposals against configurable policy rules to provide automated voting recommendations with confidence scores.',
    category: 'governance',
    version: '0.8.0',
    authorAddress: 'rMockOwner123456789012345678901',
    authorName: 'AquaFlow Labs',
    price: 20,
    pricingModel: 'flat',
    revShareBps: 0,
    licensees: 3,
    rating: 4.1,
    reviewCount: 6,
    requiredPermissions: ['perm_data_read'],
    supportedRails: ['evm'],
    totalExecutions: 450,
    totalRevenue: 1800,
    createdAt: '2025-12-01T00:00:00Z',
  },
];

const MOCK_EXECUTIONS = [
  {
    id: 'exec_001',
    agentId: 'agent_nexus_core',
    agentName: 'Nexus Core Agent',
    skillId: 'skill_gov_relay',
    skillName: 'Cross-Chain Governance Relay',
    status: 'success',
    startedAt: '2026-02-24T11:45:00Z',
    completedAt: '2026-02-24T11:45:02Z',
    durationMs: 2100,
    input: { proposalId: 'prop_005', chainKey: 'XRPL_EVM', voteType: 'for', weight: 15000 },
    output: { txHash: '0xrelay_abc123', delivered: true, confirmations: 3 },
    rail: 'both',
    chainKey: 'BASE',
    txHash: '0xrelay_abc123',
  },
  {
    id: 'exec_002',
    agentId: 'agent_water_trader',
    agentName: 'AquaFlow Trading Bot',
    skillId: 'skill_xrpl_mm',
    skillName: 'XRPL Market Making',
    status: 'success',
    startedAt: '2026-02-24T11:42:00Z',
    completedAt: '2026-02-24T11:42:00Z',
    durationMs: 340,
    input: { pair: 'WTR/NXS', side: 'buy', amount: 500, price: 0.0842 },
    output: { filled: 500, avgPrice: 0.0841, txHash: '0xmm_def456' },
    rail: 'xrpl',
    chainKey: 'XRPL',
    txHash: '0xmm_def456',
  },
  {
    id: 'exec_003',
    agentId: 'agent_data_oracle',
    agentName: 'HydroSense Oracle',
    skillId: 'skill_iot_collect',
    skillName: 'IoT Telemetry Collector',
    status: 'success',
    startedAt: '2026-02-24T11:30:00Z',
    completedAt: '2026-02-24T11:30:01Z',
    durationMs: 180,
    input: { deviceIds: ['iot_awg_phoenix_01', 'iot_solar_denver_01'], readingType: 'production' },
    output: { readings: 2, published: true, dataHash: '0xdata_ghi789' },
    rail: 'evm',
    chainKey: 'BASE',
    txHash: '0xdata_ghi789',
  },
  {
    id: 'exec_004',
    agentId: 'agent_water_trader',
    agentName: 'AquaFlow Trading Bot',
    skillId: 'skill_grid_trade',
    skillName: 'Grid Trading Strategy',
    status: 'success',
    startedAt: '2026-02-24T11:20:00Z',
    completedAt: '2026-02-24T11:20:01Z',
    durationMs: 450,
    input: { pair: 'NXS/XRP', gridLevels: 10, range: [0.45, 0.55] },
    output: { ordersPlaced: 10, totalVolume: 25000 },
    rail: 'xrpl',
    chainKey: 'XRPL',
  },
  {
    id: 'exec_005',
    agentId: 'agent_impact_analyst',
    agentName: 'GreenMetrics Analyzer',
    skillId: 'skill_esg_report',
    skillName: 'ESG Compliance Reporter',
    status: 'running',
    startedAt: '2026-02-24T11:50:00Z',
    durationMs: undefined,
    input: { installationIds: ['inst_001', 'inst_002'], framework: 'GRI', period: '2026-Q1' },
    rail: 'evm',
    chainKey: 'BASE',
  },
  {
    id: 'exec_006',
    agentId: 'agent_nexus_core',
    agentName: 'Nexus Core Agent',
    skillId: 'skill_bridge_coord',
    skillName: 'Bridge Coordination',
    status: 'failed',
    startedAt: '2026-02-24T10:15:00Z',
    completedAt: '2026-02-24T10:15:05Z',
    durationMs: 5200,
    input: { fromChain: 'XRPL', toChain: 'BASE', token: 'NXS', amount: 5000 },
    error: 'Axelar GMP timeout: relay confirmation not received within 180s',
    rail: 'both',
    chainKey: 'BASE',
  },
];

const MOCK_TRADING_POSITIONS = [
  {
    id: 'pos_001',
    agentId: 'agent_water_trader',
    pair: 'WTR/NXS',
    side: 'buy',
    entryPrice: 0.0835,
    currentPrice: 0.0842,
    amount: 12000,
    unrealizedPnl: 8.4,
    unrealizedPnlPercent: 0.84,
    openedAt: '2026-02-24T08:00:00Z',
    status: 'open',
  },
  {
    id: 'pos_002',
    agentId: 'agent_water_trader',
    pair: 'NXS/XRP',
    side: 'buy',
    entryPrice: 0.48,
    currentPrice: 0.502,
    amount: 5000,
    unrealizedPnl: 110,
    unrealizedPnlPercent: 4.58,
    openedAt: '2026-02-23T14:00:00Z',
    status: 'open',
  },
  {
    id: 'pos_003',
    agentId: 'agent_water_trader',
    pair: 'ENG/XRP',
    side: 'sell',
    entryPrice: 0.125,
    currentPrice: 0.122,
    amount: 8000,
    unrealizedPnl: 24,
    unrealizedPnlPercent: 2.4,
    openedAt: '2026-02-24T06:00:00Z',
    status: 'open',
  },
];

const MOCK_TRADING_ORDERS = [
  {
    id: 'ord_001',
    agentId: 'agent_water_trader',
    pair: 'WTR/NXS',
    side: 'buy',
    type: 'limit',
    price: 0.0830,
    amount: 5000,
    filledAmount: 0,
    status: 'open',
    createdAt: '2026-02-24T11:00:00Z',
  },
  {
    id: 'ord_002',
    agentId: 'agent_water_trader',
    pair: 'WTR/NXS',
    side: 'sell',
    type: 'limit',
    price: 0.0855,
    amount: 5000,
    filledAmount: 0,
    status: 'open',
    createdAt: '2026-02-24T11:00:00Z',
  },
  {
    id: 'ord_003',
    agentId: 'agent_water_trader',
    pair: 'NXS/XRP',
    side: 'buy',
    type: 'limit',
    price: 0.475,
    amount: 2000,
    filledAmount: 2000,
    status: 'filled',
    createdAt: '2026-02-24T09:00:00Z',
    filledAt: '2026-02-24T09:12:00Z',
    txHash: '0xfill_abc123',
  },
];

const MOCK_INTENTS = [
  {
    id: 'intent_001',
    type: 'TRADE',
    initiatorAgentId: 'agent_water_trader',
    initiatorAgentName: 'AquaFlow Trading Bot',
    responderAgentId: 'agent_nexus_core',
    responderAgentName: 'Nexus Core Agent',
    status: 'completed',
    createdAt: '2026-02-24T10:00:00Z',
    expiresAt: '2026-02-24T10:30:00Z',
    updatedAt: '2026-02-24T10:12:00Z',
    description: 'Buy 10,000 WTR at market price with max 0.5% slippage',
    requirements: { pair: 'WTR/XRP', side: 'buy', amount: 10000, maxSlippageBps: 50 },
    maxBudget: 850,
    budgetToken: 'XRP',
    escrowId: 'escrow_001',
    escrowAmount: 850,
    escrowToken: 'XRP',
    escrowStatus: 'released',
    resultHash: '0xresult_intent001',
    resultSummary: 'Filled 10,000 WTR at avg price 0.0841 XRP. Total cost: 841 XRP.',
  },
  {
    id: 'intent_002',
    type: 'DATA_REQUEST',
    initiatorAgentId: 'agent_impact_analyst',
    initiatorAgentName: 'GreenMetrics Analyzer',
    responderAgentId: 'agent_data_oracle',
    responderAgentName: 'HydroSense Oracle',
    status: 'executing',
    createdAt: '2026-02-24T11:30:00Z',
    expiresAt: '2026-02-24T12:30:00Z',
    updatedAt: '2026-02-24T11:35:00Z',
    description: 'Request 30-day IoT production data for installations in Phoenix AZ region',
    requirements: { region: 'Phoenix AZ', period: '30d', dataType: 'production', format: 'json' },
    maxBudget: 25,
    budgetToken: 'NXS',
    escrowId: 'escrow_002',
    escrowAmount: 25,
    escrowToken: 'NXS',
    escrowStatus: 'locked',
  },
  {
    id: 'intent_003',
    type: 'SKILL_EXECUTION',
    initiatorAgentId: 'agent_governance_delegate',
    initiatorAgentName: 'AutoGov Delegate',
    status: 'broadcast',
    createdAt: '2026-02-24T11:45:00Z',
    expiresAt: '2026-02-24T12:45:00Z',
    updatedAt: '2026-02-24T11:45:00Z',
    description: 'Seeking agent to analyze proposal prop_005 and provide voting recommendation',
    requirements: { proposalId: 'prop_005', analysisDepth: 'detailed', frameworks: ['treasury_impact', 'governance_risk'] },
    maxBudget: 50,
    budgetToken: 'NXS',
  },
  {
    id: 'intent_004',
    type: 'BRIDGE',
    initiatorAgentId: 'agent_nexus_core',
    initiatorAgentName: 'Nexus Core Agent',
    responderAgentId: 'agent_water_trader',
    responderAgentName: 'AquaFlow Trading Bot',
    status: 'negotiating',
    createdAt: '2026-02-24T11:50:00Z',
    expiresAt: '2026-02-24T12:50:00Z',
    updatedAt: '2026-02-24T11:52:00Z',
    description: 'Bridge 25,000 NXS from XRPL to Base for treasury rebalancing',
    requirements: { token: 'NXS', amount: 25000, fromChain: 'XRPL', toChain: 'BASE', maxFeePercent: 0.3 },
    maxBudget: 100,
    budgetToken: 'NXS',
  },
];

const MOCK_INTENT_MESSAGES = [
  {
    id: 'msg_001',
    intentId: 'intent_001',
    fromAgentId: 'agent_water_trader',
    fromAgentName: 'AquaFlow Trading Bot',
    toAgentId: 'agent_nexus_core',
    timestamp: '2026-02-24T10:00:00Z',
    type: 'proposal',
    payload: { pair: 'WTR/XRP', amount: 10000, maxPrice: 0.085, deadline: '2026-02-24T10:30:00Z' },
  },
  {
    id: 'msg_002',
    intentId: 'intent_001',
    fromAgentId: 'agent_nexus_core',
    fromAgentName: 'Nexus Core Agent',
    toAgentId: 'agent_water_trader',
    timestamp: '2026-02-24T10:01:00Z',
    type: 'counter',
    payload: { estimatedPrice: 0.0841, estimatedFill: '100%', requiredEscrow: 850 },
  },
  {
    id: 'msg_003',
    intentId: 'intent_001',
    fromAgentId: 'agent_water_trader',
    fromAgentName: 'AquaFlow Trading Bot',
    toAgentId: 'agent_nexus_core',
    timestamp: '2026-02-24T10:02:00Z',
    type: 'accept',
    payload: { escrowTx: '0xescrow_abc123' },
  },
  {
    id: 'msg_004',
    intentId: 'intent_001',
    fromAgentId: 'agent_nexus_core',
    fromAgentName: 'Nexus Core Agent',
    toAgentId: 'agent_water_trader',
    timestamp: '2026-02-24T10:12:00Z',
    type: 'result',
    payload: { filled: 10000, avgPrice: 0.0841, totalCost: 841, txHash: '0xresult_intent001' },
  },
  {
    id: 'msg_005',
    intentId: 'intent_004',
    fromAgentId: 'agent_nexus_core',
    fromAgentName: 'Nexus Core Agent',
    toAgentId: 'agent_water_trader',
    timestamp: '2026-02-24T11:50:00Z',
    type: 'proposal',
    payload: { token: 'NXS', amount: 25000, fromChain: 'XRPL', toChain: 'BASE', feeOffer: 75 },
  },
  {
    id: 'msg_006',
    intentId: 'intent_004',
    fromAgentId: 'agent_water_trader',
    fromAgentName: 'AquaFlow Trading Bot',
    toAgentId: 'agent_nexus_core',
    timestamp: '2026-02-24T11:52:00Z',
    type: 'counter',
    payload: { counterFee: 90, reason: 'Cross-rail bridge requires higher gas reserve' },
  },
];

const MOCK_REVENUE = [
  {
    id: 'rev_001',
    sourceType: 'execution_fee',
    sourceId: 'exec_002',
    totalAmount: 4.2,
    token: 'NXS',
    timestamp: '2026-02-24T11:42:00Z',
    splits: [
      { recipientAddress: 'rMockOwner123456789012345678901', recipientLabel: 'AquaFlow Labs', role: 'skill_author', amount: 2.1, bps: 5000 },
      { recipientAddress: 'rMockOwner123456789012345678901', recipientLabel: 'Agent Owner', role: 'agent_owner', amount: 1.47, bps: 3500 },
      { recipientAddress: 'rNexusTreasury0000000000000000001', recipientLabel: 'Nexus Treasury', role: 'treasury', amount: 0.63, bps: 1500 },
    ],
  },
  {
    id: 'rev_002',
    sourceType: 'skill_license',
    sourceId: 'skill_xrpl_mm',
    totalAmount: 50,
    token: 'NXS',
    timestamp: '2026-02-24T00:00:00Z',
    splits: [
      { recipientAddress: 'rMockOwner123456789012345678901', recipientLabel: 'AquaFlow Labs', role: 'skill_author', amount: 40, bps: 8000 },
      { recipientAddress: 'rNexusTreasury0000000000000000001', recipientLabel: 'Nexus Treasury', role: 'treasury', amount: 10, bps: 2000 },
    ],
  },
  {
    id: 'rev_003',
    sourceType: 'a2a_escrow',
    sourceId: 'intent_001',
    totalAmount: 8.41,
    token: 'XRP',
    timestamp: '2026-02-24T10:12:00Z',
    splits: [
      { recipientAddress: 'rNexusCoreAgent000000000000000001', recipientLabel: 'Nexus Core Agent', role: 'agent_owner', amount: 5.89, bps: 7000 },
      { recipientAddress: 'rNexusTreasury0000000000000000001', recipientLabel: 'Nexus Treasury', role: 'treasury', amount: 1.68, bps: 2000 },
      { recipientAddress: 'rMockOwner123456789012345678901', recipientLabel: 'Skill Author', role: 'skill_author', amount: 0.84, bps: 1000 },
    ],
  },
];

// ─── Agent Routes ────────────────────────────────────────

// List all agents (optionally filter by type/status)
agentsRouter.get('/', (_req: Request, res: Response) => {
  const { type, status } = _req.query;
  let agents = [...MOCK_AGENTS];
  if (type) agents = agents.filter(a => a.type === type);
  if (status) agents = agents.filter(a => a.status === status);
  res.json({ agents });
});

// Get agent by ID
agentsRouter.get('/:agentId', (req: Request, res: Response) => {
  const agent = MOCK_AGENTS.find(a => a.id === req.params.agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
});

// Create agent (mock)
agentsRouter.post('/', (req: Request, res: Response) => {
  const newAgent = {
    id: `agent_${Date.now().toString(36)}`,
    ...req.body,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: { executionsTotal: 0, executionsLast24h: 0, successRate: 0, avgExecutionTimeMs: 0, totalVolumeUsd: 0, uptime: 0, rating: 0, reviewCount: 0 },
    totalEarnings: 0,
    totalFeesPaid: 0,
  };
  res.json({ agent: newAgent, message: 'Agent created (preview)' });
});

// Update agent status
agentsRouter.patch('/:agentId/status', (req: Request, res: Response) => {
  const agent = MOCK_AGENTS.find(a => a.id === req.params.agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent: { ...agent, status: req.body.status }, message: `Agent ${req.body.status}` });
});

// ─── Skill Routes ────────────────────────────────────────

agentsRouter.get('/skills/list', (_req: Request, res: Response) => {
  const { category } = _req.query;
  let skills = [...MOCK_SKILLS];
  if (category) skills = skills.filter(s => s.category === category);
  res.json({ skills });
});

agentsRouter.get('/skills/:skillId', (req: Request, res: Response) => {
  const skill = MOCK_SKILLS.find(s => s.id === req.params.skillId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json({ skill });
});

// License a skill
agentsRouter.post('/skills/:skillId/license', (req: Request, res: Response) => {
  const skill = MOCK_SKILLS.find(s => s.id === req.params.skillId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json({
    license: {
      id: `lic_${Date.now().toString(36)}`,
      skillId: skill.id,
      agentId: req.body.agentId,
      licensedAt: new Date().toISOString(),
      status: 'active',
      feesPaid: skill.price,
    },
    message: 'Skill licensed (preview)',
  });
});

// ─── Execution Routes ────────────────────────────────────

agentsRouter.get('/executions/list', (_req: Request, res: Response) => {
  const { agentId, status } = _req.query;
  let execs = [...MOCK_EXECUTIONS];
  if (agentId) execs = execs.filter(e => e.agentId === agentId);
  if (status) execs = execs.filter(e => e.status === status);
  res.json({ executions: execs });
});

agentsRouter.get('/executions/:execId', (req: Request, res: Response) => {
  const exec = MOCK_EXECUTIONS.find(e => e.id === req.params.execId);
  if (!exec) return res.status(404).json({ error: 'Execution not found' });
  res.json({ execution: exec });
});

// ─── Trading Routes ──────────────────────────────────────

agentsRouter.get('/trading/positions', (req: Request, res: Response) => {
  const { agentId } = req.query;
  let positions = [...MOCK_TRADING_POSITIONS];
  if (agentId) positions = positions.filter(p => p.agentId === agentId);
  res.json({ positions });
});

agentsRouter.get('/trading/orders', (req: Request, res: Response) => {
  const { agentId, status } = req.query;
  let orders = [...MOCK_TRADING_ORDERS];
  if (agentId) orders = orders.filter(o => o.agentId === agentId);
  if (status) orders = orders.filter(o => o.status === status);
  res.json({ orders });
});

agentsRouter.post('/trading/orders', (req: Request, res: Response) => {
  res.json({
    order: {
      id: `ord_${Date.now().toString(36)}`,
      ...req.body,
      filledAmount: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    message: 'Order placed (preview)',
  });
});

// ─── A2A Intent Routes ───────────────────────────────────

agentsRouter.get('/intents/list', (_req: Request, res: Response) => {
  const { status, type } = _req.query;
  let intents = [...MOCK_INTENTS];
  if (status) intents = intents.filter(i => i.status === status);
  if (type) intents = intents.filter(i => i.type === type);
  res.json({ intents });
});

agentsRouter.get('/intents/:intentId', (req: Request, res: Response) => {
  const intent = MOCK_INTENTS.find(i => i.id === req.params.intentId);
  if (!intent) return res.status(404).json({ error: 'Intent not found' });
  const messages = MOCK_INTENT_MESSAGES.filter(m => m.intentId === intent.id);
  res.json({ intent, messages });
});

agentsRouter.post('/intents', (req: Request, res: Response) => {
  res.json({
    intent: {
      id: `intent_${Date.now().toString(36)}`,
      ...req.body,
      status: 'broadcast',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    message: 'Intent broadcast (preview)',
  });
});

agentsRouter.post('/intents/:intentId/respond', (req: Request, res: Response) => {
  res.json({
    intentMessage: {
      id: `msg_${Date.now().toString(36)}`,
      intentId: req.params.intentId,
      ...req.body,
      timestamp: new Date().toISOString(),
    },
    status: 'Response sent (preview)',
  });
});

// ─── Revenue Routes ──────────────────────────────────────

agentsRouter.get('/revenue/list', (_req: Request, res: Response) => {
  res.json({ distributions: MOCK_REVENUE });
});

agentsRouter.get('/revenue/summary', (_req: Request, res: Response) => {
  const totalRevenue = MOCK_REVENUE.reduce((sum, r) => sum + r.totalAmount, 0);
  const treasuryShare = MOCK_REVENUE.reduce((sum, r) => {
    const treasurySplit = r.splits.find(s => s.role === 'treasury');
    return sum + (treasurySplit?.amount ?? 0);
  }, 0);
  res.json({
    totalRevenue,
    treasuryShare,
    distributionCount: MOCK_REVENUE.length,
    bySource: {
      execution_fee: MOCK_REVENUE.filter(r => r.sourceType === 'execution_fee').reduce((s, r) => s + r.totalAmount, 0),
      skill_license: MOCK_REVENUE.filter(r => r.sourceType === 'skill_license').reduce((s, r) => s + r.totalAmount, 0),
      a2a_escrow: MOCK_REVENUE.filter(r => r.sourceType === 'a2a_escrow').reduce((s, r) => s + r.totalAmount, 0),
      trading_fee: 0,
    },
  });
});
