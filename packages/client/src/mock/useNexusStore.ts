/**
 * useNexusStore — Zustand store powered by NexusMock singleton.
 *
 * Architecture: The store holds only a `version` counter + demoSpeed.
 * When any NexusMock action fires an event, the version bumps via
 * setTimeout(0) to avoid React 19 useSyncExternalStore conflicts.
 * Convenience hooks read directly from the NexusMock singleton,
 * using the version as a re-render trigger. This avoids infinite
 * loops from unstable object references (kpis, recentEvents).
 */

import { create } from 'zustand';
import { getNexusMock } from './index';
import type { DemoSpeed } from './engines/clock';
import type { Token, Chain, BridgeToken } from './seed';
import type { BatchTicker, Receipt } from './types';

// ─── Singleton reference ─────────────────────────────────
const mock = getNexusMock();

// ─── Internal store — minimal: just a version counter ────
interface NexusCoreStore {
  version: number;
  demoSpeed: DemoSpeed;
}

const useCoreStore = create<NexusCoreStore>(() => ({
  version: 0,
  demoSpeed: 'off',
}));

// Bump function — increments version to trigger re-renders
function bump() {
  useCoreStore.setState(s => ({ version: s.version + 1 }));
}

// Subscribe eventBus → bump version (deferred via setTimeout to
// avoid conflicts with React 19's useSyncExternalStore)
let bumpScheduled = false;
mock.subscribe(() => {
  if (bumpScheduled) return;
  bumpScheduled = true;
  setTimeout(() => {
    bumpScheduled = false;
    bump();
  }, 0);
});

// ─── Stable actions object (defined once, never changes) ─
export const nexusActions = {
  swap(tokenIn: Token, tokenOut: Token, amountIn: number, chain?: Chain) {
    mock.actions.swap(tokenIn, tokenOut, amountIn, chain);
    bump();
  },
  swapQuote(tokenIn: Token, tokenOut: Token, amountIn: number) {
    return mock.actions.swapQuote(tokenIn, tokenOut, amountIn);
  },
  bridge(token: BridgeToken, amount: number, fromChain: Chain, toChain: Chain) {
    mock.actions.bridge(token, amount, fromChain, toChain);
    bump();
  },
  mintBatch(siteId: string, ticker: BatchTicker, quantity: number) {
    mock.actions.mintBatch(siteId, ticker, quantity);
    bump();
  },
  retire(batchId: string, amount: number) {
    mock.actions.retire(batchId, amount);
    bump();
  },
  redeem(batchId: string) {
    mock.actions.redeem(batchId);
    bump();
  },
  createLoan(collateralToken: Token, collateralAmt: number, borrowToken: Token, borrowAmt: number) {
    mock.actions.createLoan('user', collateralToken, collateralAmt, borrowToken, borrowAmt);
    bump();
  },
  repayLoan(loanId: string, amount: number) {
    mock.actions.repayLoan(loanId, amount);
    bump();
  },
  createProposal(title: string, type: string, description: string) {
    mock.actions.createProposal(title, type, description);
    bump();
  },
  vote(proposalId: string, choice: 'FOR' | 'AGAINST' | 'ABSTAIN', weight: number) {
    mock.actions.vote(proposalId, choice, weight);
    bump();
  },
  advanceProposals() {
    mock.actions.advanceProposals();
    bump();
  },
  verifyReceipt(receiptId: string) {
    const result = mock.actions.verifyReceipt(receiptId);
    bump();
    return result;
  },
  exportAuditPack(receipts: Receipt[], scope: any, formats: Set<string>) {
    return mock.actions.exportAuditPack(receipts, scope, formats);
  },
  createAlert(siteId: string, category: string, severity: string, message: string) {
    mock.actions.createAlert(siteId, category, severity, message);
    bump();
  },
  setDemoSpeed(speed: DemoSpeed) {
    mock.actions.setDemoSpeed(speed);
    useCoreStore.setState({ demoSpeed: speed });
  },
  resetSeed() {
    mock.actions.resetSeed();
    bump();
  },
  replayEvents(n: number) {
    mock.actions.replayEvents(n);
    bump();
  },
  recalculateScore(subjectId: string) {
    const result = mock.actions.recalculateScore(subjectId);
    bump();
    return result;
  },
  issueCertificate(subjectId: string) {
    const result = mock.actions.issueCertificate(subjectId);
    bump();
    return result;
  },
} as const;

// ─── Public data hooks ───────────────────────────────────
// Subscribe to the version counter for re-render triggers,
// then read fresh data from NexusMock.

export function useNexusSites()      { useCoreStore(s => s.version); return mock.getSnapshot().sites; }
export function useNexusBatches()    { useCoreStore(s => s.version); return mock.getSnapshot().batches; }
export function useNexusReceipts()   { useCoreStore(s => s.version); return mock.getSnapshot().receipts; }
export function useNexusTrades()     { useCoreStore(s => s.version); return mock.getSnapshot().trades; }
export function useNexusOrderbooks() { useCoreStore(s => s.version); return mock.getSnapshot().orderbooks; }
export function useNexusBridges()    { useCoreStore(s => s.version); return mock.getSnapshot().bridges; }
export function useNexusLoans()      { useCoreStore(s => s.version); return mock.getSnapshot().loans; }
export function useNexusPools()      { useCoreStore(s => s.version); return mock.getSnapshot().lendingPools; }
export function useNexusProposals()  { useCoreStore(s => s.version); return mock.getSnapshot().proposals; }
export function useNexusVotes()      { useCoreStore(s => s.version); return mock.getSnapshot().votes; }
export function useNexusAlerts()     { useCoreStore(s => s.version); return mock.getSnapshot().alerts; }
export function useNexusUser()       { useCoreStore(s => s.version); return mock.getSnapshot().user; }
export function useNexusPrices()     { useCoreStore(s => s.version); return mock.getSnapshot().prices; }
export function useNexusEvents()     { useCoreStore(s => s.version); return mock.getRecentEvents(50); }
export function useNexusKPIs()       { useCoreStore(s => s.version); return mock.getKPIs(); }
export function useNexusDemoSpeed()  { return useCoreStore(s => s.demoSpeed); }

// ─── Scoring hooks ───────────────────────────────────────
export function useNexusSubjects()      { useCoreStore(s => s.version); return mock.scoring.getSubjects(); }
export function useNexusSubject(id: string) { useCoreStore(s => s.version); return mock.scoring.getSubject(id); }
export function useNexusScore(subjectId: string) { useCoreStore(s => s.version); return mock.scoring.getScore(subjectId); }
export function useNexusCertificates()  { useCoreStore(s => s.version); return mock.scoring.getCertificates(); }
export function useNexusScoringProducts() { useCoreStore(s => s.version); return mock.scoring.getProducts(); }
export function useNexusBenchmarks()    { useCoreStore(s => s.version); return mock.scoring.getBenchmarks(); }
export function useNexusLeaderboard(filter?: Parameters<typeof mock.scoring.getLeaderboard>[0]) {
  useCoreStore(s => s.version);
  return mock.scoring.getLeaderboard(filter);
}
export function useNexusSubjectBills(subjectId: string) { useCoreStore(s => s.version); return mock.scoring.getBills(subjectId); }
export function useNexusSubjectDevices(subjectId: string) { useCoreStore(s => s.version); return mock.scoring.getDevices(subjectId); }

// Actions hook — returns the stable singleton actions object
export function useNexusActions() { return nexusActions; }

// ─── Legacy compat: useNexusStore ────────────────────────
// Some components may import useNexusStore directly.
// This re-exports the core store so those imports don't break.
export const useNexusStore = useCoreStore;
