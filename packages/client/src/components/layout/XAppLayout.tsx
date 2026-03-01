import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Mobile-first xApp layout with bottom navigation */
export function XAppLayout() {
  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Minimal top bar for xApp */}
      <header className="sticky top-0 z-40 h-12 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm border-b border-gray-800">
        <span className="text-sm font-bold text-white tracking-tight">
          Nexus<span className="text-nexus-500">OS</span>
        </span>
      </header>

      <main className="px-4 py-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
