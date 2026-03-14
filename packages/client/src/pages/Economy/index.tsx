/**
 * Agent Economy — Layout wrapper with tab navigation.
 * Environmental asset trading, skills marketplace, and agent negotiation.
 */
import { NavLink, Outlet } from 'react-router-dom';
import {
  Bot, Store, Handshake, Shield, CpuIcon, Receipt,
} from 'lucide-react';

const TABS = [
  { label: 'Skills Market', path: '/economy',              icon: Store,     end: true },
  { label: 'Env Market',    path: '/economy/market',       icon: Bot,       end: false },
  { label: 'Negotiations',  path: '/economy/negotiations', icon: Handshake, end: false },
  { label: 'Trust',         path: '/economy/trust',        icon: Shield,    end: false },
  { label: 'Bots',          path: '/economy/bots',         icon: CpuIcon,   end: false },
  { label: 'Receipts',      path: '/economy/receipts',     icon: Receipt,   end: false },
] as const;

export default function EconomyLayout() {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
          <Bot size={18} className="text-[#25D695]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Agent Economy
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Environmental asset trading, skills marketplace, and agent negotiation
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mt-4 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#111820] border border-transparent'
                }`
              }
            >
              <Icon size={13} className="shrink-0" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* Nested Route Content */}
      <Outlet />
    </div>
  );
}
