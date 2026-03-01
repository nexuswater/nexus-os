import { useState } from 'react';
import Assets from '@/pages/Assets';
import Mint from '@/pages/Mint';
import NFTGallery from '@/pages/Assets/NFTGallery';

type Tab = 'assets' | 'mint' | 'nfts';

const tabs: { key: Tab; label: string }[] = [
  { key: 'assets', label: 'Assets' },
  { key: 'mint', label: 'Mint' },
  { key: 'nfts', label: 'NFTs' },
];

function Registry() {
  const [activeTab, setActiveTab] = useState<Tab>('assets');

  return (
    <div className="min-h-screen bg-[#111820] text-white">
      {/* Page title */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-wide">Registry</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 border-b border-[#1C2432]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-xs font-medium uppercase tracking-widest
                transition-colors duration-150 rounded-t
                ${
                  isActive
                    ? 'bg-[#25D695]/10 text-[#25D695] border-b-2 border-[#25D695]'
                    : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'assets' && <Assets />}
        {activeTab === 'mint' && <Mint />}
        {activeTab === 'nfts' && <NFTGallery />}
      </div>
    </div>
  );
}

export default Registry;
