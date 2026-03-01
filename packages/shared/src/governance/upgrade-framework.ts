/**
 * Protocol Upgrade Framework — Feature-flag governance
 * All upgrades require governance vote. Supports rollback.
 */

export interface FeatureFlags {
  enable_quadratic: boolean;
  enable_locking: boolean;
  enable_dividends: boolean;
  enable_federation: boolean;
  enable_ai_advisor: boolean;
  enable_transparency_portal: boolean;
  enable_anti_capture: boolean;
  enable_emission_engine: boolean;
  enable_treasury_strategies: boolean;
  enable_constitutional_anchoring: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enable_quadratic: false,
  enable_locking: false,
  enable_dividends: false,
  enable_federation: false,
  enable_ai_advisor: false,
  enable_transparency_portal: true,
  enable_anti_capture: true,
  enable_emission_engine: false,
  enable_treasury_strategies: false,
  enable_constitutional_anchoring: false,
};

export interface UpgradeProposal {
  id: string;
  version: string;
  title: string;
  description: string;
  migrationPlanHash: string;
  featureFlagChanges: Partial<FeatureFlags>;
  requiredQuorum: number;
  activationEpoch: number;
  rollbackPlan: string;
  status: 'proposed' | 'approved' | 'activated' | 'rolled_back';
  proposalId: string;
  createdAt: string;
  activatedAt?: string;
}

export interface ProtocolVersion {
  version: string;
  activatedAt: string;
  features: FeatureFlags;
  upgradeProposalId: string;
}

/** Apply feature flag changes from an upgrade */
export function applyFeatureFlags(
  current: FeatureFlags,
  changes: Partial<FeatureFlags>,
): FeatureFlags {
  return { ...current, ...changes };
}

/** Check if a feature is enabled */
export function isFeatureEnabled(
  flags: FeatureFlags,
  feature: keyof FeatureFlags,
): boolean {
  return flags[feature] === true;
}

/** Validate upgrade proposal */
export function validateUpgrade(
  proposal: UpgradeProposal,
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!proposal.rollbackPlan || proposal.rollbackPlan.length < 10) {
    warnings.push('Rollback plan is missing or too short');
  }

  if (!proposal.migrationPlanHash) {
    warnings.push('Migration plan hash is required');
  }

  const flagChanges = Object.keys(proposal.featureFlagChanges);
  if (flagChanges.length > 5) {
    warnings.push(`${flagChanges.length} flag changes in one upgrade — consider splitting`);
  }

  return { valid: warnings.length === 0, warnings };
}

/** Build version history from upgrades */
export function buildVersionHistory(
  upgrades: UpgradeProposal[],
  initialFlags: FeatureFlags = DEFAULT_FEATURE_FLAGS,
): ProtocolVersion[] {
  const history: ProtocolVersion[] = [];
  let currentFlags = { ...initialFlags };

  const activated = upgrades
    .filter(u => u.status === 'activated' && u.activatedAt)
    .sort((a, b) => new Date(a.activatedAt!).getTime() - new Date(b.activatedAt!).getTime());

  for (const upgrade of activated) {
    currentFlags = applyFeatureFlags(currentFlags, upgrade.featureFlagChanges);
    history.push({
      version: upgrade.version,
      activatedAt: upgrade.activatedAt!,
      features: { ...currentFlags },
      upgradeProposalId: upgrade.id,
    });
  }

  return history;
}
