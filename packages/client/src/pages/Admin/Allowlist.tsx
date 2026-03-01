import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Shield, Wallet } from 'lucide-react';
import { Card, Button, Spinner } from '@/components/common';

function truncateWallet(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

export default function Allowlist() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/allowlist');
        const json = await res.json();
        if (json.success) {
          setWallets(json.data?.participants ?? []);
        }
      } catch (err) {
        console.error('Failed to load allowlist:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleAdd() {
    const trimmed = newWallet.trim();
    if (!trimmed) return;
    if (wallets.includes(trimmed)) return;
    setWallets((prev) => [trimmed, ...prev]);
    setNewWallet('');
  }

  function handleRemove(wallet: string) {
    setWallets((prev) => prev.filter((w) => w !== wallet));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Market Allowlist</h1>
        <span className="text-xs text-gray-500">{wallets.length} participants</span>
      </div>

      {/* Add Wallet */}
      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Enter wallet address (e.g., rNexus4Qh7x...)"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-nexus-500 focus:outline-none font-mono placeholder:font-sans placeholder:text-gray-600"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!newWallet.trim()}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Wallet
          </Button>
        </div>
      </Card>

      {/* Wallet List */}
      <Card header="Participants" icon={<Shield className="w-4 h-4" />}>
        {wallets.length === 0 ? (
          <p className="text-sm text-gray-500">No wallets in the allowlist.</p>
        ) : (
          <div className="space-y-1">
            {wallets.map((wallet, idx) => (
              <div
                key={wallet}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-600 tabular-nums w-6 text-right">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-300 font-mono" title={wallet}>
                    {truncateWallet(wallet)}
                  </span>
                  <span className="text-xs text-gray-600 font-mono hidden sm:inline">
                    {wallet}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(wallet)}
                  className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove wallet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
