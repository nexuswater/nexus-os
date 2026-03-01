/**
 * clock.ts — Mock demo clock for auto-event generation.
 * Configurable speed (off / low / med / high) drives a tick
 * interval that fires random events against NexusMock actions.
 *
 * Event distribution per tick:
 *   40% swap, 15% alert, 10% mint, 10% bridge, 10% vote, 15% reading
 */
import type { Rng } from '../seed';
import { pick, randInt, randFloat, round, chance, hexId, REGIONS, TOKENS } from '../seed';
import type { Token } from '../seed';

// ─── Speed configuration ────────────────────────────────

export type DemoSpeed = 'off' | 'low' | 'med' | 'high';

const INTERVAL_MS: Record<DemoSpeed, number> = {
  off:  0,
  low:  10_000,
  med:  4_000,
  high: 1_500,
};

// ─── Action interface (subset of NexusMock) ─────────────

export interface ClockActions {
  swap?: (pair: string, side: 'BUY' | 'SELL', amount: number) => void;
  alert?: (siteId: string, category: string, severity: string, message: string) => void;
  mint?: (ticker: 'WTR' | 'ENG', siteId: string, amount: number) => void;
  bridge?: (token: string, amount: number, sourceChain: string, destChain: string) => void;
  vote?: (proposalId: string, choice: string, weight: number) => void;
  reading?: (siteId: string) => void;
}

// ─── Event type weights ─────────────────────────────────

type TickEventType = 'swap' | 'alert' | 'mint' | 'bridge' | 'vote' | 'reading';

interface WeightedEvent {
  type: TickEventType;
  cumulativeWeight: number;
}

const EVENT_WEIGHTS: WeightedEvent[] = [
  { type: 'swap',    cumulativeWeight: 0.40 },
  { type: 'alert',   cumulativeWeight: 0.55 },
  { type: 'mint',    cumulativeWeight: 0.65 },
  { type: 'bridge',  cumulativeWeight: 0.75 },
  { type: 'vote',    cumulativeWeight: 0.85 },
  { type: 'reading', cumulativeWeight: 1.00 },
];

function pickEventType(rng: Rng): TickEventType {
  const roll = rng();
  for (const w of EVENT_WEIGHTS) {
    if (roll < w.cumulativeWeight) return w.type;
  }
  return 'reading';
}

// ─── Mock data pools for tick generation ────────────────

const PAIRS = ['WTR/NXS', 'ENG/NXS', 'NXS/XRP', 'XRP/RLUSD', 'WTR/RLUSD', 'ENG/RLUSD'] as const;
const SIDES = ['BUY', 'SELL'] as const;
const CHAINS = ['XRPL', 'BASE', 'ARBITRUM', 'COREUM'] as const;
const BRIDGE_TOKENS = ['NXS', 'WTR', 'ENG', 'USDC'] as const;
const TICKERS = ['WTR', 'ENG'] as const;
const SITE_IDS = Array.from({ length: 42 }, (_, i) => `site-${String(i + 1).padStart(3, '0')}`);
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const ALERT_CATEGORIES = [
  'SENSOR_GAP', 'CALIBRATION_OVERDUE', 'OUTLIER',
  'CONNECTIVITY_LOSS', 'MAINTENANCE_DUE',
] as const;
const ALERT_MESSAGES = [
  'Flow meter reading gap detected',
  'TDS sensor calibration overdue',
  'Anomalous reading: value outside 3σ',
  'Gateway heartbeat timeout',
  'Filter replacement scheduled',
] as const;

// ─── Clock engine ───────────────────────────────────────

export class DemoClock {
  private rng: Rng;
  private actions: ClockActions;
  private speed: DemoSpeed = 'off';
  private timer: ReturnType<typeof setInterval> | null = null;
  private proposalIds: string[];

  constructor(rng: Rng, actions: ClockActions, proposalIds: string[] = []) {
    this.rng = rng;
    this.actions = actions;
    this.proposalIds = proposalIds;
  }

  /** Set the demo speed. Restarts the interval as needed. */
  setSpeed(speed: DemoSpeed): void {
    this.stop();
    this.speed = speed;
    if (speed !== 'off') this.start();
  }

  /** Start the tick interval at current speed. */
  start(): void {
    if (this.timer) return;
    const ms = INTERVAL_MS[this.speed];
    if (ms <= 0) return;
    this.timer = setInterval(() => this.tick(), ms);
  }

  /** Stop the tick interval. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Get current speed setting. */
  getSpeed(): DemoSpeed {
    return this.speed;
  }

  /** Update available proposal ids for vote events. */
  setProposalIds(ids: string[]): void {
    this.proposalIds = ids;
  }

  /** Execute a single tick — pick a random event type and fire it. */
  private tick(): void {
    const eventType = pickEventType(this.rng);

    switch (eventType) {
      case 'swap':
        this.actions.swap?.(
          pick(this.rng, PAIRS),
          pick(this.rng, SIDES),
          round(randFloat(this.rng, 50, 10_000), 2),
        );
        break;

      case 'alert':
        this.actions.alert?.(
          pick(this.rng, SITE_IDS),
          pick(this.rng, ALERT_CATEGORIES),
          pick(this.rng, SEVERITIES),
          pick(this.rng, ALERT_MESSAGES),
        );
        break;

      case 'mint':
        this.actions.mint?.(
          pick(this.rng, TICKERS),
          pick(this.rng, SITE_IDS),
          round(randFloat(this.rng, 100, 5_000), 2),
        );
        break;

      case 'bridge':
        this.actions.bridge?.(
          pick(this.rng, BRIDGE_TOKENS),
          round(randFloat(this.rng, 100, 20_000), 2),
          pick(this.rng, CHAINS),
          pick(this.rng, CHAINS),
        );
        break;

      case 'vote':
        if (this.proposalIds.length > 0) {
          this.actions.vote?.(
            pick(this.rng, this.proposalIds),
            pick(this.rng, ['FOR', 'AGAINST', 'ABSTAIN'] as const),
            round(randFloat(this.rng, 50, 5_000), 2),
          );
        }
        break;

      case 'reading':
        this.actions.reading?.(pick(this.rng, SITE_IDS));
        break;
    }
  }
}
