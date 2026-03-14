/**
 * MercyNetwork — Humanitarian environmental infrastructure dashboard.
 * Water, energy, and carbon impact for communities in need.
 */

import { useState } from 'react';
import {
  Heart,
  Droplets,
  Zap,
  MapPin,
  Shield,
  Award,
  Users,
  Globe,
  ArrowRight,
  Send,
  Radio,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

interface CrisisZone {
  id: string;
  name: string;
  crisis: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  neededPerDay: number;
  delivered: number;
  lat: number;
  lng: number;
}

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalDonated: number;
  level: number;
  levelName: string;
  isCurrentUser: boolean;
}

interface MercyTransfer {
  id: string;
  amount: number;
  unit: string;
  type: 'water' | 'energy';
  destination: string;
  nodeId: string;
  timeAgo: string;
  txHash: string;
}

interface ImpactReceipt {
  receiptId: string;
  date: string;
  amount: number;
  unit: string;
  destination: string;
  carbonOffset: number;
  xrplHash: string;
}

// ─── Mock Data ───────────────────────────────────────────

const crisisZones: CrisisZone[] = [
  { id: 'cz-1', name: 'Haiti', crisis: 'Water Crisis', severity: 'CRITICAL', neededPerDay: 12000, delivered: 4200, lat: 18.97, lng: -72.28 },
  { id: 'cz-2', name: 'Puerto Rico', crisis: 'Hurricane Recovery', severity: 'HIGH', neededPerDay: 8000, delivered: 6100, lat: 18.22, lng: -66.59 },
  { id: 'cz-3', name: 'Maui, HI', crisis: 'Wildfire Recovery', severity: 'MODERATE', neededPerDay: 5000, delivered: 4800, lat: 20.80, lng: -156.32 },
  { id: 'cz-4', name: 'Phoenix, AZ', crisis: 'Drought Zone', severity: 'HIGH', neededPerDay: 15000, delivered: 9200, lat: 33.45, lng: -112.07 },
  { id: 'cz-5', name: 'Flint, MI', crisis: 'Water Quality', severity: 'CRITICAL', neededPerDay: 20000, delivered: 11400, lat: 43.01, lng: -83.69 },
  { id: 'cz-6', name: 'San Juan, PR', crisis: 'Infrastructure Gap', severity: 'MODERATE', neededPerDay: 6000, delivered: 5200, lat: 18.47, lng: -66.11 },
];

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, wallet: 'rN7d4...X9kQ', totalDonated: 14200, level: 4, levelName: 'Water Hero', isCurrentUser: false },
  { rank: 2, wallet: 'rPq3m...H2vF', totalDonated: 11800, level: 4, levelName: 'Water Hero', isCurrentUser: false },
  { rank: 3, wallet: 'rK8nB...W4jR', totalDonated: 9450, level: 3, levelName: 'Water Champion', isCurrentUser: false },
  { rank: 4, wallet: 'rL2cD...M7pS', totalDonated: 7300, level: 3, levelName: 'Water Champion', isCurrentUser: false },
  { rank: 5, wallet: 'rF9xA...T1nK', totalDonated: 5600, level: 3, levelName: 'Water Champion', isCurrentUser: false },
  { rank: 6, wallet: 'rH4wG...Y8bE', totalDonated: 4100, level: 2, levelName: 'Water Guardian', isCurrentUser: false },
  { rank: 7, wallet: 'rJ1kV...P3mZ', totalDonated: 2400, level: 2, levelName: 'Water Guardian', isCurrentUser: true },
  { rank: 8, wallet: 'rB6tN...Q5cW', totalDonated: 1800, level: 2, levelName: 'Water Guardian', isCurrentUser: false },
  { rank: 9, wallet: 'rD3fX...U9hL', totalDonated: 1200, level: 1, levelName: 'Water Supporter', isCurrentUser: false },
  { rank: 10, wallet: 'rG7sC...V2rJ', totalDonated: 800, level: 1, levelName: 'Water Supporter', isCurrentUser: false },
];

const recentTransfers: MercyTransfer[] = [
  { id: 'mt-1', amount: 500, unit: 'L', type: 'water', destination: 'Haiti', nodeId: 'AWG-Node-042', timeAgo: '3 min ago', txHash: 'A8F2...9B1C' },
  { id: 'mt-2', amount: 120, unit: 'kWh', type: 'energy', destination: 'Puerto Rico', nodeId: 'SOL-Node-018', timeAgo: '7 min ago', txHash: 'C4D1...3E7A' },
  { id: 'mt-3', amount: 250, unit: 'L', type: 'water', destination: 'Flint, MI', nodeId: 'AWG-Node-109', timeAgo: '12 min ago', txHash: 'F7B3...2K9D' },
  { id: 'mt-4', amount: 80, unit: 'kWh', type: 'energy', destination: 'Maui, HI', nodeId: 'SOL-Node-055', timeAgo: '18 min ago', txHash: 'D9E4...1H6F' },
  { id: 'mt-5', amount: 1000, unit: 'L', type: 'water', destination: 'Phoenix, AZ', nodeId: 'AWG-Node-073', timeAgo: '24 min ago', txHash: 'B2A7...8M3G' },
  { id: 'mt-6', amount: 300, unit: 'L', type: 'water', destination: 'San Juan, PR', nodeId: 'AWG-Node-091', timeAgo: '31 min ago', txHash: 'E5C8...4N2J' },
  { id: 'mt-7', amount: 200, unit: 'kWh', type: 'energy', destination: 'Haiti', nodeId: 'SOL-Node-027', timeAgo: '38 min ago', txHash: 'G1F6...7P5L' },
  { id: 'mt-8', amount: 750, unit: 'L', type: 'water', destination: 'Flint, MI', nodeId: 'AWG-Node-134', timeAgo: '45 min ago', txHash: 'H3D9...6R8M' },
];

const impactReceipts: ImpactReceipt[] = [
  { receiptId: 'MRC-2026-0847', date: 'Mar 12, 2026', amount: 500, unit: 'L Water', destination: 'Haiti', carbonOffset: 2.4, xrplHash: 'A8F2C91D...3E7B9B1C' },
  { receiptId: 'MRC-2026-0831', date: 'Mar 10, 2026', amount: 250, unit: 'L Water', destination: 'Flint, MI', carbonOffset: 1.1, xrplHash: 'F7B3A42E...8K9D2C4F' },
  { receiptId: 'MRC-2026-0819', date: 'Mar 8, 2026', amount: 120, unit: 'kWh Energy', destination: 'Puerto Rico', carbonOffset: 3.8, xrplHash: 'C4D1E67F...1H6F3A7B' },
];

// ─── Severity Config ─────────────────────────────────────

const severityConfig: Record<string, { color: string; bg: string; dot: string; text: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'bg-red-500/10', dot: 'bg-red-500', text: 'text-red-400' },
  HIGH: { color: '#f97316', bg: 'bg-orange-500/10', dot: 'bg-orange-500', text: 'text-orange-400' },
  MODERATE: { color: '#eab308', bg: 'bg-yellow-500/10', dot: 'bg-yellow-500', text: 'text-yellow-400' },
};

const levelColors: Record<number, string> = {
  1: '#64748B',
  2: '#00b8f0',
  3: '#A78BFA',
  4: '#F472B6',
};

// ─── Component ───────────────────────────────────────────

export default function MercyNetwork() {
  const [waterAmount, setWaterAmount] = useState<number>(100);
  const [energyAmount, setEnergyAmount] = useState<number>(50);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0B0F14] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── Page Header ─────────────────────────────── */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-[#F472B6]/10 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-[#F472B6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mercy Network</h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-xl leading-relaxed">
              Humanitarian environmental infrastructure — water, energy, and carbon impact for those who need it most
            </p>
          </div>
        </div>

        {/* ── Global Impact Summary ───────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            icon={<Droplets size={16} className="text-[#00b8f0]" />}
            label="Mercy Water Delivered Today"
            value="8,450 L"
            change="+24%"
            color="#00b8f0"
          />
          <SummaryCard
            icon={<Zap size={16} className="text-[#f99d07]" />}
            label="Mercy Energy Delivered"
            value="2.4 MWh"
            change="+15%"
            color="#f99d07"
          />
          <SummaryCard
            icon={<Users size={16} className="text-[#25D695]" />}
            label="Communities Served"
            value="34"
            change="+3"
            color="#25D695"
          />
          <SummaryCard
            icon={<Radio size={16} className="text-[#A78BFA]" />}
            label="Infrastructure Sponsored"
            value="12 nodes"
            change=""
            color="#A78BFA"
          />
        </div>

        {/* ── Crisis Zone Map ─────────────────────────── */}
        <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432] mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-[#F472B6]" />
            <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold">
              Active Humanitarian Zones
            </h2>
          </div>

          <div className="space-y-2">
            {crisisZones.map((zone) => {
              const sev = severityConfig[zone.severity];
              const pct = Math.round((zone.delivered / zone.neededPerDay) * 100);
              const isExpanded = expandedZone === zone.id;

              return (
                <div
                  key={zone.id}
                  className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                    className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <MapPin size={14} className="text-[#64748B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{zone.name}</span>
                        <span className="text-[11px] text-[#64748B]">{zone.crisis}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: sev.color }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#64748B] shrink-0">
                          {zone.delivered.toLocaleString()}L / {zone.neededPerDay.toLocaleString()}L
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${sev.dot}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${sev.text}`}>
                        {zone.severity}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-0 border-t border-white/[0.04]">
                      <div className="flex items-center justify-between mt-3 mb-2">
                        <div className="grid grid-cols-3 gap-4 text-center flex-1">
                          <div>
                            <div className="text-[10px] text-[#475569] uppercase tracking-wider">Needed/Day</div>
                            <div className="text-sm font-mono text-white mt-0.5">
                              {zone.neededPerDay.toLocaleString()}L
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#475569] uppercase tracking-wider">Delivered</div>
                            <div className="text-sm font-mono text-[#25D695] mt-0.5">
                              {zone.delivered.toLocaleString()}L
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#475569] uppercase tracking-wider">Gap</div>
                            <div className="text-sm font-mono text-red-400 mt-0.5">
                              {(zone.neededPerDay - zone.delivered).toLocaleString()}L
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="w-full mt-2 py-2 px-4 rounded-xl bg-[#00b8f0]/10 text-[#00b8f0] text-xs font-semibold hover:bg-[#00b8f0]/20 transition-colors flex items-center justify-center gap-2">
                        <Send size={12} />
                        Send Mercy Water
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Quick Actions ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Send Mercy Water */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#00b8f0]/10 flex items-center justify-center">
                <Droplets size={18} className="text-[#00b8f0]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Send Mercy Water</h3>
                <p className="text-[11px] text-[#64748B]">Donate water to crisis zones</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(Number(e.target.value))}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-[#475569] focus:outline-none focus:border-[#00b8f0]/40"
                  min={1}
                />
                <span className="text-xs text-[#64748B] font-mono shrink-0">Liters</span>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-[#00b8f0] text-white text-sm font-semibold hover:bg-[#00b8f0]/80 transition-colors flex items-center justify-center gap-2">
                <Send size={14} />
                Send {waterAmount}L
              </button>
            </div>
          </div>

          {/* Send Mercy Energy */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#f99d07]/10 flex items-center justify-center">
                <Zap size={18} className="text-[#f99d07]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Send Mercy Energy</h3>
                <p className="text-[11px] text-[#64748B]">Power humanitarian infrastructure</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={energyAmount}
                  onChange={(e) => setEnergyAmount(Number(e.target.value))}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm font-mono text-white placeholder-[#475569] focus:outline-none focus:border-[#f99d07]/40"
                  min={1}
                />
                <span className="text-xs text-[#64748B] font-mono shrink-0">kWh</span>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-[#f99d07] text-white text-sm font-semibold hover:bg-[#f99d07]/80 transition-colors flex items-center justify-center gap-2">
                <Send size={14} />
                Send {energyAmount} kWh
              </button>
            </div>
          </div>

          {/* Sponsor Infrastructure */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#25D695]/10 flex items-center justify-center">
                <Shield size={18} className="text-[#25D695]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Sponsor Infrastructure</h3>
                <p className="text-[11px] text-[#64748B]">Fund new AWG/solar nodes</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { tier: 'Bronze', price: '$50', desc: 'Filters for 1 AWG', color: '#CD7F32' },
                { tier: 'Silver', price: '$250', desc: 'Solar panel upgrade', color: '#C0C0C0' },
                { tier: 'Gold', price: '$1,000', desc: 'Full AWG station', color: '#FFD700' },
              ].map((t) => (
                <button
                  key={t.tier}
                  onClick={() => setSelectedTier(selectedTier === t.tier ? null : t.tier)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                    selectedTier === t.tier
                      ? 'border-[#25D695]/40 bg-[#25D695]/5'
                      : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${t.color}20`, color: t.color }}
                  >
                    {t.tier[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">
                      {t.tier}: {t.price}
                    </div>
                    <div className="text-[10px] text-[#64748B]">{t.desc}</div>
                  </div>
                  {selectedTier === t.tier && (
                    <CheckCircle2 size={14} className="text-[#25D695] shrink-0" />
                  )}
                </button>
              ))}
              {selectedTier && (
                <button className="w-full py-2.5 rounded-xl bg-[#25D695] text-white text-sm font-semibold hover:bg-[#25D695]/80 transition-colors flex items-center justify-center gap-2 mt-1">
                  <ArrowRight size={14} />
                  Sponsor {selectedTier}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-Column: Leaderboard + Recent Transfers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Mercy Impact Leaderboard */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-[#F472B6]" />
              <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold">
                Mercy Impact Leaderboard
              </h2>
            </div>
            <div className="space-y-1">
              {leaderboardData.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-[#F472B6]/5 border border-[#F472B6]/20'
                      : 'bg-white/[0.01] hover:bg-white/[0.03]'
                  }`}
                >
                  <span
                    className={`w-6 text-center text-xs font-bold font-mono ${
                      entry.rank <= 3 ? 'text-[#F472B6]' : 'text-[#475569]'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-white/80">{entry.wallet}</span>
                      {entry.isCurrentUser && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F472B6]/10 text-[#F472B6] font-semibold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">
                      Lv{entry.level} {entry.levelName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-white">
                      {entry.totalDonated.toLocaleString()}L
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: levelColors[entry.level] }}
                      />
                      <span className="text-[9px]" style={{ color: levelColors[entry.level] }}>
                        Lv{entry.level}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Mercy Transfers */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-[#25D695]" />
              <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold">
                Recent Mercy Transfers
              </h2>
            </div>
            <div className="space-y-1.5">
              {recentTransfers.map((tx) => {
                const isWater = tx.type === 'water';
                const typeColor = isWater ? '#00b8f0' : '#f99d07';
                const TypeIcon = isWater ? Droplets : Zap;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${typeColor}15` }}
                    >
                      <TypeIcon size={13} style={{ color: typeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/90">
                        <span className="font-mono font-semibold">
                          {tx.amount}{tx.unit}
                        </span>
                        {' '}
                        <span className="text-[#64748B]">
                          {isWater ? 'Water' : 'Energy'}
                        </span>
                        {' '}
                        <span className="text-[#475569]">&rarr;</span>
                        {' '}
                        <span className="text-white/70">{tx.destination}</span>
                      </div>
                      <div className="text-[10px] text-[#475569] mt-0.5">
                        via {tx.nodeId} &middot; {tx.timeAgo} &middot; tx: {tx.txHash}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Two-Column: ESG & Reputation + Mercy Impact Receipts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* ESG & Reputation */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-[#A78BFA]" />
              <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold">
                Your Mercy Impact Score
              </h2>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#A78BFA]/10 flex items-center justify-center">
                <span className="text-2xl font-bold font-mono text-[#A78BFA]">3</span>
              </div>
              <div>
                <div className="text-lg font-bold text-white">Water Guardian</div>
                <div className="text-xs text-[#64748B]">Level 3 of 4</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#475569] uppercase tracking-wider">Progress to Level 4</span>
                <span className="text-[10px] font-mono text-[#A78BFA]">2,400 / 5,000L</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-[#A78BFA] transition-all" style={{ width: '48%' }} />
              </div>
              <div className="text-[10px] text-[#475569] mt-1">2,600L more to unlock Water Hero</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Total Water Donated</div>
                <div className="text-sm font-mono font-semibold text-[#00b8f0]">2,400L</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Total Energy Donated</div>
                <div className="text-sm font-mono font-semibold text-[#f99d07]">180 kWh</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Communities Helped</div>
                <div className="text-sm font-mono font-semibold text-[#25D695]">8</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">Governance Bonus</div>
                <div className="text-sm font-mono font-semibold text-[#F472B6]">+15%</div>
              </div>
            </div>
          </div>

          {/* Mercy Impact Receipts */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[#1C2432]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-[#25D695]" />
              <h2 className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold">
                Mercy Impact Receipts
              </h2>
            </div>
            <div className="space-y-3">
              {impactReceipts.map((receipt) => (
                <div
                  key={receipt.receiptId}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] relative overflow-hidden"
                >
                  {/* NFT-style shimmer accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#F472B6]/5 to-transparent rounded-bl-3xl" />

                  <div className="flex items-start justify-between mb-3 relative">
                    <div>
                      <div className="text-xs font-mono font-semibold text-white">
                        {receipt.receiptId}
                      </div>
                      <div className="text-[10px] text-[#475569] mt-0.5">{receipt.date}</div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#25D695]/10">
                      <CheckCircle2 size={10} className="text-[#25D695]" />
                      <span className="text-[9px] font-semibold text-[#25D695]">Verified on XRPL</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 relative">
                    <div>
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider">Amount</div>
                      <div className="text-xs font-mono text-white mt-0.5">
                        {receipt.amount} {receipt.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider">Destination</div>
                      <div className="text-xs font-mono text-white mt-0.5">{receipt.destination}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider">Carbon Offset</div>
                      <div className="text-xs font-mono text-[#25D695] mt-0.5">{receipt.carbonOffset} kg CO2</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#475569] uppercase tracking-wider">XRPL Hash</div>
                      <div className="text-xs font-mono text-[#64748B] mt-0.5">{receipt.xrplHash}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-[#111820] border border-[#1C2432]">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] uppercase tracking-[0.15em] text-[#475569] font-semibold leading-tight">
          {label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold font-mono text-white">{value}</span>
        {change && (
          <span
            className="text-[11px] font-semibold font-mono mb-0.5"
            style={{ color }}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
