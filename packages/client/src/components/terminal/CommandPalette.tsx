import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';

/* ─── Data ─── */
const PAGES = [
  { label: 'Terminal', path: '/', keywords: 'home dashboard' },
  { label: 'Swap', path: '/swap', keywords: 'trade exchange' },
  { label: 'Liquidity', path: '/liquidity', keywords: 'yield farming' },
  { label: 'Registry', path: '/registry', keywords: 'assets mint nft' },
  { label: 'Governance', path: '/governance', keywords: 'dao proposals vote' },
  { label: 'Agents', path: '/agents', keywords: 'ai bot automation' },
  { label: 'Analytics', path: '/analytics', keywords: 'impact metrics' },
  { label: 'Oracle Feed', path: '/oracle', keywords: 'data vault bills iot' },
  { label: 'Infrastructure Map', path: '/map', keywords: 'globe sites' },
  { label: 'Settings', path: '/settings', keywords: 'profile admin' },
];

const TOKENS_SEARCH = [
  { symbol: 'NXS', name: 'Nexus', action: 'View NXS' },
  { symbol: 'WTR', name: 'Water Credit', action: 'View WTR' },
  { symbol: 'ENG', name: 'Energy Credit', action: 'View ENG' },
  { symbol: 'XRP', name: 'XRP', action: 'View XRP' },
];

const ACTIONS = [
  { label: 'Connect Wallet', keywords: 'xumm metamask wallet', shortcut: '⌘W' },
  { label: 'Toggle Dark Mode', keywords: 'theme light', shortcut: '⌘D' },
  { label: 'Refresh Data', keywords: 'reload sync', shortcut: '⌘R' },
];

/* ─── Icons (inline SVG, 16px) ─── */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#475569] shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748B] shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748B] shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h6M9 14h6" />
    </svg>
  );
}

function ActionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748B] shrink-0">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/* ─── Component ─── */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  /* Listen for Cmd+K / Ctrl+K */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const goTo = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      {/* Dialog */}
      <div
        className="w-full max-w-lg bg-[#111820] border border-[#1C2432] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Command palette"
          className="flex flex-col"
          /* cmdk inline styles override */
          style={{ fontFamily: 'inherit' }}
        >
          {/* ── Search Input ── */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1117] border-b border-[#1C2432]">
            <SearchIcon />
            <Command.Input
              autoFocus
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-sm text-white placeholder-[#475569] outline-none caret-[#25D695]"
            />
            <kbd className="text-[10px] text-[#475569] bg-[#0D1117] border border-[#1C2432] rounded px-1.5 py-0.5 font-mono leading-none select-none">
              ESC
            </kbd>
          </div>

          {/* ── Results ── */}
          <Command.List className="max-h-[360px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[#1C2432]">
            <Command.Empty className="px-4 py-6 text-center text-sm text-[#475569]">
              No results found.
            </Command.Empty>

            {/* Pages Group */}
            <Command.Group
              heading={
                <span className="block px-4 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#475569] select-none">
                  Pages
                </span>
              }
            >
              {PAGES.map((p) => (
                <Command.Item
                  key={p.path}
                  value={`${p.label} ${p.keywords}`}
                  onSelect={() => goTo(p.path)}
                  className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[#CBD5E1] cursor-pointer rounded-none transition-colors data-[selected=true]:bg-[#25D695]/10 data-[selected=true]:text-[#25D695] hover:bg-[#161E2A]"
                >
                  <PageIcon />
                  <span className="flex-1 truncate">{p.label}</span>
                  <kbd className="text-[10px] text-[#475569] bg-[#0D1117] rounded px-1.5 py-0.5 font-mono leading-none opacity-0 group-data-[selected=true]:opacity-100 transition-opacity select-none">
                    ↵
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Tokens Group */}
            <Command.Group
              heading={
                <span className="block px-4 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#475569] select-none">
                  Tokens
                </span>
              }
            >
              {TOKENS_SEARCH.map((t) => (
                <Command.Item
                  key={t.symbol}
                  value={`${t.symbol} ${t.name} ${t.action}`}
                  onSelect={() => goTo(`/token/${t.symbol.toLowerCase()}`)}
                  className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[#CBD5E1] cursor-pointer rounded-none transition-colors data-[selected=true]:bg-[#25D695]/10 data-[selected=true]:text-[#25D695] hover:bg-[#161E2A]"
                >
                  <TokenIcon />
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-white group-data-[selected=true]:text-[#25D695]">{t.symbol}</span>
                    <span className="ml-2 text-[#64748B]">{t.name}</span>
                  </span>
                  <span className="text-[10px] text-[#475569]">{t.action}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Actions Group */}
            <Command.Group
              heading={
                <span className="block px-4 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#475569] select-none">
                  Actions
                </span>
              }
            >
              {ACTIONS.map((a) => (
                <Command.Item
                  key={a.label}
                  value={`${a.label} ${a.keywords}`}
                  onSelect={() => setOpen(false)}
                  className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[#CBD5E1] cursor-pointer rounded-none transition-colors data-[selected=true]:bg-[#25D695]/10 data-[selected=true]:text-[#25D695] hover:bg-[#161E2A]"
                >
                  <ActionIcon />
                  <span className="flex-1 truncate">{a.label}</span>
                  <kbd className="text-[10px] text-[#475569] bg-[#0D1117] rounded px-1.5 py-0.5 font-mono leading-none select-none">
                    {a.shortcut}
                  </kbd>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#1C2432] bg-[#0D1117]">
            <div className="flex items-center gap-3 text-[10px] text-[#475569]">
              <span className="flex items-center gap-1">
                <kbd className="bg-[#111820] border border-[#1C2432] rounded px-1 py-0.5 font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[#111820] border border-[#1C2432] rounded px-1 py-0.5 font-mono">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[#111820] border border-[#1C2432] rounded px-1 py-0.5 font-mono">esc</kbd>
                close
              </span>
            </div>
            <span className="text-[10px] text-[#475569] tracking-wide uppercase">Nexus OS</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
