/**
 * XSPECTAR Metaverse Integration
 * 3D avatar companions, shrine mechanics, tournament arenas.
 */

export interface MetaverseConfig {
  enabled: boolean;
  xspectarCompatible: boolean;
  animationUrlSupport: boolean;
  /** Performance tier for rendering */
  renderTier: 'low' | 'medium' | 'high';
}

export const DEFAULT_METAVERSE_CONFIG: MetaverseConfig = {
  enabled: true,
  xspectarCompatible: true,
  animationUrlSupport: true,
  renderTier: 'medium',
};

export interface MetaverseElemental {
  elementalId: string;
  /** 3D model URL for metaverse rendering */
  modelUrl: string;
  /** Idle animation loop */
  idleAnimationUrl: string;
  /** Aura scale based on evolution level */
  auraScale: number;
  /** Source Node visual tether */
  bondedNodeId?: string;
  bondedNodeTetherColor?: string;
  /** Size modifier based on rarity */
  sizeModifier: number;
  /** Particle effects */
  particleSystem: string;
}

export interface ElementalShrine {
  id: string;
  landId: string;
  elementalId: string;
  /** Aura boost for land-locked elementals */
  auraBoostPercent: number;
  /** Visual effects on the land parcel */
  shrineEffects: string[];
  createdAt: string;
}

export interface TournamentArena {
  id: string;
  name: string;
  seasonId: string;
  capacity: number;
  /** Active competition running in this arena */
  activeCompetitionId?: string;
  /** Visual theme */
  theme: 'water' | 'fire' | 'earth' | 'lightning' | 'cosmic';
}

export interface GovernanceHall {
  id: string;
  name: string;
  /** Top governance contributors displayed */
  legendEntries: Array<{
    userId: string;
    elementalId: string;
    achievementCount: number;
    totalImpact: number;
  }>;
}

/** Calculate metaverse aura scale from evolution + rarity */
export function calculateAuraScale(
  evolutionStageIndex: number,
  rarityMultiplier: number,
): number {
  const base = 0.5 + (evolutionStageIndex * 0.25);
  return Math.round(base * rarityMultiplier * 100) / 100;
}

/** Calculate shrine aura boost */
export function shrineAuraBoost(
  elementalAuraIntensity: number,
  landTier: number,
): number {
  return Math.round(elementalAuraIntensity * 0.1 * landTier);
}
