import type { NetworkMode, AppMode } from '@nexus/shared';

export const APP_NAME = 'Nexus OS';
export const APP_VERSION = '0.1.0';

export const DEFAULT_NETWORK: NetworkMode = 'testnet';
export const DEFAULT_APP_MODE: AppMode = 'web';

export const API_BASE_URL = '/api';

/** XRPL network endpoints */
export const XRPL_ENDPOINTS: Record<NetworkMode, string> = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233',
};

/** Navigation items for web layout */
export const WEB_NAV_ITEMS = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Assets', path: '/assets', icon: 'wallet' },
  { label: 'Mint', path: '/mint', icon: 'plus-circle' },
  { label: 'Marketplace', path: '/marketplace', icon: 'shopping-cart' },
  { label: 'DAO', path: '/dao', icon: 'landmark' },
  { label: 'Impact', path: '/impact', icon: 'bar-chart' },
  { label: 'Map', path: '/map', icon: 'globe' },
  { label: 'Profile', path: '/profile', icon: 'user' },
] as const;

/** Navigation items for xApp layout (reduced set) */
export const XAPP_NAV_ITEMS = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Assets', path: '/assets', icon: 'wallet' },
  { label: 'Marketplace', path: '/marketplace', icon: 'shopping-cart' },
  { label: 'DAO', path: '/dao', icon: 'landmark' },
  { label: 'Impact', path: '/impact', icon: 'bar-chart' },
] as const;

/** Admin nav (role-gated) */
export const ADMIN_NAV_ITEMS = [
  { label: 'Proof Queue', path: '/admin/proofs', icon: 'clipboard-check' },
  { label: 'Allowlist', path: '/admin/allowlist', icon: 'shield' },
  { label: 'Emergency', path: '/admin/emergency', icon: 'alert-triangle' },
  { label: 'Audit Log', path: '/admin/audit', icon: 'file-text' },
] as const;
