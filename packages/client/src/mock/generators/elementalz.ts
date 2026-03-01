/**
 * Elementalz Mock Data Generator
 * Generates a collection of 20 Elementalz NFTs with varied stats.
 */

import { createRng, pick, randInt, randFloat, uuid, daysAgo } from '../seed';

const ELEMENT_TYPES = ['Aqua', 'Volt', 'Terra', 'Aero', 'Pyra', 'Helio', 'Cryo', 'Hydrox', 'Luma', 'Umbra'] as const;
const RARITY_TIERS = ['Common', 'Rare', 'Epic', 'Mythic', 'Primal'] as const;
const RARITY_WEIGHTS = [60, 25, 10, 4, 1];
const EVOLUTION_STAGES = ['Egg', 'Hatchling', 'Guardian', 'Ascended', 'Legendary'] as const;

function pickWeighted<T>(items: readonly T[], weights: number[], rng: ReturnType<typeof createRng>): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = randFloat(rng, 0, total);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export interface MockElemental {
  id: string;
  name: string;
  elementType: typeof ELEMENT_TYPES[number];
  rarityTier: typeof RARITY_TIERS[number];
  evolutionStage: typeof EVOLUTION_STAGES[number];
  ownerWallet: string;
  stats: {
    impactPoints: number;
    happiness: number;
    auraIntensity: number;
    power: number;
    resilience: number;
    harmony: number;
  };
  imageUrl: string;
  totalWtrFed: number;
  totalEngFed: number;
  totalBurned: number;
  totalToTreasury: number;
  feedCount: number;
  lastFedAt: string;
  mintedAt: string;
}

export function generateElementalz(count: number = 20): MockElemental[] {
  const rng = createRng(0xE1E2);
  const elementalz: MockElemental[] = [];

  for (let i = 0; i < count; i++) {
    const elementType = pick(rng, [...ELEMENT_TYPES]);
    const rarity = pickWeighted(RARITY_TIERS, RARITY_WEIGHTS, rng);
    const stageIdx = Math.min(4, Math.floor(randFloat(rng, 0, 1) * (RARITY_TIERS.indexOf(rarity) + 2)));
    const stage = EVOLUTION_STAGES[stageIdx];

    const feedCount = randInt(rng, 0, 50 + stageIdx * 20);
    const totalWtrFed = randInt(rng, 0, 5000) * (stageIdx + 1);
    const totalEngFed = randInt(rng, 0, 3000) * (stageIdx + 1);
    const totalBurned = (totalWtrFed + totalEngFed) * 0.7;
    const totalToTreasury = (totalWtrFed + totalEngFed) * 0.3;

    elementalz.push({
      id: `elmz-${uuid(rng).slice(0, 8)}`,
      name: `${elementType} ${rarity === 'Primal' ? 'Prime' : rarity === 'Mythic' ? 'Ancient' : ''} #${i + 1}`.trim(),
      elementType,
      rarityTier: rarity,
      evolutionStage: stage,
      ownerWallet: `r${uuid(rng).slice(0, 20)}`,
      stats: {
        impactPoints: Math.round(totalWtrFed * 0.8 + totalEngFed * 0.6),
        happiness: randInt(rng, 30, 100),
        auraIntensity: randInt(rng, 10, 100),
        power: randInt(rng, 5, 80 + stageIdx * 10),
        resilience: randInt(rng, 5, 70 + stageIdx * 10),
        harmony: randInt(rng, 5, 75 + stageIdx * 10),
      },
      imageUrl: `/elementalz/${elementType.toLowerCase()}_${stage.toLowerCase()}.png`,
      totalWtrFed,
      totalEngFed,
      totalBurned: Math.round(totalBurned),
      totalToTreasury: Math.round(totalToTreasury),
      feedCount,
      lastFedAt: daysAgo(randInt(rng, 0, 14)),
      mintedAt: daysAgo(randInt(rng, 30, 365)),
    });
  }

  return elementalz;
}

/** Generate economy-level stats */
export function generateElementalzEconomy() {
  const elementalz = generateElementalz(20);
  return {
    totalWtrBurned: elementalz.reduce((s, e) => s + e.totalBurned * 0.6, 0),
    totalEngBurned: elementalz.reduce((s, e) => s + e.totalBurned * 0.4, 0),
    totalTreasuryReinforcement: elementalz.reduce((s, e) => s + e.totalToTreasury, 0),
    totalElementalz: elementalz.length,
    elementalz,
  };
}
