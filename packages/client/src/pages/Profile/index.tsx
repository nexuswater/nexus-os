import { useState } from 'react';
import { User, Bell, Eye, Code } from 'lucide-react';
import { Card, StatusBadge } from '@/components/common';
import { useWallet } from '@/hooks';

export default function Profile() {
  const { session, address } = useWallet();

  return (
    <div>
      <h1 className="page-title">Profile & Settings</h1>

      {/* Wallet & Role Header */}
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-nexus-500/10">
            <User className="w-6 h-6 text-nexus-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 mb-1">Wallet Address</div>
            <div className="font-mono text-sm text-gray-200 break-all mb-3">
              {address ?? 'Not connected'}
            </div>
            {session && (
              <div className="flex flex-wrap gap-2">
                {session.wallet.roles.map((role) => (
                  <StatusBadge key={role} status={role} color={role === 'council' ? 'blue' : role === 'user' ? 'blue' : 'cyan'} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Preferences */}
        <Card header="Notifications" icon={<Bell className="w-4 h-4" />}>
          <div className="space-y-3">
            <ToggleRow label="Proposal voting deadlines" defaultOn />
            <ToggleRow label="Batch nearing retirement" defaultOn />
            <ToggleRow label="Pending mint approvals" />
            <ToggleRow label="Marketplace listing expiring" defaultOn />
            <ToggleRow label="Trade completed" defaultOn />
          </div>
        </Card>

        {/* Privacy Controls */}
        <Card header="Privacy" icon={<Eye className="w-4 h-4" />}>
          <div className="space-y-3">
            <ToggleRow label="Show installations on public map" defaultOn />
            <ToggleRow label="Display wallet in leaderboards" />
          </div>
        </Card>

        {/* Developer Settings */}
        <Card header="Developer" icon={<Code className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-gray-400">
              <span>Network</span>
              <select className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:border-nexus-500 focus:outline-none">
                <option>Testnet</option>
                <option>Mainnet</option>
                <option>Devnet</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <span>App Mode</span>
              <select className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:border-nexus-500 focus:outline-none">
                <option>Web dApp</option>
                <option>xApp (Xaman)</option>
              </select>
            </div>
            {session && (
              <div className="flex items-center justify-between text-gray-400 pt-2 border-t border-gray-800">
                <span>Session Expires</span>
                <span className="text-xs text-gray-500">
                  {new Date(session.expires_at).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`w-9 h-5 rounded-full relative transition-colors ${
          on ? 'bg-nexus-500' : 'bg-gray-700'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
            on ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
