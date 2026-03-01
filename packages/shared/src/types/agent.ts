/**
 * Agent Layer Types — Nexus Agent System
 *
 * Covers: Agent definitions, Skills, Marketplace, Execution,
 * Trading Engine, Revenue Routing, A2A Intents, Escrow.
 */

// ─── Agent Types ─────────────────────────────────────────

export type AgentType =
  | 'NEXUS_CORE'    // Built-in system agent
  | 'USER'          // User-created custom agent
  | 'INSTITUTION'   // Institutional/professional agent
  | 'TRADING'       // Specialized trading bot
  | 'DATA'          // Data aggregation/analysis agent
  | 'ORACLE';       // Oracle/verification agent

export type AgentStatus = 'active' | 'paused' | 'suspended' | 'draft';

export type AgentRail = 'xrpl' | 'evm' | 'both';

export interface AgentWallet {
  rail: AgentRail;
  address: string;
  chainKey: string;
  balance: Record<string, number>; // token -> amount
}

export interface AgentPermission {
  id: string;
  label: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  granted: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  ownerAddress: string;
  description: string;
  avatar?: string;
  version: string;
  createdAt: string;
  updatedAt: string;

  // Capabilities
  rail: AgentRail;
  wallets: AgentWallet[];
  skills: string[];           // skill IDs
  permissions: AgentPermission[];

  // Performance
  stats: AgentStats;

  // Revenue
  revenueShareBps: number;    // basis points to Nexus treasury
  totalEarnings: number;
  totalFeesPaid: number;
}

export interface AgentStats {
  executionsTotal: number;
  executionsLast24h: number;
  successRate: number;         // 0-1
  avgExecutionTimeMs: number;
  totalVolumeUsd: number;
  uptime: number;              // 0-1
  rating: number;              // 0-5
  reviewCount: number;
}

// ─── Skills ──────────────────────────────────────────────

export type SkillCategory =
  | 'trading'
  | 'data'
  | 'governance'
  | 'defi'
  | 'analytics'
  | 'automation'
  | 'verification'
  | 'bridge';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  authorAddress: string;
  authorName: string;

  // Marketplace
  price: number;               // NXS per month license
  pricingModel: 'free' | 'flat' | 'per_execution' | 'revenue_share';
  revShareBps: number;         // for revenue_share model
  licensees: number;           // number of agents using this skill
  rating: number;
  reviewCount: number;

  // Technical
  requiredPermissions: string[];
  supportedRails: AgentRail[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;

  // Stats
  totalExecutions: number;
  totalRevenue: number;
  createdAt: string;
}

export interface AgentSkillLicense {
  id: string;
  skillId: string;
  agentId: string;
  licensedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  feesPaid: number;
}

// ─── Execution Engine ────────────────────────────────────

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  skillId: string;
  skillName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;

  // I/O
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;

  // Cost
  gasCost?: number;
  gasCostToken?: string;
  skillFee?: number;
  skillFeeToken?: string;

  // Chain
  rail: AgentRail;
  chainKey?: string;
  txHash?: string;
}

// ─── Trading Engine ──────────────────────────────────────

export type TradingStrategy =
  | 'market_maker'
  | 'arbitrage'
  | 'dca'
  | 'grid'
  | 'momentum'
  | 'rebalance';

export interface TradingConfig {
  strategy: TradingStrategy;
  pair: string;               // e.g. "NXS/XRP"
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDailyTrades: number;
  maxSlippageBps: number;
  enabled: boolean;
}

export interface TradingPosition {
  id: string;
  agentId: string;
  pair: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: string;
  status: 'open' | 'closed' | 'liquidated';
}

export interface TradingOrder {
  id: string;
  agentId: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  price?: number;
  amount: number;
  filledAmount: number;
  status: 'open' | 'filled' | 'partial' | 'cancelled';
  createdAt: string;
  filledAt?: string;
  txHash?: string;
}

// ─── A2A Intent Protocol ─────────────────────────────────

export type IntentType =
  | 'TRADE'
  | 'DATA_REQUEST'
  | 'SKILL_EXECUTION'
  | 'BRIDGE'
  | 'GOVERNANCE_ACTION'
  | 'CUSTOM';

export type IntentStatus =
  | 'broadcast'
  | 'negotiating'
  | 'accepted'
  | 'escrowed'
  | 'executing'
  | 'completed'
  | 'disputed'
  | 'expired'
  | 'cancelled';

export interface AgentIntent {
  id: string;
  type: IntentType;
  initiatorAgentId: string;
  initiatorAgentName: string;
  responderAgentId?: string;
  responderAgentName?: string;
  status: IntentStatus;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;

  // Intent payload
  description: string;
  requirements: Record<string, unknown>;
  maxBudget: number;
  budgetToken: string;

  // Escrow
  escrowId?: string;
  escrowAmount?: number;
  escrowToken?: string;
  escrowStatus?: 'locked' | 'released' | 'refunded' | 'disputed';

  // Result
  resultHash?: string;
  resultSummary?: string;
}

export interface IntentMessage {
  id: string;
  intentId: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  timestamp: string;
  type: 'proposal' | 'counter' | 'accept' | 'reject' | 'info' | 'result';
  payload: Record<string, unknown>;
  signature?: string;
}

// ─── Revenue Routing ─────────────────────────────────────

export interface RevenueDistribution {
  id: string;
  sourceType: 'skill_license' | 'execution_fee' | 'trading_fee' | 'a2a_escrow';
  sourceId: string;
  totalAmount: number;
  token: string;
  timestamp: string;
  splits: RevenueSplit[];
}

export interface RevenueSplit {
  recipientAddress: string;
  recipientLabel: string;
  role: 'skill_author' | 'agent_owner' | 'treasury' | 'operator' | 'referrer';
  amount: number;
  bps: number;
}

// ─── Escrow Contract Types ───────────────────────────────

export interface EscrowRecord {
  escrowId: string;
  intentId: string;
  depositor: string;
  beneficiary: string;
  arbiter: string;
  token: string;
  amount: number;
  status: 'active' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  resolvedAt?: string;
  txHash?: string;
}

// ─── Agent Marketplace ───────────────────────────────────

export interface AgentMarketplaceEntry {
  agent: Agent;
  featured: boolean;
  category: AgentType;
  tags: string[];
  installCount: number;
  monthlyActiveUsers: number;
}

export interface SkillMarketplaceEntry {
  skill: AgentSkill;
  featured: boolean;
  trending: boolean;
  tags: string[];
}
