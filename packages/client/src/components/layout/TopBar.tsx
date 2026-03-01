import { Bell, Menu, Command } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { TokenIcon } from '@/components/common';

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-12 flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-[#0B0F14]/90 backdrop-blur-xl border-b border-[#1C2432] overflow-hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-[#64748B] hover:text-white rounded-lg hover:bg-[#1C2432]/60 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div className="lg:hidden flex items-center gap-2">
          <TokenIcon symbol="NXS" size={18} />
          <span className="text-sm font-bold text-white tracking-tight">
            Nexus<span className="text-[#25D695]">OS</span>
          </span>
        </div>
      </div>

      {/* Cmd+K hint */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2432]/50 border border-[#1C2432] text-[#475569] text-xs cursor-pointer hover:border-[#25D69530] hover:text-[#64748B] transition-colors">
        <Command size={12} />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-[#0D1117] text-[10px] font-mono text-[#475569] border border-[#1C2432]">⌘K</kbd>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-[#475569] hover:text-[#94A3B8] rounded-lg hover:bg-[#1C2432]/60 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
        </button>
        <ConnectButton />
      </div>
    </header>
  );
}
