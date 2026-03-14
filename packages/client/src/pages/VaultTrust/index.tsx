/**
 * Vault — Verification trail + Trust Center.
 * "I can prove it with a certificate anyone can trust."
 */
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Lock, Database } from 'lucide-react';

const tabs = [
  { label: 'Verification', mobileLabel: 'Verify', path: '/vault', icon: Shield },
  { label: 'Trust Center', mobileLabel: 'Trust', path: '/vault/trust', icon: Lock },
  { label: 'Your Data', mobileLabel: 'Data', path: '/vault/data', icon: Database },
];

export default function VaultLayout() {
  const location = useLocation();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Vault</h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Your verification trail, privacy controls, and data management
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4 sm:mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path ||
            (tab.path === '/vault' && location.pathname === '/vault');
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-[#64748B] hover:text-white/70'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
