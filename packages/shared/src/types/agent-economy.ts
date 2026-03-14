/**
 * Agent Economy Types — Nexus Agent Economy + RFQ Negotiation + Trust/Reputation
 *
 * Covers all three layers:
 * 1) Environmental Asset Market + Skills Marketplace
 * 2) Agent-to-Agent Negotiation + RFQ + Escrow
 * 3) Reputation + Trust Scoring + Autonomous Bots
 */

// ─── Agent Economy Core ────────────────────────────────────

export type EconAgentType = 'NEXUS' | 'PARTNER' | 'THIRD_PARTY';
export type EconAgentStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationLevel = 'UNVERIFIED' | 'VERIFIED' | 'PREMIUM';

export interface EconAgent {
  id: string;
  name: string;
  type: EconAgentType;
  status: EconAgentStatus;
  verificationLevel: VerificationLevel;
  description: string;
  endpoints: Record<string, string>;
  pubkeys: Record<string, string>;
  reputationScore: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// ─── Skills ────────────────────────────────────────────────

export type EconSkillCategory = 'VERIFICATION' | 'SETTLEMENT' | 'SCORING' | 'ORACLE' | 'COMPLIANCE' | 'UTILITY';
export type PricingModel = 'PER_CALL' | 'PER_DOC' | 'PER_1K_EVENTS' | 'SUBSCRIPTION' | 'SUCCESS_FEE';
export type MeterUnit = 'TOKENS' | 'CPU_MS' | 'GPU_MS' | 'DOC_PAGES' | 'EVENTS';
export type ListingVisibility = 'PUBLIC' | 'PARTNER_ONLY' | 'PRIVATE';

export interface EconSkill {
  id: string;
  agentId: string;
  slug: string;
  name: string;
  description: string;
  category: EconSkillCategory;
  pricingModel: PricingModel;
  basePrice: number;
  successFeeBps: number;
  meterUnit: MeterUnit;
  enabled: boolean;
  policyTags: Record<string, unknown>;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillListing {
  id: string;
  skillId: string;
  visibility: ListingVisibility;
  allowedDomains: string[];
  allowedCallers: string[];
  tags: string[];
  featuredRank: number;
}

// ─── Permits + Quotes ──────────────────────────────────────

export type PermitStatus = 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
export type PaymentMode = 'PREPAID' | 'ESCROW';

export interface EconQuote {
  id: string;
  callerAgentId: string;
  skillId: string;
  inputSummary: Record<string, unknown>;
  estimatedUnits: number;
  estimatedCost: number;
  currency: 'RLUSD' | 'XRP' | 'NXS';
  expiresAt: string;
  createdAt: string;
}

export interface EconPermit {
  id: string;
  callerAgentId: string;
  skillId: string;
  quoteId: string;
  expiresAt: string;
  maxUnits: number;
  maxCost: number;
  paymentMode: PaymentMode;
  status: PermitStatus;
  signature: string;
  createdAt: string;
}

// ─── Execution ─────────────────────────────────────────────

export type EconExecutionStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface EconExecution {
  id: string;
  permitId: string;
  callerAgentId: string;
  sellerAgentId: string;
  skillId: string;
  status: EconExecutionStatus;
  unitsUsed: number;
  costFinal: number;
  resultRef: string;
  startedAt: string;
  finishedAt?: string;
}

// ─── Receipt (Unified) ────────────────────────────────────

export type ReceiptType = 'SKILL_CALL' | 'TRADE' | 'REDEEM' | 'RETIRE' | 'CERTIFICATE' | 'AUDIT_PACK' | 'NEGOTIATION';

export interface EconReceipt {
  id: string;
  type: ReceiptType;
  subject: Record<string, unknown>;
  proofs: Record<string, unknown>;
  policy: Record<string, unknown>;
  financials: {
    totalCost: number;
    platformFee: number;
    sellerPayout: number;
    receiptFee: number;
    settlementFee: number;
    currency: string;
    splits: Array<{ label: string; amount: number; bps: number }>;
  };
  signatures: Record<string, string>;
  trustContext?: {
    callerTier: string;
    counterpartyTier: string;
    trustScoreAtTime: number;
    reasonSummary: string;
  };
  riskContext?: {
    fraudFlags: number;
    disputeCount: number;
  };
  botContext?: {
    botId: string;
    botName: string;
    recommendation: string;
  };
  createdAt: string;
}

// ─── Wallet + Balance ──────────────────────────────────────

export type OwnerType = 'USER' | 'AGENT';
export type AssetSymbol = 'RLUSD' | 'XRP' | 'NXS' | 'WTR' | 'ENG';

export interface WalletAccount {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  chain: 'XRPL' | 'EVM';
  address: string;
  domain: 'retail' | 'utility' | 'enterprise';
  kycTier: number;
  createdAt: string;
}

export interface BalanceLedger {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  asset: AssetSymbol;
  available: number;
  locked: number;
  updatedAt: string;
}

// ─── Fee Config ────────────────────────────────────────────

export interface FeeConfig {
  id: string;
  platformTakeRateBps: number;
  settlementFeeBps: number;
  receiptFlatFee: number;
  minFee: number;
  updatedAt: string;
}

// ─── Environmental Assets ──────────────────────────────────

export type AssetKind = 'MPT' | 'IOU' | 'NFT' | 'NATIVE';
export type TransferPolicy = 'OPEN' | 'PERMISSIONED' | 'NON_TRANSFERABLE';

export interface EnvAsset {
  id: string;
  symbol: AssetSymbol;
  kind: AssetKind;
  transferPolicy: TransferPolicy;
  chain: 'XRPL' | 'EVM' | 'BOTH';
  decimals: number;
  metadata: Record<string, unknown>;
}

// ─── Trade + Retirement ────────────────────────────────────

export type TradeStatus = 'QUOTED' | 'SUBMITTED' | 'FILLED' | 'FAILED';
export type RoutePreference = 'BEST' | 'XRPL_ONLY' | 'EVM_ONLY';

export interface TradeIntent {
  id: string;
  callerAgentId: string;
  fromAssetId: string;
  toAssetId: string;
  amountIn: number;
  slippageBps: number;
  routePreference: RoutePreference;
  status: TradeStatus;
  quote: Record<string, unknown>;
  txRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RetirementIntent {
  id: string;
  callerAgentId: string;
  assetId: string;
  amount: number;
  beneficiary: { name: string; reason: string };
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  proofs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// RFQ + NEGOTIATION (Prompt 2)
// ═══════════════════════════════════════════════════════════

export type RFQCategory = 'SKILL' | 'TRADE' | 'REDEMPTION' | 'RETIREMENT';
export type RFQStatus = 'OPEN' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface RFQ {
  id: string;
  requesterAgentId: string;
  targetAgentId?: string;
  category: RFQCategory;
  subject: Record<string, unknown>;
  status: RFQStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type OfferStatus = 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';

export interface Offer {
  id: string;
  rfqId: string;
  senderAgentId: string;
  terms: {
    price: number;
    currency: string;
    units: number;
    settlementType: 'ESCROW' | 'PREPAID';
    [key: string]: unknown;
  };
  status: OfferStatus;
  createdAt: string;
}

export type NegotiationMessageType = 'MESSAGE' | 'OFFER';

export interface NegotiationMessage {
  id: string;
  rfqId: string;
  senderAgentId: string;
  type: NegotiationMessageType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type EscrowStatus = 'LOCKED' | 'RELEASED' | 'REFUNDED';
export type ReleaseCondition = 'EXECUTION_SUCCESS' | 'MANUAL' | 'TIMEOUT';

export interface Escrow {
  id: string;
  rfqId: string;
  payerAgentId: string;
  payeeAgentId: string;
  asset: AssetSymbol;
  amount: number;
  status: EscrowStatus;
  releaseCondition: ReleaseCondition;
  createdAt: string;
  releasedAt?: string;
}

// ═══════════════════════════════════════════════════════════
// REPUTATION + TRUST (Prompt 3)
// ═══════════════════════════════════════════════════════════

export type RiskTier = 'A' | 'B' | 'C' | 'D';

export interface AgentReputation {
  id: string;
  agentId: string;
  trustScore: number;
  riskTier: RiskTier;
  reliabilityScore: number;
  executionSpeedScore: number;
  successScore: number;
  disputeScore: number;
  fraudRiskScore: number;
  liquidityScore: number;
  volume30d: number;
  volumeAllTime: number;
  executions30d: number;
  executionsAllTime: number;
  successRate30d: number;
  successRateAllTime: number;
  avgLatencyMs30d: number;
  avgLatencyMsAllTime: number;
  disputeRateAllTime: number;
  fraudFlags30d: number;
  fraudFlagsAllTime: number;
  lastBreakdown?: TrustBreakdown;
  lastComputedAt: string;
  updatedAt: string;
}

export interface TrustBreakdown {
  subScores: {
    reliability: number;
    success: number;
    speed: number;
    disputes: number;
    fraudRisk: number;
    liquidity: number;
  };
  weights: {
    reliability: number;
    success: number;
    speed: number;
    disputes: number;
    fraudRisk: number;
    liquidity: number;
  };
  recentEvents: Array<{ type: string; impact: number; createdAt: string }>;
  deltaSummary: string;
}

export type AgentEventType =
  | 'EXECUTION_SUCCEEDED' | 'EXECUTION_FAILED'
  | 'OFFER_ACCEPTED' | 'OFFER_REJECTED'
  | 'ESCROW_RELEASED' | 'ESCROW_REFUNDED'
  | 'TRADE_FILLED' | 'TRADE_FAILED'
  | 'FRAUD_FLAG' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentEvent {
  id: string;
  agentId: string;
  type: AgentEventType;
  severity: EventSeverity;
  subject: Record<string, unknown>;
  metrics: Record<string, unknown>;
  createdAt: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface Dispute {
  id: string;
  rfqId?: string;
  executionId?: string;
  tradeIntentId?: string;
  openedByAgentId: string;
  againstAgentId: string;
  reason: string;
  evidence: { receiptIds: string[]; logs: string[] };
  status: DisputeStatus;
  resolution?: { refundAmount: number; penaltyBps: number; notes: string };
  createdAt: string;
  resolvedAt?: string;
}

export interface AgentPolicyProfile {
  id: string;
  agentId: string;
  minCounterpartyTier: RiskTier;
  requireVerifiedCounterparty: boolean;
  maxEscrowWithoutReview: number;
  autoRejectIfFraudFlags30dAbove: number;
  allowlistAgentIds: string[];
  blocklistAgentIds: string[];
  updatedAt: string;
}

// ─── Autonomous Bots ───────────────────────────────────────

export type BotType = 'LIQUIDITY_ROUTER' | 'NEGOTIATION_ASSIST' | 'MARKET_MAKER' | 'RISK_SENTINEL';
export type BotStatus = 'ACTIVE' | 'PAUSED';
export type BotOwnerType = 'DAO' | 'NEXUS' | 'USER';

export interface AutonomousBot {
  id: string;
  botType: BotType;
  status: BotStatus;
  name: string;
  ownerType: BotOwnerType;
  ownerId?: string;
  config: Record<string, unknown>;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type BotRunStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface BotRun {
  id: string;
  botId: string;
  status: BotRunStatus;
  startedAt: string;
  finishedAt?: string;
  metrics: Record<string, unknown>;
  receiptId?: string;
}

export type BotSignalType =
  | 'RFQ_TARGET_FOUND' | 'OFFER_RECOMMENDED'
  | 'TRADE_ROUTE_RECOMMENDED' | 'RISK_ALERT'
  | 'PRICE_ANOMALY' | 'LIQUIDITY_GAP';

export type SignalSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface BotSignal {
  id: string;
  botId: string;
  type: BotSignalType;
  severity: SignalSeverity;
  payload: Record<string, unknown>;
  createdAt: string;
}
