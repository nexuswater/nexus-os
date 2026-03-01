/** User roles within the Nexus Water DAO ecosystem */
export type UserRole =
  | 'user'
  | 'installer'
  | 'partner'
  | 'auditor'
  | 'oracle'
  | 'council'
  | 'treasury_operator';

/** Wallet entity — canonical identity record tied to an XRPL address */
export interface Wallet {
  wallet_address: string;
  roles: UserRole[];
  eligibility: WalletEligibility;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

/** Feature gates controlled by role + compliance status */
export interface WalletEligibility {
  market_enabled: boolean;
  mint_enabled: boolean;
  vote_enabled: boolean;
  proposal_enabled: boolean;
}

/** Session state after wallet connection */
export interface WalletSession {
  wallet: Wallet;
  connected_via: 'xaman' | 'gem' | 'crossmark' | 'manual';
  session_token: string;
  expires_at: string;
}

// ─── Multi-Rail Wallet Types ───────────────────────────────

/** XRPL wallet connector type */
export type XRPLConnector = 'xaman' | 'anodos' | 'gem' | 'crossmark';

/** EVM wallet connector type */
export type EVMConnector = 'metamask' | 'walletconnect';

/** Individual wallet connection on a specific rail */
export interface RailWallet {
  rail: 'xrpl' | 'evm';
  address: string;
  connector: XRPLConnector | EVMConnector;
  chainId?: number;
}

/** Balances for a connected wallet */
export interface WalletBalances {
  /** NXS balance (governance token) */
  nxs: number;
  /** XRP balance (native XRPL) */
  xrp: number;
  /** RLUSD balance (stablecoin) */
  rlusd: number;
}

/** Combined multi-rail wallet state */
export interface MultiRailWalletState {
  xrpl: RailWallet | null;
  evm: RailWallet | null;
  xrplBalances: WalletBalances;
  evmBalances: WalletBalances;
}
