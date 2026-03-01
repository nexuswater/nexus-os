import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Chain {
  id: string;
  name: string;
  icon: string;
  gasToken: string;
  connected: boolean;
}

const CHAINS: Chain[] = [
  { id: 'XRPL', name: 'XRP Ledger', icon: '✕', gasToken: 'XRP', connected: true },
  { id: 'BASE', name: 'Base', icon: '🔵', gasToken: 'ETH', connected: true },
  { id: 'XRPL_EVM', name: 'XRPL EVM', icon: '⬡', gasToken: 'XRP', connected: false },
  { id: 'ARBITRUM', name: 'Arbitrum', icon: '🔷', gasToken: 'ETH', connected: false },
  { id: 'HYPEREVM', name: 'HyperEVM', icon: '⚡', gasToken: 'HYPE', connected: false },
];

interface ChainSelectorProps {
  value: string;
  onChange: (chainId: string) => void;
  label?: string;
}

export default function ChainSelector({ value, onChange, label }: ChainSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CHAINS.find(c => c.id === value) ?? CHAINS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.15em] block mb-1.5">{label}</span>}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#0D1117] border border-[#1C2432] rounded-lg text-white text-sm hover:border-[#25D69530] transition-colors"
      >
        <span className="text-base">{selected.icon}</span>
        <span className="font-medium flex-1 text-left">{selected.name}</span>
        {selected.connected && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
        )}
        <ChevronDown size={14} className={`text-[#64748B] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#111820] border border-[#1C2432] rounded-lg shadow-2xl py-1">
          {CHAINS.map(chain => (
            <button
              key={chain.id}
              onClick={() => { onChange(chain.id); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                chain.id === value
                  ? 'bg-[#25D695]/10 text-[#25D695]'
                  : 'text-[#94A3B8] hover:bg-[#161E2A] hover:text-white'
              }`}
            >
              <span className="text-base">{chain.icon}</span>
              <span className="font-medium flex-1 text-left">{chain.name}</span>
              <span className="text-[10px] text-[#475569]">{chain.gasToken}</span>
              {chain.connected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D695]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
