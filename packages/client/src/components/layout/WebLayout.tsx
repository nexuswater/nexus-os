import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import CommandPalette from '@/components/terminal/CommandPalette';
import { DemoControls } from '@/components/DemoControls';

/** Full web layout — customer-first with mobile bottom nav */
export function WebLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F14] overflow-x-hidden">
      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, slide-in overlay on mobile */}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="lg:pl-64">
        <TopBar onMenuToggle={() => setMenuOpen((v) => !v)} />
        <main className="page-container pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — customer-first tabs */}
      <MobileBottomNav />

      {/* Command palette — always mounted, hidden until Cmd+K */}
      <CommandPalette />

      {/* Demo controls — floating panel for mock data simulation */}
      <DemoControls />
    </div>
  );
}
