/**
 * ImpactCard — Impact Card Generator.
 * Create beautiful shareable cards showing environmental impact,
 * optimized for X (Twitter), Instagram, and LinkedIn.
 */

import { useState } from 'react';
import {
  Share2,
  Download,
  Globe,
  Droplets,
  Zap,
  Leaf,
  Heart,
  Copy,
  ExternalLink,
  MessageSquare,
  Award,
  TrendingUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────

type CardType = 'mercy' | 'energy' | 'carbon' | 'total';
type ColorTheme = 'ocean' | 'forest' | 'sunset' | 'aurora';
type Destination = 'Haiti' | 'Puerto Rico' | 'Maui' | 'Phoenix' | 'Kenya' | 'Global';

interface Template {
  id: string;
  name: string;
  tagline: string;
  stat: string;
  cardType: CardType;
  destination: Destination;
}

interface CommunityCard {
  id: string;
  user: string;
  wallet: string;
  cardType: CardType;
  stat: string;
  destination: Destination;
  likes: number;
  shares: number;
  timeAgo: string;
}

// ─── Constants ──────────────────────────────────────────

const CARD_TYPES: { key: CardType; label: string; emoji: string; icon: typeof Droplets; color: string }[] = [
  { key: 'mercy', label: 'Mercy Water', emoji: '\uD83D\uDCA7', icon: Droplets, color: '#F472B6' },
  { key: 'energy', label: 'Energy Impact', emoji: '\u26A1', icon: Zap, color: '#f99d07' },
  { key: 'carbon', label: 'Carbon Prevention', emoji: '\uD83C\uDF31', icon: Leaf, color: '#A78BFA' },
  { key: 'total', label: 'Total Impact', emoji: '\uD83C\uDF0D', icon: Globe, color: '#25D695' },
];

const DESTINATIONS: Destination[] = ['Haiti', 'Puerto Rico', 'Maui', 'Phoenix', 'Kenya', 'Global'];

const COLOR_THEMES: { key: ColorTheme; label: string; from: string; via: string; to: string; accent: string }[] = [
  { key: 'ocean', label: 'Ocean', from: '#0a1628', via: '#0d2847', to: '#0a3d5c', accent: '#00b8f0' },
  { key: 'forest', label: 'Forest', from: '#0a1a12', via: '#0d2e1a', to: '#0a3d22', accent: '#25D695' },
  { key: 'sunset', label: 'Sunset', from: '#1a0f0a', via: '#2e1a0d', to: '#3d220a', accent: '#f99d07' },
  { key: 'aurora', label: 'Aurora', from: '#140a28', via: '#1e0d47', to: '#280a5c', accent: '#A78BFA' },
];

const CARD_STATS: Record<CardType, { stat: string; detail: string; unit: string }> = {
  mercy: { stat: '1,200', detail: 'liters of clean water delivered to', unit: 'L' },
  energy: { stat: '480', detail: 'kWh of clean energy generated', unit: 'kWh' },
  carbon: { stat: '2,847', detail: 'kg CO\u2082 prevented this month', unit: 'kg' },
  total: { stat: '4,527', detail: 'total impact units generated', unit: 'units' },
};

const TEMPLATES: Template[] = [
  { id: 'tmpl-1', name: 'Mercy Burst', tagline: '8,450L of water just delivered to Haiti via NexusOS', stat: '8,450L', cardType: 'mercy', destination: 'Haiti' },
  { id: 'tmpl-2', name: 'Carbon Alert', tagline: 'Nexus prevented 2,847kg of CO\u2082 today', stat: '2,847kg', cardType: 'carbon', destination: 'Global' },
  { id: 'tmpl-3', name: 'Node Launch', tagline: 'New Nexus Node Online \u2022 Maui \u2022 1,200L/day', stat: '1,200L/day', cardType: 'energy', destination: 'Maui' },
  { id: 'tmpl-4', name: 'Milestone', tagline: 'NexusOS just passed 1M liters of mercy water delivered', stat: '1,000,000L', cardType: 'total', destination: 'Global' },
];

const COMMUNITY_CARDS: CommunityCard[] = [
  { id: 'cc-1', user: 'Alex', wallet: '0x3F1...9c2D', cardType: 'mercy', stat: '2,400L', destination: 'Haiti', likes: 42, shares: 18, timeAgo: '12 min ago' },
  { id: 'cc-2', user: 'Maria', wallet: '0xA8E...4b7F', cardType: 'carbon', stat: '1,230kg', destination: 'Global', likes: 37, shares: 14, timeAgo: '28 min ago' },
  { id: 'cc-3', user: 'Dev', wallet: '0x7B2...1e5A', cardType: 'energy', stat: '890 kWh', destination: 'Puerto Rico', likes: 29, shares: 9, timeAgo: '1h ago' },
  { id: 'cc-4', user: 'Sarah', wallet: '0xC44...8d3E', cardType: 'total', stat: '5,120 units', destination: 'Maui', likes: 56, shares: 23, timeAgo: '2h ago' },
  { id: 'cc-5', user: 'James', wallet: '0xF09...2a6B', cardType: 'mercy', stat: '3,700L', destination: 'Kenya', likes: 61, shares: 31, timeAgo: '3h ago' },
];

// ─── Helpers ────────────────────────────────────────────

function getCardTypeConfig(type: CardType) {
  return CARD_TYPES.find((c) => c.key === type) ?? CARD_TYPES[0];
}

function getThemeConfig(theme: ColorTheme) {
  return COLOR_THEMES.find((t) => t.key === theme) ?? COLOR_THEMES[0];
}

function getShareText(cardType: CardType, destination: Destination): string {
  const stats = CARD_STATS[cardType];
  const typeConfig = getCardTypeConfig(cardType);

  if (cardType === 'mercy') {
    return `\uD83D\uDEB0 I just delivered ${stats.stat}L of clean water to ${destination} via @NexusOS Mercy Market.\n\nInfrastructure. Not charity.\n\n\uD83C\uDF0E nexus-os-sable.vercel.app`;
  }
  if (cardType === 'energy') {
    return `\u26A1 I just generated ${stats.stat} kWh of clean energy via @NexusOS.\n\nReal infrastructure. Real impact.\n\n\uD83C\uDF0E nexus-os-sable.vercel.app`;
  }
  if (cardType === 'carbon') {
    return `\uD83C\uDF31 I prevented ${stats.stat} kg CO\u2082 this month via @NexusOS.\n\nInfrastructure. Not offsets.\n\n\uD83C\uDF0E nexus-os-sable.vercel.app`;
  }
  return `\uD83C\uDF0D My total NexusOS impact: ${stats.stat} ${typeConfig.emoji}\n\nWater. Energy. Carbon prevention.\nAll from real infrastructure.\n\n\uD83C\uDF0E nexus-os-sable.vercel.app`;
}

// ─── Section Header ─────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] mb-3">
      {children}
    </h2>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function ImpactCard() {
  const [cardType, setCardType] = useState<CardType>('mercy');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('ocean');
  const [destination, setDestination] = useState<Destination>('Haiti');
  const [showWallet, setShowWallet] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [copied, setCopied] = useState(false);

  const typeConfig = getCardTypeConfig(cardType);
  const themeConfig = getThemeConfig(colorTheme);
  const stats = CARD_STATS[cardType];
  const TypeIcon = typeConfig.icon;

  const handleCopyForX = () => {
    const text = getShareText(cardType, destination);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ═══ 1. Page Header ═══ */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#25D695]/10 flex items-center justify-center flex-shrink-0">
            <Share2 size={20} className="text-[#25D695]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Impact Card Generator
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-xl">
              Create beautiful shareable cards of your environmental impact
            </p>
          </div>
        </div>

        {/* ═══ 2. Card Preview ═══ */}
        <div>
          <SectionHeader>Card Preview</SectionHeader>
          <div className="flex justify-center">
            <div
              className="w-full max-w-[400px] rounded-2xl overflow-hidden border border-white/[0.06] relative"
              style={{
                background: `linear-gradient(135deg, ${themeConfig.from}, ${themeConfig.via}, ${themeConfig.to})`,
              }}
            >
              {/* Glow effect */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: themeConfig.accent }}
              />

              <div className="relative p-6 space-y-5">
                {/* Logo */}
                {showBranding && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center">
                      <Globe size={12} style={{ color: themeConfig.accent }} />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-white/60 uppercase">
                      NexusOS
                    </span>
                  </div>
                )}

                {/* User */}
                <div className="text-sm text-white/70">
                  Josh {showWallet && <span className="font-mono text-xs text-white/40">&bull; 0x7F2...8a1B</span>}
                </div>

                {/* Main stat */}
                <div className="py-4 text-center">
                  <div className="relative inline-block">
                    <div
                      className="text-5xl font-bold font-mono tabular-nums tracking-tight animate-pulse"
                      style={{ color: themeConfig.accent }}
                    >
                      {stats.stat}
                    </div>
                    <div className="text-sm text-white/50 mt-1">{stats.unit}</div>
                    {/* Glow ring behind stat */}
                    <div
                      className="absolute -inset-4 rounded-full blur-2xl opacity-15 -z-10"
                      style={{ backgroundColor: themeConfig.accent }}
                    />
                  </div>
                  <p className="text-sm text-white/60 mt-3 leading-relaxed">
                    {cardType === 'total'
                      ? 'Total combined environmental impact'
                      : `${stats.detail} ${cardType !== 'carbon' ? destination : ''}`}
                  </p>
                </div>

                {/* Icon + type details */}
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${typeConfig.color}20` }}
                  >
                    <TypeIcon size={16} style={{ color: typeConfig.color }} />
                  </div>
                  <span className="text-xs font-medium text-white/50">{typeConfig.label}</span>
                </div>

                {/* Total card: show all three stats */}
                {cardType === 'total' && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 rounded-lg bg-white/[0.04]">
                      <Droplets size={12} className="text-[#F472B6] mx-auto mb-1" />
                      <div className="text-xs font-mono text-white tabular-nums">1,200L</div>
                      <div className="text-[9px] text-white/40">Water</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/[0.04]">
                      <Zap size={12} className="text-[#f99d07] mx-auto mb-1" />
                      <div className="text-xs font-mono text-white tabular-nums">480 kWh</div>
                      <div className="text-[9px] text-white/40">Energy</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white/[0.04]">
                      <Leaf size={12} className="text-[#A78BFA] mx-auto mb-1" />
                      <div className="text-xs font-mono text-white tabular-nums">2,847kg</div>
                      <div className="text-[9px] text-white/40">CO&#x2082;</div>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                {showTimestamp && (
                  <div className="text-[10px] text-white/30 font-mono text-center">
                    March 13, 2026 &bull; 14:32 UTC
                  </div>
                )}

                {/* Footer */}
                {showBranding && (
                  <div className="text-center pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-white/30 font-mono">
                      nexus-os-sable.vercel.app
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 3. Card Type Selector ═══ */}
        <div>
          <SectionHeader>Card Type</SectionHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CARD_TYPES.map((ct) => {
              const Icon = ct.icon;
              const isActive = cardType === ct.key;
              return (
                <button
                  key={ct.key}
                  onClick={() => setCardType(ct.key)}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    isActive
                      ? 'bg-white/[0.04] border-white/[0.12]'
                      : 'bg-[#111820] border-[#1C2432] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${ct.color}15` }}
                    >
                      <Icon size={14} style={{ color: ct.color }} />
                    </div>
                    <span className="text-xs font-medium text-white">{ct.emoji} {ct.label}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-relaxed">
                    {ct.key === 'mercy' && '1,200L of clean water delivered to Haiti'}
                    {ct.key === 'energy' && '480 kWh of clean energy generated'}
                    {ct.key === 'carbon' && '2,847 kg CO\u2082 prevented this month'}
                    {ct.key === 'total' && 'All three combined in one card'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ 4. Customization Options ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Destination */}
          <div>
            <SectionHeader>Destination</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    onClick={() => setDestination(dest)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      destination === dest
                        ? 'bg-[#25D695]/10 text-[#25D695] border border-[#25D695]/30'
                        : 'bg-white/[0.02] text-[#64748B] border border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <SectionHeader>Color Theme</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 space-y-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => setColorTheme(theme.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    colorTheme === theme.key
                      ? 'bg-white/[0.04] border border-white/[0.12]'
                      : 'border border-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                      border: `1px solid ${theme.accent}40`,
                    }}
                  />
                  <span className="text-xs font-medium text-white">{theme.label}</span>
                  <div
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ backgroundColor: theme.accent }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div>
            <SectionHeader>Include</SectionHeader>
            <div className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showWallet}
                  onChange={(e) => setShowWallet(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1C2432] bg-[#0B0F14] text-[#25D695] focus:ring-[#25D695]/40 focus:ring-offset-0 accent-[#25D695]"
                />
                <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                  Show wallet address
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showTimestamp}
                  onChange={(e) => setShowTimestamp(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1C2432] bg-[#0B0F14] text-[#25D695] focus:ring-[#25D695]/40 focus:ring-offset-0 accent-[#25D695]"
                />
                <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                  Show timestamp
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showBranding}
                  onChange={(e) => setShowBranding(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1C2432] bg-[#0B0F14] text-[#25D695] focus:ring-[#25D695]/40 focus:ring-offset-0 accent-[#25D695]"
                />
                <span className="text-xs text-white/80 group-hover:text-white transition-colors">
                  Show NexusOS branding
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ═══ 5. Share Buttons ═══ */}
        <div>
          <SectionHeader>Share Your Impact</SectionHeader>
          <div className="flex flex-wrap gap-3">
            {/* Copy for X */}
            <button
              onClick={handleCopyForX}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#111820] border border-[#1C2432] hover:border-white/[0.12] transition-all text-sm font-medium"
            >
              {copied ? (
                <>
                  <Copy size={16} className="text-[#25D695]" />
                  <span className="text-[#25D695]">Copied!</span>
                </>
              ) : (
                <>
                  <MessageSquare size={16} className="text-white" />
                  <span className="text-white">Copy for X</span>
                </>
              )}
            </button>

            {/* Download PNG */}
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#111820] border border-[#1C2432] hover:border-white/[0.12] transition-all text-sm font-medium text-white">
              <Download size={16} className="text-[#25D695]" />
              Download PNG
            </button>

            {/* Share to LinkedIn */}
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0077B5]/10 border border-[#0077B5]/30 hover:bg-[#0077B5]/20 transition-all text-sm font-medium text-[#0077B5]">
              <ExternalLink size={16} />
              Share to LinkedIn
            </button>
          </div>
        </div>

        {/* ═══ 6. Pre-built Templates ═══ */}
        <div>
          <SectionHeader>Pre-built Templates</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map((tmpl) => {
              const tmplConfig = getCardTypeConfig(tmpl.cardType);
              const TmplIcon = tmplConfig.icon;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setCardType(tmpl.cardType);
                    setDestination(tmpl.destination);
                  }}
                  className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 text-left hover:border-white/[0.08] transition-all group"
                >
                  {/* Mini preview */}
                  <div
                    className="w-full h-24 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${getThemeConfig(colorTheme).from}, ${getThemeConfig(colorTheme).to})`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: tmplConfig.color }}
                    />
                    <div className="relative text-center">
                      <div
                        className="text-lg font-bold font-mono tabular-nums"
                        style={{ color: tmplConfig.color }}
                      >
                        {tmpl.stat}
                      </div>
                      <TmplIcon size={12} style={{ color: tmplConfig.color }} className="mx-auto mt-1" />
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-white mb-1 group-hover:text-[#25D695] transition-colors">
                    {tmpl.name}
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-relaxed">
                    {tmpl.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ 7. Recent Community Cards ═══ */}
        <div>
          <SectionHeader>Recent Community Cards</SectionHeader>
          <div className="space-y-3">
            {COMMUNITY_CARDS.map((card) => {
              const ccConfig = getCardTypeConfig(card.cardType);
              const CCIcon = ccConfig.icon;
              return (
                <div
                  key={card.id}
                  className="bg-[#111820] border border-[#1C2432] rounded-2xl p-4 flex items-center gap-4 hover:border-white/[0.08] transition-all"
                >
                  {/* Mini card preview */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${getThemeConfig(colorTheme).from}, ${getThemeConfig(colorTheme).to})`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: ccConfig.color }}
                    />
                    <div className="relative text-center">
                      <div
                        className="text-xs font-bold font-mono tabular-nums"
                        style={{ color: ccConfig.color }}
                      >
                        {card.stat}
                      </div>
                      <CCIcon size={10} style={{ color: ccConfig.color }} className="mx-auto mt-0.5" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{card.user}</span>
                      <span className="text-[10px] font-mono text-[#64748B]">{card.wallet}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: ccConfig.color }}>
                        {ccConfig.label}
                      </span>
                      <span className="text-[10px] text-[#475569]">&bull;</span>
                      <span className="text-[10px] text-[#64748B]">{card.destination}</span>
                      <span className="text-[10px] text-[#475569]">&bull;</span>
                      <span className="text-[10px] text-[#475569]">{card.timeAgo}</span>
                    </div>
                  </div>

                  {/* Likes / Shares */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Heart size={12} className="text-[#F472B6]" />
                      <span className="text-xs font-mono text-[#64748B] tabular-nums">{card.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Share2 size={12} className="text-[#64748B]" />
                      <span className="text-xs font-mono text-[#64748B] tabular-nums">{card.shares}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
