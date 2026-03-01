/**
 * Mock data layer types for Nexus OS client generators.
 * These extend / complement @nexus/shared types for the
 * deterministic mock layer (sites, devices, readings, trades, swaps).
 */

// ─── Site Types ─────────────────────────────────────────

export type SiteType = 'AWG' | 'GREYWATER' | 'RAIN' | 'UTILITY' | 'EMERGENCY' | 'SPACE';
export type SiteStatus = 'ACTIVE' | 'MAINTENANCE' | 'PLANNED' | 'OFFLINE';

export interface SiteLocation {
  lat: number;
  lng: number;
  region: string;
  country: string;
  city: string;
}

export interface ExtendedSite {
  id: string;
  name: string;
  type: SiteType;
  status: SiteStatus;
  location: SiteLocation;
  capacityLitersPerDay: number;
  waterQuality: { tds: number; ph: number; turbidity: number };
  energy: { solarKw: number; gridKw: number; batteryPct: number };
  opex: { monthlyUsd: number; costPerLiter: number };
  compliance: { score: number; lastAudit: string; nextAudit: string };
  connectivity: { method: 'LORA' | 'CELLULAR' | 'SATELLITE' | 'WIFI'; signalPct: number; lastPing: string };
  installedAt: string;
  updatedAt: string;
}

// ─── Device Types ───────────────────────────────────────

export type DeviceStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';
export type SensorType = 'FLOW_METER' | 'TDS' | 'UV' | 'TEMP' | 'HUMIDITY' | 'PH' | 'PRESSURE';

export interface DeviceSensor {
  type: SensorType;
  unit: string;
  lastValue: number;
  lastReadAt: string;
}

export interface SiteDevice {
  id: string;
  siteId: string;
  name: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  status: DeviceStatus;
  sensors: DeviceSensor[];
  calibratedAt: string;
  installedAt: string;
}

// ─── Reading Types ──────────────────────────────────────

export interface HourlyReading {
  siteId: string;
  ts: string;
  liters: number;
  tds: number;
  tempC: number;
  anomaly: boolean;
}

export interface DailyAggregate {
  siteId: string;
  date: string;
  totalLiters: number;
  avgTds: number;
  avgTempC: number;
  peakLitersHr: number;
  anomalyCount: number;
}

// ─── Batch Types ────────────────────────────────────────

export type BatchTicker = 'WTR' | 'ENG';
export type BatchStatus = 'ACTIVE' | 'RETIRED' | 'PENDING' | 'CANCELLED';

export interface MockBatch {
  id: string;
  ticker: BatchTicker;
  siteId: string;
  status: BatchStatus;
  amountMinted: number;
  mintDate: string;
  retirementMonths: number;
  retiredFraction: number;
  remainingValue: number;
  region: string;
  metadataUri: string;
}

// ─── Trade Types ────────────────────────────────────────

export type TradePair = 'WTR/NXS' | 'ENG/NXS' | 'NXS/XRP' | 'XRP/RLUSD' | 'WTR/RLUSD' | 'ENG/RLUSD';
export type TradeSide = 'BUY' | 'SELL';

export interface TradeRecord {
  id: string;
  pair: TradePair;
  side: TradeSide;
  price: number;
  amount: number;
  total: number;
  ts: string;
  maker: string;
  taker: string;
}

// ─── Swap / Orderbook Types ─────────────────────────────

export interface OrderbookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface PairOrderbook {
  pair: TradePair;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  midPrice: number;
  spreadPct: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  changePct24h: number;
}

import type { Region, SiteId, Token, BridgeToken, Chain } from './seed';

// ═══════════════════════════════════════════════════════════
//  RECEIPTS
// ═══════════════════════════════════════════════════════════

export type ProofStepKind = 'ISSUANCE' | 'VERIFICATION' | 'TRANSFER' | 'RETIREMENT';

export interface ProofStep {
  stepIndex: number;
  kind: ProofStepKind;
  timestamp: string;
  actor: string;
  txHash: string;
  memo: string;
}

export type CustodyEventKind =
  | 'CREATED'
  | 'TRANSFERRED'
  | 'VERIFIED'
  | 'LOCKED'
  | 'RETIRED';

export interface CustodyEvent {
  eventIndex: number;
  kind: CustodyEventKind;
  timestamp: string;
  from: string;
  to: string;
  txHash: string;
}

export type ArtifactKind = 'PDF' | 'IMAGE' | 'CSV' | 'JSON';

export interface Artifact {
  id: string;
  kind: ArtifactKind;
  label: string;
  url: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VerificationRule {
  ruleId: string;
  name: string;
  description: string;
  passed: boolean;
  checkedAt: string;
}

export interface Receipt {
  id: string;
  batchId: string;
  ticker: 'WTR' | 'ENG';
  amount: number;
  region: Region;
  siteId: SiteId;
  mintedAt: string;
  expiresAt: string;
  verificationScore: number;
  riskReasons: string[];
  proofTrail: ProofStep[];
  custodyEvents: CustodyEvent[];
  artifacts: Artifact[];
  verificationRules: VerificationRule[];
}

// ═══════════════════════════════════════════════════════════
//  BRIDGES
// ═══════════════════════════════════════════════════════════

export type BridgeStatus =
  | 'INITIATED'
  | 'CONFIRMING'
  | 'RELAYING'
  | 'COMPLETED'
  | 'FAILED';

export interface BridgeRecord {
  id: string;
  token: BridgeToken;
  amount: number;
  sourceChain: Chain;
  destChain: Chain;
  status: BridgeStatus;
  initiatedAt: string;
  completedAt: string | null;
  fee: number;
  feeToken: BridgeToken;
  confirmations: number;
  requiredConfirmations: number;
  sourceTxHash: string;
  destTxHash: string | null;
  sender: string;
  recipient: string;
}

// ═══════════════════════════════════════════════════════════
//  LOANS / LENDING
// ═══════════════════════════════════════════════════════════

export interface LendingPool {
  id: string;
  token: Token;
  name: string;
  totalSupply: number;
  totalBorrowed: number;
  utilization: number;
  supplyAPR: number;
  borrowAPR: number;
  availableLiquidity: number;
  collateralFactor: number;
  liquidationThreshold: number;
}

export interface LoanPosition {
  id: string;
  poolId: string;
  token: Token;
  borrower: string;
  collateralToken: Token;
  collateralAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  openedAt: string;
  lastAccrual: string;
  interestAccrued: number;
}

// ═══════════════════════════════════════════════════════════
//  DAO / GOVERNANCE
// ═══════════════════════════════════════════════════════════

export type ProposalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PASSED'
  | 'FAILED'
  | 'EXECUTED'
  | 'CANCELLED';

export type ProposalType =
  | 'REWARD_RATE'
  | 'NEW_DEPLOYMENT'
  | 'BUDGET'
  | 'PARAMETER_CHANGE'
  | 'EMERGENCY';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  createdAt: string;
  votingStartsAt: string;
  votingEndsAt: string;
  executedAt: string | null;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorum: number;
  totalVoters: number;
}

export type VoteChoice = 'FOR' | 'AGAINST' | 'ABSTAIN';

export interface DAOVote {
  id: string;
  proposalId: string;
  voter: string;
  choice: VoteChoice;
  weight: number;
  castAt: string;
}

export type TreasuryActionKind =
  | 'ALLOCATION'
  | 'DISTRIBUTION'
  | 'RESERVE'
  | 'BURN';

export interface TreasuryAction {
  id: string;
  kind: TreasuryActionKind;
  token: Token;
  amount: number;
  recipient: string;
  proposalId: string | null;
  executedAt: string;
  txHash: string;
  memo: string;
}

// ═══════════════════════════════════════════════════════════
//  ALERTS
// ═══════════════════════════════════════════════════════════

export type AlertCategory =
  | 'SENSOR_GAP'
  | 'CALIBRATION_OVERDUE'
  | 'OUTLIER'
  | 'CONNECTIVITY_LOSS'
  | 'MAINTENANCE_DUE'
  | 'FRAUD_SIGNAL'
  | 'COMPLIANCE';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  siteId: SiteId;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
  metadata: Record<string, string | number>;
}

// ═══════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface ChainBalance {
  chain: Chain;
  balances: Record<Token, number>;
}

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  xrplAddress: string;
  evmAddress: string;
  region: Region;
  createdAt: string;
  lastLoginAt: string;
  chainBalances: ChainBalance[];
}

export interface TokenPrice {
  token: Token;
  usd: number;
  change24h: number;
}
