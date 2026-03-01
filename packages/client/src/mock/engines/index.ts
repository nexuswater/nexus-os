/**
 * Barrel export for all mock engine modules.
 * Engines provide runtime logic on top of generated data.
 */

// ─── Event bus ──────────────────────────────────────────

export { EventBus } from './eventBus';
export type { AppEvent, AppEventType } from './eventBus';

// ─── Core engines (pre-existing) ────────────────────────

export { BridgeEngine } from './bridgeEngine';

export { MintEngine } from './mintEngine';
export type { MintResult } from './mintEngine';

export { PortfolioEngine } from './portfolioEngine';

export { RetirementEngine } from './retirementEngine';
export type { RetireResult, RedeemResult } from './retirementEngine';

export { SwapEngine } from './swapEngine';
export type { SwapQuote, SwapResult } from './swapEngine';

// ─── New engines ────────────────────────────────────────

export { LoanEngine } from './loanEngine';
export type { LoanEvent, LoanEventKind, LoanListener } from './loanEngine';

export { DAOEngine } from './daoEngine';
export type { DAOEvent, DAOEventKind, DAOListener } from './daoEngine';

export { VerificationEngine } from './verificationEngine';
export type { VerifyResult, VerifyEvent, VerifyEventKind, VerifyListener } from './verificationEngine';

export { AuditPackEngine } from './auditPackEngine';
export type {
  AuditScope, ExportFormat, AuditPackResult,
  ExportEvent, ExportEventKind, ExportListener,
} from './auditPackEngine';

export { DemoClock } from './clock';
export type { DemoSpeed, ClockActions } from './clock';
