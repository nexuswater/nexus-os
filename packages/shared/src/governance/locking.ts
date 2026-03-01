/**
 * Identity-Bound MPT Locking — Governance Boost Mechanics
 *
 * Locked tokens cannot transfer. Boost scales with duration.
 * Formula: boost = sqrt(locked_amount) * duration_factor
 */

export interface LockPosition {
  id: string;
  userId: string;
  tokenTicker: 'WTR' | 'ENG' | 'NXS';
  amountLocked: number;
  lockDuration: number; // months
  lockStart: string; // ISO date
  lockEnd: string; // ISO date
  boostMultiplier: number;
  earlyUnlockPenalty: number; // fraction lost on early unlock (0-1)
  status: 'active' | 'expired' | 'unlocked_early';
}

export interface LockConfig {
  /** Maximum lock duration in months */
  maxDuration: number;
  /** Minimum lock duration in months */
  minDuration: number;
  /** Maximum boost multiplier */
  maxBoost: number;
  /** Early unlock penalty rate */
  earlyUnlockPenaltyRate: number;
  /** Cooldown after unlock (days) */
  unlockCooldownDays: number;
  /** Whether governance can adjust these params */
  governanceAdjustable: boolean;
}

export const DEFAULT_LOCK_CONFIG: LockConfig = {
  maxDuration: 48,
  minDuration: 1,
  maxBoost: 2.5,
  earlyUnlockPenaltyRate: 0.5,
  unlockCooldownDays: 7,
  governanceAdjustable: true,
};

/** Duration factor: scales linearly from 0.5 (1 month) to 1.0 (max duration) */
export function durationFactor(months: number, config: LockConfig = DEFAULT_LOCK_CONFIG): number {
  const normalized = Math.min(months, config.maxDuration) / config.maxDuration;
  return 0.5 + normalized * 0.5;
}

/** Calculate governance boost from a lock position */
export function lockBoost(
  amountLocked: number,
  durationMonths: number,
  config: LockConfig = DEFAULT_LOCK_CONFIG,
): number {
  const durFactor = durationFactor(durationMonths, config);
  const rawBoost = Math.sqrt(amountLocked) * durFactor;
  // Normalize to a multiplier (1.0 = no boost)
  const multiplier = 1 + rawBoost / (rawBoost + 1000); // asymptotic approach to max
  return Math.min(multiplier, config.maxBoost);
}

/** Calculate total governance weight including lock boost */
export function governanceWeightWithLock(
  baseWeight: number,
  locks: LockPosition[],
  config: LockConfig = DEFAULT_LOCK_CONFIG,
): number {
  const now = new Date();
  const activeLocks = locks.filter(l => {
    if (l.status !== 'active') return false;
    return new Date(l.lockEnd) > now;
  });

  const totalBoost = activeLocks.reduce((sum, lock) => {
    return sum + lockBoost(lock.amountLocked, lock.lockDuration, config) - 1;
  }, 0);

  return baseWeight * (1 + totalBoost);
}

/** Calculate early unlock penalty amount */
export function earlyUnlockPenalty(
  lock: LockPosition,
  config: LockConfig = DEFAULT_LOCK_CONFIG,
): number {
  const now = new Date();
  const start = new Date(lock.lockStart);
  const end = new Date(lock.lockEnd);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const remainingFraction = Math.max(0, 1 - elapsed / totalDuration);
  return lock.amountLocked * config.earlyUnlockPenaltyRate * remainingFraction;
}

/** Project lock positions over time for dashboard */
export function projectLockSchedule(
  locks: LockPosition[],
  monthsAhead: number = 12,
): Array<{ month: number; totalLocked: number; avgBoost: number }> {
  const projections = [];
  const now = Date.now();

  for (let m = 0; m <= monthsAhead; m++) {
    const futureDate = new Date(now + m * 30.44 * 86400000);
    const activeLocks = locks.filter(l => new Date(l.lockEnd) > futureDate && l.status === 'active');
    const totalLocked = activeLocks.reduce((s, l) => s + l.amountLocked, 0);
    const avgBoost = activeLocks.length > 0
      ? activeLocks.reduce((s, l) => s + l.boostMultiplier, 0) / activeLocks.length
      : 1;
    projections.push({ month: m, totalLocked, avgBoost: Math.round(avgBoost * 100) / 100 });
  }

  return projections;
}
