/**
 * Feeding Engine — Burns WTR/ENG tokens through Elementalz NFT feeding.
 *
 * On feed:
 * 1. Calculate burn_amount = feed_amount * burn_percent
 * 2. treasury_amount = feed_amount * treasury_percent
 * 3. Execute burn (irreversible)
 * 4. Transfer treasury_amount to treasury
 * 5. Update Elemental metadata (stats, happiness, aura)
 * 6. Apply cooldown
 */

import type {
  ElementalNFT,
  FeedingAllocationConfig,
  FeedingTransaction,
  ElementalStats,
  EvolutionStage,
  EvolutionCostModel,
  ScarcityEngagementModel,
} from './types';
import { DEFAULT_FEEDING_CONFIG, DEFAULT_EVOLUTION_COST, STAGE_INDEX } from './types';

// ─── Cooldown ───────────────────────────────────────────

const BASE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const DIMINISHING_FACTOR = 0.85; // Each consecutive feed extends cooldown

export function calculateCooldown(feedCount: number): number {
  return BASE_COOLDOWN_MS * Math.pow(1 / DIMINISHING_FACTOR, Math.min(feedCount, 20));
}

export function isOnCooldown(lastFedAt: string | undefined, feedCount: number): boolean {
  if (!lastFedAt) return false;
  const cooldown = calculateCooldown(feedCount);
  return Date.now() - new Date(lastFedAt).getTime() < cooldown;
}

// ─── Stat Gains ─────────────────────────────────────────

/** Calculate stat gains from feeding. Diminishing returns for rapid feeding. */
export function calculateStatGains(
  feedAmount: number,
  feedToken: 'WTR' | 'ENG',
  currentStats: ElementalStats,
  feedCount: number,
): Partial<ElementalStats> {
  // Diminishing return: gain decreases with recent feed frequency
  const diminishing = Math.max(0.2, 1 - (feedCount * 0.05));
  const baseGain = Math.sqrt(feedAmount) * diminishing;

  const gains: Partial<ElementalStats> = {
    impactPoints: Math.round(feedAmount * 10) / 10,
    happiness: Math.min(100, currentStats.happiness + Math.round(baseGain * 0.5)),
    auraIntensity: Math.min(100, currentStats.auraIntensity + Math.round(baseGain * 0.3)),
  };

  if (feedToken === 'WTR') {
    gains.harmony = Math.min(100, (currentStats.harmony ?? 0) + Math.round(baseGain * 0.4));
    gains.resilience = Math.min(100, (currentStats.resilience ?? 0) + Math.round(baseGain * 0.2));
  } else {
    gains.power = Math.min(100, (currentStats.power ?? 0) + Math.round(baseGain * 0.4));
    gains.resilience = Math.min(100, (currentStats.resilience ?? 0) + Math.round(baseGain * 0.3));
  }

  return gains;
}

// ─── Core Feeding Logic ─────────────────────────────────

export interface FeedResult {
  transaction: FeedingTransaction;
  updatedElemental: ElementalNFT;
  burnAmount: number;
  treasuryAmount: number;
}

export function feedElemental(
  elemental: ElementalNFT,
  feedToken: 'WTR' | 'ENG',
  feedAmount: number,
  config: FeedingAllocationConfig = DEFAULT_FEEDING_CONFIG,
): FeedResult {
  // Validate cooldown
  if (isOnCooldown(elemental.lastFedAt, elemental.feedCount)) {
    throw new Error('Elemental is on feeding cooldown');
  }

  if (feedAmount <= 0) throw new Error('Feed amount must be positive');

  // Calculate allocation
  const burnAmount = feedAmount * config.burnPercent;
  const treasuryAmount = feedAmount * config.treasuryPercent;

  // Calculate stat gains
  const gains = calculateStatGains(feedAmount, feedToken, elemental.stats, elemental.feedCount);

  // Build transaction
  const now = new Date().toISOString();
  const cooldown = calculateCooldown(elemental.feedCount + 1);

  const transaction: FeedingTransaction = {
    id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    elementalId: elemental.id,
    feedToken,
    feedAmount,
    burnAmount,
    treasuryAmount,
    statGains: gains,
    cooldownUntil: new Date(Date.now() + cooldown).toISOString(),
    timestamp: now,
  };

  // Update elemental
  const updatedStats: ElementalStats = {
    impactPoints: elemental.stats.impactPoints + (gains.impactPoints ?? 0),
    happiness: gains.happiness ?? elemental.stats.happiness,
    auraIntensity: gains.auraIntensity ?? elemental.stats.auraIntensity,
    power: gains.power ?? elemental.stats.power,
    resilience: gains.resilience ?? elemental.stats.resilience,
    harmony: gains.harmony ?? elemental.stats.harmony,
  };

  const updatedElemental: ElementalNFT = {
    ...elemental,
    stats: updatedStats,
    totalWtrFed: elemental.totalWtrFed + (feedToken === 'WTR' ? feedAmount : 0),
    totalEngFed: elemental.totalEngFed + (feedToken === 'ENG' ? feedAmount : 0),
    totalBurned: elemental.totalBurned + burnAmount,
    totalToTreasury: elemental.totalToTreasury + treasuryAmount,
    feedCount: elemental.feedCount + 1,
    lastFedAt: now,
    updatedAt: now,
  };

  return { transaction, updatedElemental, burnAmount, treasuryAmount };
}

// ─── Evolution ──────────────────────────────────────────

/** Calculate evolution cost for a given stage */
export function evolutionCost(
  targetStage: EvolutionStage,
  model: EvolutionCostModel = DEFAULT_EVOLUTION_COST,
): { wtrCost: number; engCost: number } {
  const idx = STAGE_INDEX[targetStage];
  return {
    wtrCost: Math.round(model.baseCostWtr * Math.pow(model.growthMultiplier, idx)),
    engCost: Math.round(model.baseCostEng * Math.pow(model.growthMultiplier, idx)),
  };
}

/** Check if an elemental can evolve to the next stage */
export function canEvolve(elemental: ElementalNFT): {
  canEvolve: boolean;
  nextStage?: EvolutionStage;
  cost?: { wtrCost: number; engCost: number };
  reason?: string;
} {
  const stages: EvolutionStage[] = ['Egg', 'Hatchling', 'Guardian', 'Ascended', 'Legendary'];
  const currentIdx = STAGE_INDEX[elemental.evolutionStage];

  if (currentIdx >= stages.length - 1) {
    return { canEvolve: false, reason: 'Already at maximum evolution' };
  }

  const nextStage = stages[currentIdx + 1];
  const cost = evolutionCost(nextStage);

  // Check if elemental has enough impact points (accumulated from feeding)
  const requiredPoints = cost.wtrCost + cost.engCost;
  if (elemental.stats.impactPoints < requiredPoints) {
    return {
      canEvolve: false,
      nextStage,
      cost,
      reason: `Needs ${requiredPoints} impact points (has ${Math.round(elemental.stats.impactPoints)})`,
    };
  }

  return { canEvolve: true, nextStage, cost };
}

// ─── Scarcity Model ─────────────────────────────────────

export function evaluateScarcity(
  totalSupply: number,
  burnRate: number,
  issuanceRate: number,
  engagementRate: number,
  sustainabilityRatio: number = 0.85,
): ScarcityEngagementModel {
  const healthZone = issuanceRate >= burnRate * sustainabilityRatio;
  const warningFlag = !healthZone;

  return {
    totalSupply,
    burnRate,
    engagementRate,
    issuanceRate,
    sustainabilityRatio,
    healthZone,
    warningFlag,
  };
}

/** Adaptive feedback: if burn pressure too high, increase evolution cost */
export function adaptiveCostAdjustment(
  scarcity: ScarcityEngagementModel,
  baseCost: EvolutionCostModel,
): EvolutionCostModel {
  if (scarcity.healthZone) return baseCost;

  // Increase costs proportionally to how far we are from healthy zone
  const pressure = scarcity.burnRate / (scarcity.issuanceRate * scarcity.sustainabilityRatio);
  const costMultiplier = Math.min(3.0, pressure); // Cap at 3x

  return {
    ...baseCost,
    baseCostWtr: Math.round(baseCost.baseCostWtr * costMultiplier),
    baseCostEng: Math.round(baseCost.baseCostEng * costMultiplier),
  };
}
