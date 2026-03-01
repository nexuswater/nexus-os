import { useWallet } from '@/hooks';

/** Displays wallet details — address, roles, eligibility */
export function WalletInfo() {
  const { session } = useWallet();

  if (!session) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Connect your wallet to get started.</p>
      </div>
    );
  }

  const { wallet } = session;

  return (
    <div className="card space-y-3">
      <div className="card-header">Wallet</div>
      <div className="font-mono text-sm text-gray-300 break-all">
        {wallet.wallet_address}
      </div>
      <div className="flex flex-wrap gap-2">
        {wallet.roles.map((role) => (
          <span
            key={role}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-nexus-600/20 text-nexus-400"
          >
            {role}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <EligibilityChip label="Market" enabled={wallet.eligibility.market_enabled} />
        <EligibilityChip label="Mint" enabled={wallet.eligibility.mint_enabled} />
        <EligibilityChip label="Vote" enabled={wallet.eligibility.vote_enabled} />
        <EligibilityChip label="Propose" enabled={wallet.eligibility.proposal_enabled} />
      </div>
    </div>
  );
}

function EligibilityChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
      <span className={enabled ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
    </div>
  );
}
