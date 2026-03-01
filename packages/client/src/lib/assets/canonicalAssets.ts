/**
 * Canonical Asset Registry — Nexus OS
 *
 * All tokens and assets recognized by the platform.
 * UI components consume this registry; never hardcode token info in pages.
 * To add a new token: add an entry here and it appears everywhere.
 */

/** Asset kind */
export type AssetKind = 'governance' | 'impact_mpt' | 'stablecoin' | 'native' | 'liquidity_pool';

/** Risk tier for marketplace/yield */
export type RiskTier = 'low' | 'medium' | 'high';

/** Per-chain EVM representation */
export interface EVMAssetConfig {
  chainKey: string;
  address: string;
  decimals: number;
}

/** XRPL representation */
export interface XRPLAssetConfig {
  issuer: string;
  currencyCode: string;
  isMPT: boolean;
  mptIssuanceId?: string;
}

/** Full asset definition */
export interface CanonicalAsset {
  /** Ticker symbol */
  symbol: string;
  /** Display name */
  name: string;
  /** Asset kind */
  kind: AssetKind;
  /** Risk tier */
  riskTier: RiskTier;
  /** Short description */
  description: string;
  /** CSS color class for UI theming */
  colorClass: string;
  /** XRPL representation (null if EVM-only) */
  xrpl: XRPLAssetConfig | null;
  /** EVM representations per chain */
  evm: EVMAssetConfig[];
  /** Cross-chain bridging enabled */
  crossChainEnabled: boolean;
  /** Policy tags for marketplace compliance */
  policyTags: string[];
  /** Icon identifier (for UI) */
  icon: string;
  /** Sort order in lists */
  sortOrder: number;
}

// ─── Registry ────────────────────────────────────────────

export const CANONICAL_ASSETS: CanonicalAsset[] = [
  // ── Governance Token ──
  {
    symbol: 'NXS',
    name: 'Nexus',
    kind: 'governance',
    riskTier: 'low',
    description: 'Primary governance and utility token',
    colorClass: 'text-nexus-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'NXS', isMPT: false },
    evm: [
      { chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'XRPL_EVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'ARBITRUM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'HYPEREVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    crossChainEnabled: true,
    policyTags: ['governance', 'stakeable'],
    icon: 'nexus',
    sortOrder: 0,
  },

  // ── Impact MPTs ──
  {
    symbol: 'WTR',
    name: 'Water Credit',
    kind: 'impact_mpt',
    riskTier: 'low',
    description: 'Tokenized water generation credits with linear retirement',
    colorClass: 'text-water-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'WTR', isMPT: true, mptIssuanceId: 'WTR_MPT_001' },
    evm: [
      { chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'XRPL_EVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    crossChainEnabled: true,
    policyTags: ['impact', 'retireable', 'tradeable'],
    icon: 'droplet',
    sortOrder: 1,
  },
  {
    symbol: 'ENG',
    name: 'Energy Credit',
    kind: 'impact_mpt',
    riskTier: 'low',
    description: 'Tokenized energy generation credits with linear retirement',
    colorClass: 'text-energy-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'ENG', isMPT: true, mptIssuanceId: 'ENG_MPT_001' },
    evm: [
      { chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'XRPL_EVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    crossChainEnabled: true,
    policyTags: ['impact', 'retireable', 'tradeable'],
    icon: 'zap',
    sortOrder: 2,
  },

  // ── Plugin MPTs ──
  {
    symbol: 'GLD',
    name: 'Gold Reserve',
    kind: 'impact_mpt',
    riskTier: 'medium',
    description: 'Tokenized gold-backed reserve credit',
    colorClass: 'text-yellow-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'GLD', isMPT: true, mptIssuanceId: 'GLD_MPT_001' },
    evm: [{ chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 }],
    crossChainEnabled: false,
    policyTags: ['impact', 'tradeable'],
    icon: 'gem',
    sortOrder: 10,
  },
  {
    symbol: 'FOD',
    name: 'Food Security',
    kind: 'impact_mpt',
    riskTier: 'medium',
    description: 'Tokenized food production and distribution credit',
    colorClass: 'text-green-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'FOD', isMPT: true, mptIssuanceId: 'FOD_MPT_001' },
    evm: [{ chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 }],
    crossChainEnabled: false,
    policyTags: ['impact', 'tradeable'],
    icon: 'leaf',
    sortOrder: 11,
  },
  {
    symbol: 'HLM',
    name: 'Health Merit',
    kind: 'impact_mpt',
    riskTier: 'medium',
    description: 'Tokenized health infrastructure contribution',
    colorClass: 'text-pink-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'HLM', isMPT: true, mptIssuanceId: 'HLM_MPT_001' },
    evm: [{ chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 }],
    crossChainEnabled: false,
    policyTags: ['impact', 'tradeable'],
    icon: 'heart',
    sortOrder: 12,
  },
  {
    symbol: 'RKT',
    name: 'Rocket Fuel',
    kind: 'impact_mpt',
    riskTier: 'high',
    description: 'Tokenized clean propulsion research credit',
    colorClass: 'text-orange-400',
    xrpl: { issuer: 'rNexusIssuerPlaceholder', currencyCode: 'RKT', isMPT: true, mptIssuanceId: 'RKT_MPT_001' },
    evm: [{ chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 }],
    crossChainEnabled: false,
    policyTags: ['impact', 'tradeable', 'experimental'],
    icon: 'rocket',
    sortOrder: 13,
  },

  // ── Native / Stablecoins ──
  {
    symbol: 'XRP',
    name: 'XRP',
    kind: 'native',
    riskTier: 'low',
    description: 'Native XRPL asset',
    colorClass: 'text-gray-300',
    xrpl: { issuer: '', currencyCode: 'XRP', isMPT: false },
    evm: [{ chainKey: 'XRPL_EVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 }],
    crossChainEnabled: false,
    policyTags: ['native'],
    icon: 'coins',
    sortOrder: 20,
  },
  {
    symbol: 'RLUSD',
    name: 'RLUSD',
    kind: 'stablecoin',
    riskTier: 'low',
    description: 'Ripple USD stablecoin',
    colorClass: 'text-blue-300',
    xrpl: { issuer: 'rRLUSDIssuerPlaceholder', currencyCode: 'RLUSD', isMPT: false },
    evm: [
      { chainKey: 'BASE', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
      { chainKey: 'XRPL_EVM', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    ],
    crossChainEnabled: true,
    policyTags: ['stablecoin'],
    icon: 'dollar-sign',
    sortOrder: 21,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    kind: 'stablecoin',
    riskTier: 'low',
    description: 'Circle USD stablecoin (EVM)',
    colorClass: 'text-blue-400',
    xrpl: null,
    evm: [
      { chainKey: 'BASE', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      { chainKey: 'ARBITRUM', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    ],
    crossChainEnabled: true,
    policyTags: ['stablecoin'],
    icon: 'dollar-sign',
    sortOrder: 22,
  },
];

// ─── Helpers ─────────────────────────────────────────────

/** Get all assets */
export function getAllAssets(): CanonicalAsset[] {
  return [...CANONICAL_ASSETS].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get asset by symbol */
export function getAsset(symbol: string): CanonicalAsset | undefined {
  return CANONICAL_ASSETS.find(a => a.symbol === symbol);
}

/** Get assets by kind */
export function getAssetsByKind(kind: AssetKind): CanonicalAsset[] {
  return CANONICAL_ASSETS.filter(a => a.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get assets available on a specific chain */
export function getAssetsForChain(chainKey: string): CanonicalAsset[] {
  return CANONICAL_ASSETS.filter(a =>
    a.evm.some(e => e.chainKey === chainKey) || (chainKey === 'XRPL' && a.xrpl !== null)
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get cross-chain enabled assets */
export function getCrossChainAssets(): CanonicalAsset[] {
  return CANONICAL_ASSETS.filter(a => a.crossChainEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get the EVM config for an asset on a specific chain */
export function getEVMConfig(symbol: string, chainKey: string): EVMAssetConfig | undefined {
  const asset = getAsset(symbol);
  return asset?.evm.find(e => e.chainKey === chainKey);
}

/** Get tradeable assets (marketplace) */
export function getTradeableAssets(): CanonicalAsset[] {
  return CANONICAL_ASSETS.filter(a => a.policyTags.includes('tradeable')).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get governance-relevant assets */
export function getGovernanceAssets(): CanonicalAsset[] {
  return CANONICAL_ASSETS.filter(a => a.policyTags.includes('governance') || a.policyTags.includes('impact')).sort((a, b) => a.sortOrder - b.sortOrder);
}
