import { useWallet } from '@/hooks';

export function ConnectButton() {
  const { session, connecting, connectXaman, disconnect, address } = useWallet();

  if (session) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm text-gray-300 font-mono truncate max-w-[90px] sm:max-w-none">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
        </span>
        <button
          onClick={disconnect}
          className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-400 border border-gray-700 rounded-lg hover:text-white hover:border-gray-500 transition-colors whitespace-nowrap shrink-0"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectXaman}
      disabled={connecting}
      className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-nexus-600 rounded-lg hover:bg-nexus-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
