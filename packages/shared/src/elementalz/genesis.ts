/**
 * Elementalz Genesis Collection — Drop Strategy + Rarity Mathematics
 *
 * Collection: "Elementalz: Genesis Core"
 * Supply: Configurable (default 5,555)
 * Mint phases: Source Node Allowlist → DAO Member → Public
 */

import type { ElementType, RarityTier, EvolutionStage } from './types';

// ─── Genesis Config ─────────────────────────────────────

export interface GenesisConfig {
  collectionName: string;
  totalSupply: number;
  mintPhases: MintPhase[];
  revenueAllocation: RevenueAllocation;
  antiBotProtection: AntiBotConfig;
}

export interface MintPhase {
  id: string;
  name: string;
  description: string;
  /** Phase order (1, 2, 3) */
  order: number;
  /** Allocation as count or percentage */
  allocation: number;
  /** Price in XRP */
  priceXRP: number;
  /** Discount percentage (0-1) for burn-discount */
  burnDiscount: number;
  /** Max mints per wallet */
  maxPerWallet: number;
  /** Eligibility requirement */
  eligibility: 'source_node_holder' | 'dao_member' | 'public';
  /** Free mint for specific tier? */
  freeMintTier?: string;
  status: 'upcoming' | 'active' | 'completed';
  startsAt: string;
  endsAt: string;
}

export interface RevenueAllocation {
  treasury: number;      // 40%
  development: number;   // 30%
  liquidityReserve: number; // 15%
  seasonalPrizePool: number; // 15%
}

export const DEFAULT_REVENUE_ALLOCATION: RevenueAllocation = {
  treasury: 0.40,
  development: 0.30,
  liquidityReserve: 0.15,
  seasonalPrizePool: 0.15,
};

export interface AntiBotConfig {
  walletSignatureRequired: boolean;
  mintCooldownMs: number;
  maxPerWallet: number;
  captchaRequired: boolean;
}

export const DEFAULT_GENESIS_CONFIG: GenesisConfig = {
  collectionName: 'Elementalz: Genesis Core',
  totalSupply: 5555,
  mintPhases: [
    {
      id: 'phase-1-sn',
      name: 'Source Node Allowlist',
      description: 'Guaranteed mint window for Source Node holders',
      order: 1,
      allocation: 2000,
      priceXRP: 150,
      burnDiscount: 0.15,
      maxPerWallet: 3,
      eligibility: 'source_node_holder',
      freeMintTier: 'Legendary',
      status: 'upcoming',
      startsAt: '2026-04-01T00:00:00Z',
      endsAt: '2026-04-03T00:00:00Z',
    },
    {
      id: 'phase-2-dao',
      name: 'DAO Member Allowlist',
      description: 'Limited allocation for active governance participants',
      order: 2,
      allocation: 1555,
      priceXRP: 200,
      burnDiscount: 0.10,
      maxPerWallet: 2,
      eligibility: 'dao_member',
      status: 'upcoming',
      startsAt: '2026-04-03T00:00:00Z',
      endsAt: '2026-04-05T00:00:00Z',
    },
    {
      id: 'phase-3-public',
      name: 'Public Mint',
      description: 'Open mint with Dutch auction pricing',
      order: 3,
      allocation: 2000,
      priceXRP: 250,
      burnDiscount: 0,
      maxPerWallet: 5,
      eligibility: 'public',
      status: 'upcoming',
      startsAt: '2026-04-05T00:00:00Z',
      endsAt: '2026-04-07T00:00:00Z',
    },
  ],
  revenueAllocation: DEFAULT_REVENUE_ALLOCATION,
  antiBotProtection: {
    walletSignatureRequired: true,
    mintCooldownMs: 30000,
    maxPerWallet: 5,
    captchaRequired: false,
  },
};

// ─── Rarity Mathematics ─────────────────────────────────

export interface RarityDistribution {
  tier: RarityTier;
  percentage: number;
  count: number;
  baseStatMultiplier: number;
  evolutionCeiling: EvolutionStage;
  auraIntensityBase: number;
  metaverseSizeModifier: number;
}

export function calculateRarityDistribution(totalSupply: number): RarityDistribution[] {
  return [
    {
      tier: 'Common',
      percentage: 60,
      count: Math.floor(totalSupply * 0.60),
      baseStatMultiplier: 1.0,
      evolutionCeiling: 'Guardian',
      auraIntensityBase: 20,
      metaverseSizeModifier: 1.0,
    },
    {
      tier: 'Rare',
      percentage: 25,
      count: Math.floor(totalSupply * 0.25),
      baseStatMultiplier: 1.15,
      evolutionCeiling: 'Ascended',
      auraIntensityBase: 40,
      metaverseSizeModifier: 1.1,
    },
    {
      tier: 'Epic',
      percentage: 10,
      count: Math.floor(totalSupply * 0.10),
      baseStatMultiplier: 1.35,
      evolutionCeiling: 'Ascended',
      auraIntensityBase: 60,
      metaverseSizeModifier: 1.2,
    },
    {
      tier: 'Mythic',
      percentage: 4,
      count: Math.floor(totalSupply * 0.04),
      baseStatMultiplier: 1.6,
      evolutionCeiling: 'Legendary',
      auraIntensityBase: 80,
      metaverseSizeModifier: 1.35,
    },
    {
      tier: 'Primal',
      percentage: 1,
      count: Math.ceil(totalSupply * 0.01),
      baseStatMultiplier: 2.0,
      evolutionCeiling: 'Legendary',
      auraIntensityBase: 100,
      metaverseSizeModifier: 1.5,
    },
  ];
}

// ─── Trait System ────────────────────────────────────────

export type TraitCategory =
  | 'Element Type'
  | 'Alignment'
  | 'Aura Pattern'
  | 'Eye Style'
  | 'Core Sigil'
  | 'Mutation Mark'
  | 'Background Realm';

export interface Trait {
  category: TraitCategory;
  value: string;
  rarity: number; // 0-1 (lower = rarer)
}

export interface TraitRules {
  maxDuplicateTraitCombinations: number;
  ultraRareCombinationCap: number;
  primalTierMintCap: number;
}

export const DEFAULT_TRAIT_RULES: TraitRules = {
  maxDuplicateTraitCombinations: 3,
  ultraRareCombinationCap: 10,
  primalTierMintCap: 56, // ~1% of 5,555
};

// ─── Anime Art Specification ────────────────────────────

export interface ElementVisualSpec {
  elementType: ElementType;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  particleType: string;
  visualTraits: string[];
}

export const ELEMENT_VISUAL_SPECS: ElementVisualSpec[] = [
  { elementType: 'Aqua', primaryColor: '#00D4FF', secondaryColor: '#0088AA', glowColor: '#00D4FF44', particleType: 'bioluminescent', visualTraits: ['Fluid translucent edges', 'Bioluminescent particles', 'Water ripple effects'] },
  { elementType: 'Volt', primaryColor: '#FFD700', secondaryColor: '#FF8C00', glowColor: '#FFD70044', particleType: 'electric_arc', visualTraits: ['Electric arc overlays', 'Pulsing circuitry tattoos', 'Lightning corona'] },
  { elementType: 'Terra', primaryColor: '#4CAF50', secondaryColor: '#2E7D32', glowColor: '#4CAF5044', particleType: 'crystal', visualTraits: ['Crystal growth patterns', 'Moss/stone armor accents', 'Geo-fractals'] },
  { elementType: 'Aero', primaryColor: '#90CAF9', secondaryColor: '#42A5F5', glowColor: '#90CAF944', particleType: 'wind_ribbon', visualTraits: ['Floating wind ribbons', 'Feathered light effects', 'Cloud wisps'] },
  { elementType: 'Pyra', primaryColor: '#FF5722', secondaryColor: '#D84315', glowColor: '#FF572244', particleType: 'ember', visualTraits: ['Ember glow core', 'Flame aura distortions', 'Heat shimmer'] },
  { elementType: 'Helio', primaryColor: '#FFC107', secondaryColor: '#FF9800', glowColor: '#FFC10744', particleType: 'solar_flare', visualTraits: ['Solar flare crown', 'Golden radiant halo', 'Sun spots'] },
  { elementType: 'Cryo', primaryColor: '#B3E5FC', secondaryColor: '#4FC3F7', glowColor: '#B3E5FC44', particleType: 'frost', visualTraits: ['Frost shards', 'Ice crystal fractals', 'Snow particle trail'] },
  { elementType: 'Hydrox', primaryColor: '#E0E0E0', secondaryColor: '#9E9E9E', glowColor: '#E0E0E044', particleType: 'molecular', visualTraits: ['Hydrogen molecular sigil', 'Clean white plasma aura', 'Atomic rings'] },
  { elementType: 'Luma', primaryColor: '#CE93D8', secondaryColor: '#AB47BC', glowColor: '#CE93D844', particleType: 'prismatic', visualTraits: ['Soft radiant beams', 'Prismatic reflections', 'Rainbow diffraction'] },
  { elementType: 'Umbra', primaryColor: '#37474F', secondaryColor: '#1A1A2E', glowColor: '#37474F44', particleType: 'void', visualTraits: ['Dark void energy', 'Carbon-black flame edges', 'Shadow tendrils'] },
];
