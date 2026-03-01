import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppMode, NetworkMode } from '@nexus/shared';
import { DEFAULT_APP_MODE, DEFAULT_NETWORK } from '@/config/constants';

interface AppModeState {
  mode: AppMode;
  network: NetworkMode;
  setMode: (mode: AppMode) => void;
  setNetwork: (network: NetworkMode) => void;
}

const AppModeContext = createContext<AppModeState | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(DEFAULT_APP_MODE);
  const [network, setNetwork] = useState<NetworkMode>(DEFAULT_NETWORK);

  // Detect xApp mode from URL params or Xaman SDK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('xAppToken') || params.has('xapp')) {
      setMode('xapp');
    }
  }, []);

  return (
    <AppModeContext.Provider value={{ mode, network, setMode, setNetwork }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeState {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider');
  return ctx;
}
