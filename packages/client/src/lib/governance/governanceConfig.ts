/**
 * Governance Config Helpers
 *
 * Provides local fallback and remote fetch for the cross-rail governance
 * configuration. UI components use this to determine how voting power
 * is calculated and displayed.
 */

import type { CrossRailGovernanceConfig } from '@nexus/shared';

/** Local fallback governance config used when the API is unreachable */
export const LOCAL_GOVERNANCE_CONFIG: CrossRailGovernanceConfig = {
  crossRailEnabled: true,
  evmVotingEnabled: true,
  xrplVotingEnabled: true,
  impactWeightingXRPLOnly: true,
  nftMultiplierXRPLOnly: true,
};

/**
 * Fetch the cross-rail governance config from the API.
 * Falls back to LOCAL_GOVERNANCE_CONFIG on failure.
 */
export async function fetchGovernanceConfig(): Promise<CrossRailGovernanceConfig> {
  try {
    const res = await fetch('/api/swap/governance-config');
    if (!res.ok) {
      console.warn('[GovernanceConfig] API returned', res.status);
      return LOCAL_GOVERNANCE_CONFIG;
    }
    const json = await res.json();
    return json.data ?? LOCAL_GOVERNANCE_CONFIG;
  } catch {
    return LOCAL_GOVERNANCE_CONFIG;
  }
}
