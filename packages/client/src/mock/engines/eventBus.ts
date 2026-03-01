/**
 * Typed event bus for cross-component communication.
 * All engines emit events here; the Zustand store subscribes.
 */

export type AppEventType =
  | 'MINT' | 'SWAP' | 'BRIDGE' | 'VOTE' | 'ALERT' | 'RETIRE'
  | 'REDEEM' | 'LOAN' | 'EXPORT' | 'VERIFY' | 'PROPOSAL'
  | 'MAINTENANCE' | 'EMERGENCY' | 'READING' | 'SKILL_RUN';

export interface AppEvent {
  id: string;
  type: AppEventType;
  timeISO: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  payload: Record<string, unknown>;
  relatedSiteId?: string;
  relatedBatchId?: string;
  relatedReceiptId?: string;
}

type Listener = (event: AppEvent) => void;

export class EventBus {
  private listeners: Set<Listener> = new Set();
  private history: AppEvent[] = [];
  private maxHistory = 200;

  emit(event: AppEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.listeners.forEach(fn => fn(event));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getRecent(n: number): AppEvent[] {
    return this.history.slice(-n);
  }

  clear(): void {
    this.history = [];
  }
}
