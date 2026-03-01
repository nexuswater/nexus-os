import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  Wallet,
  WalletSession,
  UserRole,
  RailWallet,
  WalletBalances,
  MultiRailWalletState,
} from '@nexus/shared';
import { NEXUS_CHAINS, findChainByChainId } from '@nexus/shared';
import { switchNetwork } from '@/lib/evm/evmClient';

interface WalletState {
  /** Current wallet session, null if not connected */
  session: WalletSession | null;
  /** Whether a connection attempt is in progress */
  connecting: boolean;
  /** Connect via Xaman (XRPL) */
  connectXaman: () => Promise<void>;
  /** Connect via Anodos (XRPL) */
  connectAnodos: () => Promise<void>;
  /** Connect via MetaMask (EVM) */
  connectMetaMask: () => Promise<void>;
  /** Connect via WalletConnect (EVM) */
  connectWalletConnect: () => Promise<void>;
  /** Disconnect all wallets */
  disconnect: () => void;
  /** Disconnect a specific rail */
  disconnectRail: (rail: 'xrpl' | 'evm') => void;
  /** Check if wallet has a specific role */
  hasRole: (role: UserRole) => boolean;
  /** Shorthand: wallet address or null */
  address: string | null;
  // ─── Multi-Rail ───────────────────────────────────
  /** Connected XRPL wallet info */
  xrplWallet: RailWallet | null;
  /** Connected EVM wallet info */
  evmWallet: RailWallet | null;
  /** XRPL rail balances */
  xrplBalances: WalletBalances;
  /** EVM rail balances */
  evmBalances: WalletBalances;
  /** List of currently connected rails */
  connectedRails: ('xrpl' | 'evm')[];
  // ─── EVM Chain Awareness ─────────────────────────
  /** Current EVM chain ID from injected provider */
  evmChainId: number | null;
  /** Current EVM chain display name */
  evmChainName: string | null;
  /** Whether the connected EVM chain is in the Nexus registry */
  isOnSupportedChain: boolean;
  /** Whether the connected EVM chain is the governance hub */
  isOnHub: boolean;
  /** Request the injected wallet to switch EVM network */
  switchToChain: (chainKey: string) => Promise<void>;
  /** Current connectivity mode */
  activeMode: 'xrpl' | 'evm' | 'dual' | 'disconnected';
}

const DEFAULT_BALANCES: WalletBalances = { nxs: 0, xrp: 0, rlusd: 0 };

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Multi-rail wallet state
  const [xrplWallet, setXrplWallet] = useState<RailWallet | null>(null);
  const [evmWallet, setEvmWallet] = useState<RailWallet | null>(null);
  const [xrplBalances, setXrplBalances] = useState<WalletBalances>(DEFAULT_BALANCES);
  const [evmBalances, setEvmBalances] = useState<WalletBalances>(DEFAULT_BALANCES);

  // ─── EVM Chain Awareness ──────────────────────────────
  const [evmChainId, setEvmChainId] = useState<number | null>(null);
  const [evmChainName, setEvmChainName] = useState<string | null>(null);

  // Read initial chain from injected provider & listen for changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    // Read current chain
    eth.request({ method: 'eth_chainId' })
      .then((hex: string) => {
        const id = parseInt(hex, 16);
        setEvmChainId(id);
        const chain = findChainByChainId(id);
        setEvmChainName(chain?.name ?? null);
        localStorage.setItem('nexus_last_chain', String(id));
      })
      .catch(() => { /* no provider or user rejected */ });

    // Listen for network switches
    const handleChainChanged = (hexChainId: string) => {
      const id = parseInt(hexChainId, 16);
      setEvmChainId(id);
      const chain = findChainByChainId(id);
      setEvmChainName(chain?.name ?? null);
      localStorage.setItem('nexus_last_chain', String(id));
    };

    eth.on('chainChanged', handleChainChanged);
    return () => {
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const isOnSupportedChain = useMemo(
    () => (evmChainId != null ? !!findChainByChainId(evmChainId) : false),
    [evmChainId],
  );

  const isOnHub = useMemo(() => {
    if (evmChainId == null) return false;
    const chain = findChainByChainId(evmChainId);
    return chain?.role === 'hub';
  }, [evmChainId]);

  const activeMode = useMemo<'xrpl' | 'evm' | 'dual' | 'disconnected'>(() => {
    if (xrplWallet && evmChainId) return 'dual';
    if (evmChainId) return 'evm';
    if (xrplWallet) return 'xrpl';
    return 'disconnected';
  }, [xrplWallet, evmChainId]);

  const switchToChain = useCallback(async (chainKey: string) => {
    const chain = NEXUS_CHAINS[chainKey];
    if (!chain) {
      console.warn(`[Wallet] Unknown chain key: ${chainKey}`);
      return;
    }
    await switchNetwork(chain.chainId);
  }, []);

  // ─── Auto-Fetch Wallet State on Mount ───────────────────
  useEffect(() => {
    async function loadWalletState() {
      try {
        const res = await fetch('/api/swap/wallet');
        const json = await res.json();
        const data: MultiRailWalletState = json.data ?? json;

        // Populate XRPL rail
        if (data.xrpl) {
          setXrplWallet(data.xrpl);
        }
        if (data.xrplBalances) {
          setXrplBalances(data.xrplBalances);
        }

        // Populate EVM rail
        if (data.evm) {
          setEvmWallet(data.evm);
        }
        if (data.evmBalances) {
          setEvmBalances(data.evmBalances);
        }

        // Auto-set session for demo — both rails connected, all features accessible
        const stubWallet: Wallet = {
          wallet_address: data.xrpl?.address ?? 'rStubWalletAddress123',
          roles: ['user', 'council'],
          eligibility: {
            market_enabled: true,
            mint_enabled: true,
            vote_enabled: true,
            proposal_enabled: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setSession({
          wallet: stubWallet,
          connected_via: 'xaman',
          session_token: 'auto-session-token',
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        });
      } catch (err) {
        console.warn('[Wallet] Failed to fetch wallet state:', err);
      }
    }

    loadWalletState();
  }, []);

  // ─── XRPL Connectors ───────────────────────────────────

  const connectXaman = useCallback(async () => {
    setConnecting(true);
    try {
      // TODO: Integrate Xaman SDK
      // 1. Create signed nonce payload
      // 2. User signs in Xaman
      // 3. Verify signature on backend
      // 4. Receive session token + wallet data
      console.log('[Wallet] Xaman connect flow — not yet implemented');

      const stubWallet: Wallet = {
        wallet_address: 'rStubWalletAddress123',
        roles: ['user', 'council'],
        eligibility: {
          market_enabled: true,
          mint_enabled: false,
          vote_enabled: true,
          proposal_enabled: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSession({
        wallet: stubWallet,
        connected_via: 'xaman',
        session_token: 'stub-token',
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      });

      setXrplWallet({
        rail: 'xrpl',
        address: stubWallet.wallet_address,
        connector: 'xaman',
      });
    } catch (err) {
      console.error('[Wallet] Xaman connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectAnodos = useCallback(async () => {
    setConnecting(true);
    try {
      // TODO: Integrate Anodos SDK
      console.log('[Wallet] Anodos connect flow — not yet implemented');

      const stubWallet: Wallet = {
        wallet_address: 'rAnodosStubAddress456',
        roles: ['user', 'council'],
        eligibility: {
          market_enabled: true,
          mint_enabled: false,
          vote_enabled: true,
          proposal_enabled: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSession({
        wallet: stubWallet,
        connected_via: 'xaman',
        session_token: 'anodos-stub-token',
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      });

      setXrplWallet({
        rail: 'xrpl',
        address: stubWallet.wallet_address,
        connector: 'anodos',
      });
    } catch (err) {
      console.error('[Wallet] Anodos connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  // ─── EVM Connectors ────────────────────────────────────

  const connectMetaMask = useCallback(async () => {
    setConnecting(true);
    try {
      // TODO: Integrate MetaMask / window.ethereum
      console.log('[Wallet] MetaMask connect flow — not yet implemented');

      setEvmWallet({
        rail: 'evm',
        address: '0xStubMetaMaskAddress789',
        connector: 'metamask',
        chainId: 1,
      });
    } catch (err) {
      console.error('[Wallet] MetaMask connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectWalletConnect = useCallback(async () => {
    setConnecting(true);
    try {
      // TODO: Integrate WalletConnect v2
      console.log('[Wallet] WalletConnect connect flow — not yet implemented');

      setEvmWallet({
        rail: 'evm',
        address: '0xStubWalletConnectAddressABC',
        connector: 'walletconnect',
        chainId: 1,
      });
    } catch (err) {
      console.error('[Wallet] WalletConnect connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  // ─── Disconnect ─────────────────────────────────────────

  const disconnect = useCallback(() => {
    setSession(null);
    setXrplWallet(null);
    setEvmWallet(null);
    setXrplBalances(DEFAULT_BALANCES);
    setEvmBalances(DEFAULT_BALANCES);
    setEvmChainId(null);
    setEvmChainName(null);
    localStorage.removeItem('nexus_last_chain');
  }, []);

  const disconnectRail = useCallback((rail: 'xrpl' | 'evm') => {
    if (rail === 'xrpl') {
      setXrplWallet(null);
      setXrplBalances(DEFAULT_BALANCES);
      // If XRPL was the session source, clear session too
      setSession(prev => {
        if (prev?.connected_via === 'xaman' || prev?.connected_via === 'crossmark' || prev?.connected_via === 'gem') {
          return null;
        }
        return prev;
      });
    } else {
      setEvmWallet(null);
      setEvmBalances(DEFAULT_BALANCES);
    }
  }, []);

  // ─── Helpers ────────────────────────────────────────────

  const hasRole = useCallback(
    (role: UserRole) => session?.wallet.roles.includes(role) ?? false,
    [session],
  );

  const address = session?.wallet.wallet_address ?? null;

  const connectedRails = useMemo<('xrpl' | 'evm')[]>(() => {
    const rails: ('xrpl' | 'evm')[] = [];
    if (xrplWallet) rails.push('xrpl');
    if (evmWallet) rails.push('evm');
    return rails;
  }, [xrplWallet, evmWallet]);

  // ─── Provider ───────────────────────────────────────────

  const value: WalletState = {
    session,
    connecting,
    connectXaman,
    connectAnodos,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    disconnectRail,
    hasRole,
    address,
    xrplWallet,
    evmWallet,
    xrplBalances,
    evmBalances,
    connectedRails,
    // EVM chain awareness
    evmChainId,
    evmChainName,
    isOnSupportedChain,
    isOnHub,
    switchToChain,
    activeMode,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
