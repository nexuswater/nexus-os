import { NavLink } from 'react-router-dom';
import { Home, Wallet, ShoppingCart, Landmark, BarChart3 } from 'lucide-react';

const XAPP_NAV_ITEMS = [
  { label: 'Home', path: '/', Icon: Home },
  { label: 'Assets', path: '/assets', Icon: Wallet },
  { label: 'Market', path: '/marketplace', Icon: ShoppingCart },
  { label: 'DAO', path: '/dao', Icon: Landmark },
  { label: 'Impact', path: '/impact', Icon: BarChart3 },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {XAPP_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-nexus-400' : 'text-gray-600'
              }`
            }
          >
            <item.Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
