/**
 * MobileBottomNav — iOS-style bottom tab bar for mobile.
 * Shows on screens < 1024px (lg breakpoint).
 * Core customer-first tabs: Today, Scores, Rewards, Vault, More.
 */
import { NavLink } from 'react-router-dom';
import { Sun, Activity, Gift, Lock, MoreHorizontal } from 'lucide-react';

const tabs = [
  { label: 'Today', path: '/today', icon: Sun },
  { label: 'Scores', path: '/scores', icon: Activity },
  { label: 'Rewards', path: '/rewards', icon: Gift },
  { label: 'Vault', path: '/vault', icon: Lock },
  { label: 'More', path: '/settings', icon: MoreHorizontal },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0B0F14]/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors min-w-[56px] ${
                  isActive
                    ? 'text-[#25D695]'
                    : 'text-[#475569]'
                }`
              }
            >
              <Icon size={20} strokeWidth={isActiveIcon(tab.path) ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/** Helper — can't use NavLink isActive inside icon props, so approximate */
function isActiveIcon(path: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(path);
}
