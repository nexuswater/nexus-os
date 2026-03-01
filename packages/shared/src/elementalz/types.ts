/**
 * Elementalz Types — Hybrid Deflationary NFT Companion System
 *
 * XLS-46d dynamic NFTs that consume WTR/ENG tokens.
 * Feeding: burns a % + sends rest to treasury. NEVER mints new tokens.
 */

// ─── Element Types ──────────────────────────────────────

export type ElementType =
  | 'Aqua' | 'Volt' | 'Terra' | 'Aero' | 'Pyra'
  | 'Helio' | 'Cryo' | 'Hydrox' | 'Luma' | 'Umbra';

export type EvolutionStage = 'Egg' | 'Hatchling' | 'Guardian' | 'Ascended' | 'Legendary';

export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Mythic' | 'Primal';

// ─── Elemental NFT ──────────────────────────────────────

export interface ElementalNFT {
  id: string;
  name: string;
  elementType: ElementType;
  rarityTier: RarityTier;
  evolutionStage: EvolutionStage;
  ownerWallet: string;

  // Dynamic stats (updated by feeding)
  stats: ElementalStats;

  // Visual metadata
  imageUrl: string;
  animationUrl?: string;
  metadataUri: string;

  // Feeding history
  totalWtrFed: number;
  totalEngFed: number;
  totalBurned: number;
  totalToTreasury: number;
  feedCount: number;
  lastFedAt?: string;

  // Evolution tracking
  evolutionHistory: EvolutionEvent[];

  // Bonding
  bondedSourceNodeId?: string;

  mintedAt: string;
  updatedAt: string;
}

export interface ElementalStats {
  impactPoints: number;
  happiness: number; // 0-100
  auraIntensity: number; // 0-100
  power: number;
  resilience: number;
  harmony: number;
}

export interface EvolutionEvent {
  fromStage: EvolutionStage;
  toStage: EvolutionStage;
  wtrCost: number;
  engCost: number;
  timestamp: string;
  txHash?: string;
}

// ─── Feeding Allocation ─────────────────────────────────

export interface FeedingAllocationConfig {
  /** Percentage burned (default 70%) */
  burnPercent: number;
  /** Percentage sent to treasury (default 30%) */
  treasuryPercent: number;
  /** Can be changed by governance */
  adjustableByGovernance: boolean;
  /** Minimum burn floor */
  minimumBurnFloor: number;
  /** Maximum treasury cap */
  maximumTreasuryCap: number;
}

export const DEFAULT_FEEDING_CONFIG: FeedingAllocationConfig = {
  burnPercent: 0.70,
  treasuryPercent: 0.30,
  adjustableByGovernance: true,
  minimumBurnFloor: 0.50,
  maximumTreasuryCap: 0.40,
};

// ─── Evolution Cost ─────────────────────────────────────

export interface EvolutionCostModel {
  baseCostWtr: number;
  baseCostEng: number;
  growthMultiplier: number;
  /** Whether mixed-feed (both WTR + ENG) is required */
  mixedFeedRequired: boolean;
}

export const DEFAULT_EVOLUTION_COST: EvolutionCostModel = {
  baseCostWtr: 10,
  baseCostEng: 5,
  growthMultiplier: 2.1,
  mixedFeedRequired: false,
};

export const STAGE_INDEX: Record<EvolutionStage, number> = {
  Egg: 0,
  Hatchling: 1,
  Guardian: 2,
  Ascended: 3,
  Legendary: 4,
};

// ─── Feeding Transaction ────────────────────────────────

export interface FeedingTransaction {
  id: string;
  elementalId: string;
  feedToken: 'WTR' | 'ENG';
  feedAmount: number;
  burnAmount: number;
  treasuryAmount: number;
  statGains: Partial<ElementalStats>;
  cooldownUntil?: string;
  txHash?: string;
  timestamp: string;
}

// ─── Scarcity Model ─────────────────────────────────────

export interface ScarcityEngagementModel {
  totalSupply: number;
  burnRate: number; // per epoch
  engagementRate: number; // 0-1
  issuanceRate: number;
  sustainabilityRatio: number; // default 0.85
  healthZone: boolean;
  warningFlag: boolean;
}

// ─── Economy Dashboard ──────────────────────────────────

export interface ElementalzEconomyStats {
  totalWtrBurned: number;
  totalEngBurned: number;
  totalTreasuryReinforcement: number;
  scarcityIndex: number; // 0-100
  engagementIndex: number; // 0-100
  evolutionDistribution: Record<EvolutionStage, number>;
  elementDistribution: Record<ElementType, number>;
  burnVsIssuanceRatio: number;
}
