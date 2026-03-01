/**
 * NexusMock — central mock data fabric for the Nexus OS interactive MVP.
 * Single instance powers all pages with consistent, deterministic data.
 */

import { createRng, type Rng, type Token, type Chain, type BridgeToken } from './seed';
import type {
  ExtendedSite, SiteDevice, HourlyReading, DailyAggregate,
  MockBatch, Receipt, TradeRecord, PairOrderbook,
  BridgeRecord, LendingPool, LoanPosition,
  Proposal, DAOVote, TreasuryAction, Alert, MockUser, TokenPrice,
  BatchTicker,
} from './types';

// Generators
import {
  generateSites, generateDevices, generateBatches,
  generateReceipts, generateTrades, generateOrderbooks,
  generateBridges, generatePools, generatePositions,
  generateProposals, generateVotes, generateTreasuryActions,
  generateAlerts, generateUser, TOKEN_PRICES,
} from './generators';

// Engines
import { EventBus, type AppEvent } from './engines/eventBus';
import { PortfolioEngine } from './engines/portfolioEngine';
import { SwapEngine, type SwapQuote, type SwapResult } from './engines/swapEngine';
import { BridgeEngine } from './engines/bridgeEngine';
import { MintEngine, type MintResult } from './engines/mintEngine';
import { RetirementEngine } from './engines/retirementEngine';
import { LoanEngine } from './engines/loanEngine';
import { DAOEngine } from './engines/daoEngine';
import { VerificationEngine } from './engines/verificationEngine';
import { AuditPackEngine } from './engines/auditPackEngine';
import { DemoClock, type DemoSpeed } from './engines/clock';
import { ScoringEngine } from './engines/scoringEngine';

export interface NexusMockState {
  sites: ExtendedSite[];
  devices: SiteDevice[];
  batches: MockBatch[];
  receipts: Receipt[];
  trades: TradeRecord[];
  orderbooks: PairOrderbook[];
  bridges: BridgeRecord[];
  lendingPools: LendingPool[];
  loans: LoanPosition[];
  proposals: Proposal[];
  votes: DAOVote[];
  treasuryActions: TreasuryAction[];
  alerts: Alert[];
  user: MockUser;
  prices: TokenPrice[];
}

export class NexusMock {
  // ─── State ─────────────────────────────────────
  state: NexusMockState;

  // ─── Engines ───────────────────────────────────
  readonly eventBus: EventBus;
  readonly portfolio: PortfolioEngine;
  readonly swap: SwapEngine;
  readonly bridge: BridgeEngine;
  readonly mint: MintEngine;
  readonly retirement: RetirementEngine;
  readonly loan: LoanEngine;
  readonly dao: DAOEngine;
  readonly verification: VerificationEngine;
  readonly auditPack: AuditPackEngine;
  readonly clock: DemoClock;
  readonly scoring: ScoringEngine;

  private seed: number;

  constructor(seed: number = 0x4E585042) {
    this.seed = seed;
    this.state = this.generateAll(seed);

    // ── Central event bus ────────────────────────
    this.eventBus = new EventBus();

    // ── Portfolio (takes ref-functions) ──────────
    this.portfolio = new PortfolioEngine(
      () => this.state.user,
      () => this.state.prices,
    );

    // ── Swap (takes ref-functions + portfolio + eventBus) ──
    this.swap = new SwapEngine(
      () => this.state.orderbooks,
      () => this.state.trades,
      this.portfolio,
      this.eventBus,
    );

    // ── Bridge (takes ref-function + portfolio + eventBus) ──
    this.bridge = new BridgeEngine(
      () => this.state.bridges,
      this.portfolio,
      this.eventBus,
    );

    // ── Mint (takes ref-functions + portfolio + eventBus) ──
    this.mint = new MintEngine(
      () => this.state.sites,
      () => this.state.batches,
      () => this.state.receipts,
      this.portfolio,
      this.eventBus,
    );

    // ── Retirement (takes ref-functions + portfolio + eventBus) ──
    this.retirement = new RetirementEngine(
      () => this.state.batches,
      () => this.state.receipts,
      this.portfolio,
      this.eventBus,
    );

    // ── Loan (takes rng, pools[], positions[], prices[]) ──
    const loanRng = createRng(seed + 111);
    this.loan = new LoanEngine(
      loanRng,
      this.state.lendingPools,
      this.state.loans,
      this.state.prices,
    );

    // Forward LoanEngine events to the central EventBus
    this.loan.onEvent((evt) => {
      this.eventBus.emit({
        id: `loan-evt-${evt.loanId}-${Date.now()}`,
        type: 'LOAN',
        timeISO: evt.timestamp,
        message: `${evt.kind}: ${evt.amount} on loan ${evt.loanId}`,
        severity: evt.kind === 'LOAN_CLOSED' ? 'success' : 'info',
        payload: { ...evt },
      });
    });

    // ── DAO (takes rng, proposals[], votes[]) ──
    const daoRng = createRng(seed + 222);
    this.dao = new DAOEngine(
      daoRng,
      this.state.proposals,
      this.state.votes,
    );

    // Forward DAOEngine events to the central EventBus
    this.dao.onEvent((evt) => {
      this.eventBus.emit({
        id: `dao-evt-${evt.proposalId}-${Date.now()}`,
        type: evt.kind === 'VOTE_CAST' ? 'VOTE' : 'PROPOSAL',
        timeISO: evt.timestamp,
        message: `${evt.kind}: proposal ${evt.proposalId}${evt.voter ? ` by ${evt.voter}` : ''}`,
        severity: 'info',
        payload: { ...evt },
      });
    });

    // ── Verification (takes rng, receipts[], sites[]) ──
    const verifyRng = createRng(seed + 999);
    this.verification = new VerificationEngine(
      verifyRng,
      this.state.receipts,
      this.state.sites,
    );

    // Forward VerificationEngine events to the central EventBus
    this.verification.onEvent((evt) => {
      this.eventBus.emit({
        id: `verify-evt-${evt.receiptId}-${Date.now()}`,
        type: 'VERIFY',
        timeISO: evt.timestamp,
        message: `Verification ${evt.passed ? 'passed' : 'failed'}: receipt ${evt.receiptId} (score ${evt.score})`,
        severity: evt.passed ? 'success' : 'warning',
        payload: { ...evt },
        relatedReceiptId: evt.receiptId,
      });
    });

    // ── AuditPack (no constructor args) ──
    this.auditPack = new AuditPackEngine();

    // Forward AuditPackEngine events to the central EventBus
    this.auditPack.onEvent((evt) => {
      this.eventBus.emit({
        id: `export-evt-${Date.now()}`,
        type: 'EXPORT',
        timeISO: evt.timestamp,
        message: `Audit pack exported: ${evt.receiptCount} receipts as ${evt.formats.join(', ')}`,
        severity: 'success',
        payload: { ...evt },
      });
    });

    // ── Scoring (takes rng) ─────────────────────────
    const scoringRng = createRng(seed + 555);
    this.scoring = new ScoringEngine(scoringRng);

    // ── DemoClock (takes rng, actions, proposalIds?) ──
    const clockRng = createRng(seed + 777);
    this.clock = new DemoClock(clockRng, {
      swap: (_pair, _side, amount) => {
        const tokens: Token[] = ['WTR', 'NXS', 'ENG', 'XRP'];
        const tIn = tokens[Math.floor(clockRng() * tokens.length)];
        const tOut = tokens[Math.floor(clockRng() * tokens.length)];
        if (tIn !== tOut) this.actions.swap(tIn, tOut, amount);
      },
      alert: (siteId, category, severity, message) => {
        this.actions.createAlert(siteId, category, severity, message);
      },
      mint: (ticker, siteId, amount) => {
        this.actions.mintBatch(siteId, ticker as BatchTicker, amount);
      },
      bridge: (token, amount, from, to) => {
        if (from !== to) this.actions.bridge(token as BridgeToken, amount, from as Chain, to as Chain);
      },
      vote: (proposalId, choice, weight) => {
        this.actions.vote(proposalId, choice as 'FOR' | 'AGAINST' | 'ABSTAIN', weight);
      },
    }, this.state.proposals.filter(p => p.status === 'ACTIVE').map(p => p.id));
  }

  private generateAll(seed: number): NexusMockState {
    const rng = createRng(seed);
    const sites = generateSites(rng);
    const devices = generateDevices(rng, sites);
    const batches = generateBatches(rng, sites);
    const receipts = generateReceipts(rng);
    const trades = generateTrades(rng);
    const orderbooks = generateOrderbooks(rng);
    const bridges = generateBridges(rng);
    const pools = generatePools(rng);
    const loans = generatePositions(rng, pools);
    const proposals = generateProposals(rng);
    const votes = generateVotes(rng, proposals);
    const treasury = generateTreasuryActions(rng, proposals);
    const alerts = generateAlerts(rng);
    const user = generateUser(rng);

    return {
      sites, devices, batches, receipts, trades, orderbooks,
      bridges, lendingPools: pools, loans, proposals, votes,
      treasuryActions: treasury, alerts, user, prices: [...TOKEN_PRICES],
    };
  }

  /** Get a snapshot of the current state */
  getSnapshot(): NexusMockState {
    return this.state;
  }

  /** Subscribe to events */
  subscribe(fn: (event: AppEvent) => void): () => void {
    return this.eventBus.subscribe(fn);
  }

  /** Get recent events */
  getRecentEvents(n: number): AppEvent[] {
    return this.eventBus.getRecent(n);
  }

  /** Computed KPIs */
  getKPIs() {
    const s = this.state;
    const activeSites = s.sites.filter(si => si.status === 'ACTIVE').length;
    const totalMintedWTR = s.batches.filter(b => b.ticker === 'WTR').reduce((sum, b) => sum + b.amountMinted, 0);
    const totalMintedENG = s.batches.filter(b => b.ticker === 'ENG').reduce((sum, b) => sum + b.amountMinted, 0);
    const totalRetiredWTR = s.batches.filter(b => b.ticker === 'WTR').reduce((sum, b) => sum + b.amountMinted * b.retiredFraction, 0);
    const totalRetiredENG = s.batches.filter(b => b.ticker === 'ENG').reduce((sum, b) => sum + b.amountMinted * b.retiredFraction, 0);
    const tvlUSD = this.portfolio.getPortfolioValue();
    const avgVerScore = s.receipts.length ? s.receipts.reduce((sum, r) => sum + r.verificationScore, 0) / s.receipts.length : 0;
    const activeProposals = s.proposals.filter(p => p.status === 'ACTIVE').length;
    const alertsOpen = s.alerts.filter(a => !a.resolvedAt).length;

    return {
      activeSites, totalMintedWTR, totalMintedENG, totalRetiredWTR, totalRetiredENG,
      tvlUSD, avgVerificationScore: Math.round(avgVerScore * 10) / 10,
      activeProposals, alertsOpen,
      totalBatches: s.batches.length,
      totalReceipts: s.receipts.length,
    };
  }

  /** All executable actions */
  readonly actions = {
    swap: (tokenIn: Token, tokenOut: Token, amountIn: number, chain?: Chain) =>
      this.swap.execute(tokenIn, tokenOut, amountIn, chain),

    swapQuote: (tokenIn: Token, tokenOut: Token, amountIn: number) =>
      this.swap.quote(tokenIn, tokenOut, amountIn),

    bridge: (token: BridgeToken, amount: number, fromChain: Chain, toChain: Chain) =>
      this.bridge.initiate(token, amount, fromChain, toChain),

    mintBatch: (siteId: string, ticker: BatchTicker, quantity: number) =>
      this.mint.mintBatch(siteId, ticker, quantity),

    retire: (batchId: string, amount: number) =>
      this.retirement.retire(batchId, amount),

    redeem: (batchId: string) =>
      this.retirement.redeem(batchId),

    createLoan: (borrower: string, collateralToken: Token, collateralAmt: number, borrowToken: Token, borrowAmt: number) =>
      this.loan.createLoan(borrower, collateralToken, collateralAmt, borrowToken, borrowAmt),

    repayLoan: (loanId: string, amount: number) =>
      this.loan.repay(loanId, amount),

    createProposal: (title: string, type: string, description: string) =>
      this.dao.createProposal(title, type as any, description),

    vote: (proposalId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN', weight: number) =>
      this.dao.vote(proposalId, choice, weight),

    advanceProposals: () => this.dao.advanceProposals(),

    executeProposal: (proposalId: string) => this.dao.executeProposal(proposalId),

    verifyReceipt: (receiptId: string) => this.verification.verify(receiptId),

    exportAuditPack: (receipts: Receipt[], scope: any, formats: Set<string>) =>
      this.auditPack.generate(receipts, scope, formats as any),

    createAlert: (siteId: string, category: string, severity: string, message: string) => {
      const alert: Alert = {
        id: 'alert-' + Math.random().toString(36).slice(2, 10),
        siteId: siteId as any,
        category: category as any,
        severity: severity as any,
        message,
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        acknowledgedBy: null,
        metadata: {},
      };
      this.state.alerts.push(alert);
      this.eventBus.emit({
        id: alert.id,
        type: 'ALERT',
        timeISO: alert.createdAt,
        message,
        severity: severity === 'CRITICAL' ? 'error' : severity === 'HIGH' ? 'warning' : 'info',
        payload: { siteId, category, severity },
        relatedSiteId: siteId,
      });
      return alert;
    },

    setDemoSpeed: (speed: DemoSpeed) => this.clock.setSpeed(speed),

    resetSeed: () => {
      this.clock.stop();
      this.state = this.generateAll(this.seed);
      this.eventBus.clear();
    },

    replayEvents: (n: number) => {
      const events = this.eventBus.getRecent(n);
      events.forEach(e => this.eventBus.emit({ ...e, id: e.id + '-replay' }));
    },

    // ── Scoring actions ──
    recalculateScore: (subjectId: string) =>
      this.scoring.recalculateScore(subjectId),

    issueCertificate: (subjectId: string) =>
      this.scoring.issueCertificate(subjectId),
  };
}

// ─── Singleton ──────────────────────────────────────────
let instance: NexusMock | null = null;

export function getNexusMock(): NexusMock {
  if (!instance) instance = new NexusMock();
  return instance;
}

export function resetNexusMock(): NexusMock {
  instance = new NexusMock();
  return instance;
}

export type { AppEvent } from './engines/eventBus';
export type { SwapQuote, SwapResult } from './engines/swapEngine';
export type { MintResult } from './engines/mintEngine';
export type { DemoSpeed } from './engines/clock';
