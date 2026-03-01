import { useState } from 'react';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';

type Tab = 'profile' | 'admin';

const tabs: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'admin', label: 'Admin' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen bg-[#111820] text-white">
      {/* Page Title */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#1C2432] px-6 gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                pb-2 px-3 pt-1 text-xs font-medium uppercase tracking-widest transition-colors
                ${
                  isActive
                    ? 'bg-[#25D695]/10 text-[#25D695] border-b-2 border-[#25D695]'
                    : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'admin' && <Admin />}
      </div>
    </div>
  );
}
