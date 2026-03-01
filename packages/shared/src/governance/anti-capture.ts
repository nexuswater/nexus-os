/**
 * Anti-Capture Safeguards — Prevent governance concentration
 * Configurable via DAO proposal. Feature-flag controlled.
 */

export interface GovernanceSafetyConfig {
  /** Maximum voting power per address (0 = no cap) */
  maxVoteCap: number;
  /** Enable whale dampening coefficient */
  dampeningEnabled: boolean;
  /** Dampening threshold — above this, dampening applies */
  dampeningThreshold: number;
  /** Dampening coefficient (0-1, lower = more dampening) */
  dampeningCoefficient: number;
  /** Participation bonus multiplier for consistent voters */
  participationMultiplier: number;
  /** Minimum votes in last N proposals to qualify for bonus */
  participationMinVotes: number;
  /** Lookback window for participation (number of proposals) */
  participationLookback: number;
  /** Inactivity decay rate per epoch without voting */
  inactivityDecayRate: number;
  /** Maximum inactivity penalty (fraction of weight lost) */
  maxInactivityPenalty: number;
  /** Time-weighted governance: older holders get small bonus */
  timeWeightedEnabled: boolean;
  /** Adjustable by governance proposal */
  governanceAdjustable: boolean;
}

export const DEFAULT_SAFETY_CONFIG: GovernanceSafetyConfig = {
  maxVoteCap: 0, // disabled by default
  dampeningEnabled: true,
  dampeningThreshold: 50000,
  dampeningCoefficient: 0.7,
  participationMultiplier: 1.1,
  participationMinVotes: 3,
  participationLookback: 10,
  inactivityDecayRate: 0.02,
  maxInactivityPenalty: 0.3,
  timeWeightedEnabled: false,
  governanceAdjustable: true,
};

/** Apply whale dampening to raw voting power */
export function applyDampening(
  rawPower: number,
  config: GovernanceSafetyConfig = DEFAULT_SAFETY_CONFIG,
): number {
  if (!config.dampeningEnabled) return rawPower;
  if (rawPower <= config.dampeningThreshold) return rawPower;

  const excess = rawPower - config.dampeningThreshold;
  const dampened = config.dampeningThreshold + excess * config.dampeningCoefficient;
  return dampened;
}

/** Apply vote cap */
export function applyVoteCap(
  power: number,
  config: GovernanceSafetyConfig = DEFAULT_SAFETY_CONFIG,
): number {
  if (config.maxVoteCap <= 0) return power;
  return Math.min(power, config.maxVoteCap);
}

/** Calculate participation bonus */
export function participationBonus(
  recentVoteCount: number,
  config: GovernanceSafetyConfig = DEFAULT_SAFETY_CONFIG,
): number {
  if (recentVoteCount >= config.participationMinVotes) {
    return config.participationMultiplier;
  }
  return 1.0;
}

/** Calculate inactivity decay */
export function inactivityDecay(
  epochsSinceLastVote: number,
  config: GovernanceSafetyConfig = DEFAULT_SAFETY_CONFIG,
): number {
  if (epochsSinceLastVote <= 0) return 1.0;
  const penalty = Math.min(
    epochsSinceLastVote * config.inactivityDecayRate,
    config.maxInactivityPenalty,
  );
  return 1.0 - penalty;
}

/** Apply all safety transforms to raw voting power */
export function applySafetyTransforms(
  rawPower: number,
  recentVoteCount: number,
  epochsSinceLastVote: number,
  config: GovernanceSafetyConfig = DEFAULT_SAFETY_CONFIG,
): { finalPower: number; transforms: string[] } {
  const transforms: string[] = [];
  let power = rawPower;

  // 1. Dampening
  const dampened = applyDampening(power, config);
  if (dampened !== power) {
    transforms.push(`Whale dampening: ${Math.round(power)} → ${Math.round(dampened)}`);
    power = dampened;
  }

  // 2. Vote cap
  const capped = applyVoteCap(power, config);
  if (capped !== power) {
    transforms.push(`Vote cap applied: ${Math.round(power)} → ${Math.round(capped)}`);
    power = capped;
  }

  // 3. Participation bonus
  const bonus = participationBonus(recentVoteCount, config);
  if (bonus > 1) {
    const boosted = power * bonus;
    transforms.push(`Participation bonus (${recentVoteCount} votes): ×${bonus}`);
    power = boosted;
  }

  // 4. Inactivity decay
  const decay = inactivityDecay(epochsSinceLastVote, config);
  if (decay < 1) {
    const decayed = power * decay;
    transforms.push(`Inactivity decay (${epochsSinceLastVote} epochs): ×${decay.toFixed(2)}`);
    power = decayed;
  }

  return { finalPower: power, transforms };
}
