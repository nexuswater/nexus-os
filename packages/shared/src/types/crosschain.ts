/**
 * Cross-Chain Intent → Route → Saga Types
 * Chain-agnostic transaction infrastructure for XRPL + EVM settlement.
 */

// ─── Chain & Token Identifiers ──────────────────────────

export type CrossChainId = 'XRPL' | 'BASE' | 'XRPL_EVM' | 'ARBITRUM' | 'HYPEREVM';

export type SettlementTokenSymbol = 'NXS' | 'WTR' | 'ENG' | 'XRP' | 'RLUSD' | 'USDC' | 'ETH';

export type AdapterRail = 'XRPL_DEX' | 'EVM_AMM' | 'BRIDGE';

// ─── Intent (user's high-level desire) ──────────────────

export interface CrossChainIntent {
  id: string;
  fromChain: CrossChainId;
  toChain: CrossChainId;
  fromToken: SettlementTokenSymbol;
  toToken: SettlementTokenSymbol;
  amount: number;
  sender: string;
  recipient?: string;
  maxSlippageBps?: number;        // e.g. 50 = 0.5%
  deadline?: string;              // ISO timestamp
  idempotencyKey: string;
  createdAt: string;              // ISO
}

// ─── Route Step (single atomic operation) ───────────────

export type RouteStepType = 'SWAP' | 'BRIDGE' | 'APPROVE' | 'WRAP' | 'UNWRAP' | 'MINT' | 'BURN';

export interface RouteStep {
  stepIndex: number;
  type: RouteStepType;
  adapter: AdapterRail;
  chainId: CrossChainId;
  inputToken: SettlementTokenSymbol;
  outputToken: SettlementTokenSymbol;
  estimatedInput: number;
  estimatedOutput: number;
  estimatedGas: string;
  estimatedTimeSeconds: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ─── Route (ranked collection of steps) ─────────────────

export interface Route {
  id: string;
  intentId: string;
  steps: RouteStep[];
  totalEstimatedOutput: number;
  totalEstimatedGas: string;
  totalEstimatedTimeSeconds: number;
  netOutputAfterFees: number;
  reliability: number;            // 0-1 (1 = most reliable)
  provider?: string;              // e.g. "XRPL DEX", "Axelar Bridge + Uniswap"
  rank: number;                   // 1 = best
}

// ─── Quote (server response to intent) ──────────────────

export interface CrossChainQuote {
  intentId: string;
  routes: Route[];
  bestRouteId: string;
  expiresAt: string;              // ISO
}

// ─── Saga Execution State ───────────────────────────────

export type SagaStepStatus =
  | 'pending'
  | 'executing'
  | 'confirming'
  | 'success'
  | 'failed'
  | 'retrying';

export interface SagaStep {
  stepIndex: number;
  status: SagaStepStatus;
  description?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
  retryCount: number;
  startedAt?: string;
  completedAt?: string;
}

export type SagaStatus = 'idle' | 'executing' | 'stuck' | 'completed' | 'failed';

export interface SagaState {
  intentId: string;
  routeId: string;
  steps: SagaStep[];
  status: SagaStatus;
  currentStepIndex: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// ─── Receipt (final result) ─────────────────────────────

export interface ExplorerLink {
  chainId: CrossChainId;
  txHash: string;
  url: string;
}

export interface CrossChainReceipt {
  intentId: string;
  routeId: string;
  inputToken: SettlementTokenSymbol;
  inputAmount: number;
  outputToken: SettlementTokenSymbol;
  outputAmount: number;
  fromChain: CrossChainId;
  toChain: CrossChainId;
  explorerLinks: ExplorerLink[];
  completedAt: string;
}

// ─── Adapter Interfaces (used by server) ────────────────

export interface StepQuote {
  estimatedOutput: number;
  estimatedGas: string;
  estimatedTimeSeconds?: number;
  rate?: number;
  priceImpactBps?: number;
}

export interface UnsignedTx {
  chainId: CrossChainId;
  adapter: AdapterRail;
  payload: Record<string, unknown>;
  description: string;
}

export interface TxSubmission {
  txHash: string;
  chainId: CrossChainId;
  explorerUrl: string;
  submittedAt: string;
}

export interface TxReceipt {
  txHash: string;
  chainId: CrossChainId;
  status: 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  explorerUrl?: string;
  confirmedAt: string;
}

export interface AdapterContext {
  senderAddress: string;
  recipientAddress?: string;
  maxSlippageBps: number;
}
