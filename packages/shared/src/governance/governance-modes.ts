/**
 * Advanced Governance Modes — Linear, Quadratic, Hybrid
 * Each proposal defines its governance mode at creation.
 */

export type GovernanceMode = 'LINEAR' | 'QUADRATIC' | 'HYBRID';

export interface GovernanceModeConfig {
  mode: GovernanceMode;
  /** Base membership power for HYBRID mode */
  membershipBase: number;
  /** Quadratic coefficient (default 1.0) */
  quadraticCoefficient: number;
}

export const DEFAULT_MODE_CONFIG: GovernanceModeConfig = {
  mode: 'LINEAR',
  membershipBase: 100,
  quadraticCoefficient: 1.0,
};

/**
 * Transform raw governance weight to final voting power based on mode.
 *
 * LINEAR:    vote_power = governance_weight_total
 * QUADRATIC: vote_power = sqrt(governance_weight_total) * coefficient
 * HYBRID:    vote_power = membership_base + sqrt(mpt_weight) * coefficient
 */
export function transformVotingPower(
  rawWeight: number,
  mptWeight: number,
  config: GovernanceModeConfig,
): { rawWeight: number; transformedWeight: number; mode: GovernanceMode } {
  let transformedWeight: number;

  switch (config.mode) {
    case 'LINEAR':
      transformedWeight = rawWeight;
      break;
    case 'QUADRATIC':
      transformedWeight = Math.sqrt(rawWeight) * config.quadraticCoefficient;
      break;
    case 'HYBRID':
      transformedWeight = config.membershipBase + Math.sqrt(mptWeight) * config.quadraticCoefficient;
      break;
    default:
      transformedWeight = rawWeight;
  }

  return { rawWeight, transformedWeight, mode: config.mode };
}

/** Calculate whale dominance index for a set of voting powers */
export function whaleDominanceIndex(votingPowers: number[]): number {
  if (votingPowers.length === 0) return 0;
  const total = votingPowers.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  const sorted = [...votingPowers].sort((a, b) => b - a);
  const top10Pct = Math.max(1, Math.floor(sorted.length * 0.1));
  const top10Power = sorted.slice(0, top10Pct).reduce((s, v) => s + v, 0);
  return top10Power / total;
}

/** Calculate vote concentration (HHI — Herfindahl index) */
export function voteConcentrationIndex(votingPowers: number[]): number {
  if (votingPowers.length === 0) return 0;
  const total = votingPowers.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return votingPowers.reduce((hhi, vp) => hhi + Math.pow(vp / total, 2), 0);
}

/** Compare governance modes for the same set of raw weights */
export function compareModes(
  rawWeights: number[],
  mptWeights: number[],
  config: Partial<GovernanceModeConfig> = {},
): Record<GovernanceMode, { whaleDominance: number; concentration: number }> {
  const modes: GovernanceMode[] = ['LINEAR', 'QUADRATIC', 'HYBRID'];
  const result = {} as Record<GovernanceMode, { whaleDominance: number; concentration: number }>;

  for (const mode of modes) {
    const modeConfig: GovernanceModeConfig = {
      ...DEFAULT_MODE_CONFIG,
      ...config,
      mode,
    };
    const powers = rawWeights.map((rw, i) =>
      transformVotingPower(rw, mptWeights[i] ?? 0, modeConfig).transformedWeight
    );
    result[mode] = {
      whaleDominance: whaleDominanceIndex(powers),
      concentration: voteConcentrationIndex(powers),
    };
  }

  return result;
}
