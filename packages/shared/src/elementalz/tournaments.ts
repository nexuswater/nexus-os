/**
 * Seasonal Competitive Tournaments
 * 90-day seasons with impact-based scoring.
 * Anti-spam normalization with diminishing scoring curve.
 */

export interface Season {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  durationDays: 90;
  status: 'upcoming' | 'active' | 'completed';
  competitions: Competition[];
  prizePool: PrizePool;
}

export type CompetitionType =
  | 'impact_score'
  | 'governance_streak'
  | 'evolution_race'
  | 'burn_contribution'
  | 'federation_alliance';

export interface Competition {
  id: string;
  type: CompetitionType;
  name: string;
  description: string;
  scoringInputs: ScoringInput[];
  leaderboard: LeaderboardEntry[];
  maxParticipants?: number;
}

export interface ScoringInput {
  metric: string;
  weight: number;
  diminishingCurve: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  elementalId: string;
  elementalName: string;
  score: number;
  breakdown: Record<string, number>;
}

export interface PrizePool {
  cosmeticAuras: number;
  limitedBadges: number;
  loreNFTs: number;
  treasuryRewards: number; // governance-approved
  totalValueXRP: number;
}

/** Calculate tournament score with diminishing returns */
export function calculateTournamentScore(
  inputs: Array<{ value: number; weight: number; diminishing: boolean }>,
): number {
  return inputs.reduce((total, input) => {
    const raw = input.value * input.weight;
    // Diminishing: sqrt scaling prevents spam dominance
    return total + (input.diminishing ? Math.sqrt(raw) * 10 : raw);
  }, 0);
}

/** Anti-spam normalization: cap score contribution per epoch */
export function normalizeScore(rawScore: number, epochCount: number): number {
  if (epochCount <= 0) return 0;
  // Score per epoch, with diminishing returns on high-frequency contribution
  const perEpoch = rawScore / epochCount;
  return Math.sqrt(perEpoch) * epochCount * 0.5;
}

// ─── Achievement Badges ─────────────────────────────────

export type BadgeType =
  | 'first_evolution'
  | 'governance_guardian'
  | 'participation_streak_30'
  | 'impact_champion'
  | 'lock_master'
  | 'federation_founder'
  | 'genesis_holder'
  | 'legendary_bond';

export interface AchievementBadge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  imageUrl: string;
  /** Soulbound — non-transferable */
  soulbound: true;
  /** XLS-20 static NFT */
  standard: 'XLS-20';
  earnedAt: string;
  txHash?: string;
}

export const BADGE_DEFINITIONS: Record<BadgeType, { name: string; description: string; icon: string }> = {
  first_evolution: { name: 'First Evolution', description: 'Evolved an Elemental for the first time', icon: '🥚→🐣' },
  governance_guardian: { name: 'Governance Guardian', description: 'Voted on 10+ proposals', icon: '🏛️' },
  participation_streak_30: { name: '30-Day Streak', description: 'Participated in governance for 30 consecutive days', icon: '🔥' },
  impact_champion: { name: 'Impact Champion', description: 'Burned 10,000+ WTR/ENG through feeding', icon: '🌍' },
  lock_master: { name: 'Lock Master', description: 'Maintained a lock position for 12+ months', icon: '🔒' },
  federation_founder: { name: 'Federation Founder', description: 'Participated in a cross-DAO federation vote', icon: '🤝' },
  genesis_holder: { name: 'Genesis Holder', description: 'Minted during the Genesis drop', icon: '⭐' },
  legendary_bond: { name: 'Legendary Bond', description: 'Bonded a Legendary Source Node to an Elemental', icon: '💎' },
};
