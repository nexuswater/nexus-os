import { NavLink } from 'react-router-dom';
import {
  Home, ArrowLeftRight, Droplets, ClipboardList, Landmark,
  BarChart3, Globe, User, ClipboardCheck, Shield,
  AlertTriangle, FileText, X, Database, Bot,
  Activity, Radio, Settings, Award, Eye, Sparkles,
} from 'lucide-react';
import { useWallet } from '@/hooks';
import { TokenIcon } from '@/components/common';

/* ─── Navigation Structure ───────────────────────────────── */

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ size?: number; className?: string }>;
  end?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Protocol',
    items: [
      { label: 'Terminal', path: '/', icon: Home, end: true },
      { label: 'Swap', path: '/swap', icon: ArrowLeftRight },
      { label: 'Liquidity', path: '/liquidity', icon: Droplets },
      { label: 'Registry', path: '/registry', icon: ClipboardList },
      { label: 'Governance', path: '/governance', icon: Landmark },
      { label: 'Agents', path: '/agents', icon: Bot },
      { label: 'Elementalz', path: '/elementalz', icon: Sparkles },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { label: 'Nexus Score', path: '/scoring', icon: Award },
      { label: 'Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'Oracle Feed', path: '/oracle', icon: Activity },
      { label: 'Infrastructure Map', path: '/map', icon: Globe },
      { label: 'Transparency', path: '/transparency', icon: Eye },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Proof Queue', path: '/admin/proofs', icon: ClipboardCheck },
  { label: 'Allowlist', path: '/admin/allowlist', icon: Shield },
  { label: 'Emergency', path: '/admin/emergency', icon: AlertTriangle },
  { label: 'Audit Log', path: '/admin/audit', icon: FileText },
];

/* ─── Component ──────────────────────────────────────────── */

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { hasRole } = useWallet();
  const showAdmin = hasRole('council') || hasRole('auditor') || hasRole('oracle');

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0F14] border-r border-[#1C2432]
        flex flex-col transition-transform duration-200 ease-out
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-12 px-5 border-b border-[#1C2432]">
        <div className="flex items-center gap-2">
          <TokenIcon symbol="NXS" size={22} />
          <span className="text-base font-bold text-white tracking-tight">
            Nexus<span className="text-[#25D695]">OS</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-[#475569] hover:text-white rounded-lg hover:bg-[#1C2432]/60 transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.section} className="mb-1">
            <div className="px-3 pt-4 pb-1.5">
              <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em]">
                {section.section}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#25D695]/[0.08] text-white border-l-2 border-[#25D695] ml-0 pl-[10px]'
                          : 'text-[#64748B] hover:bg-[#1C2432]/50 hover:text-[#94A3B8] border-l-2 border-transparent'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {showAdmin && (
          <div className="mb-1">
            <div className="px-3 pt-4 pb-1.5">
              <span className="text-[9px] font-semibold text-[#475569] uppercase tracking-[0.15em]">
                Admin
              </span>
            </div>
            <div className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#25D695]/[0.08] text-white border-l-2 border-[#25D695] ml-0 pl-[10px]'
                          : 'text-[#64748B] hover:bg-[#1C2432]/50 hover:text-[#94A3B8] border-l-2 border-transparent'
                      }`
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Network status */}
      <div className="p-4 border-t border-[#1C2432]">
        <div className="flex items-center gap-2 text-[10px] text-[#475569] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          XRPL Testnet
        </div>
      </div>
    </aside>
  );
}
