import { Droplets, Radio, AlertTriangle, Leaf, Zap } from 'lucide-react';
import { useMapStore } from '../store';
import { HOLO } from '../hologramStyles';

export default function KPIBar() {
  const sites = useMapStore((s) => s.sites);

  const activeSites = sites.filter((s) => s.status === 'ACTIVE').length;
  const totalLitersToday = sites.reduce((sum, s) => sum + s.litersToday, 0);
  const totalKwhToday = sites.reduce((sum, s) => sum + (s.energyKwhToday ?? 0), 0);
  const alertCount = sites.reduce((sum, s) => sum + (s.alerts?.length ?? 0), 0);
  const avgEsg = sites.filter((s) => s.esgScore && s.esgScore > 0);
  const avgEsgScore = avgEsg.length > 0 ? Math.round(avgEsg.reduce((s, v) => s + (v.esgScore ?? 0), 0) / avgEsg.length) : 0;

  const kpis = [
    {
      label: 'Liters Today',
      value: totalLitersToday.toLocaleString(),
      icon: Droplets,
      color: 'text-water-400',
      bg: 'bg-water-400/10',
    },
    {
      label: 'kWh Today',
      value: totalKwhToday.toLocaleString(),
      icon: Zap,
      color: 'text-energy-400',
      bg: 'bg-energy-400/10',
    },
    {
      label: 'Active Stations',
      value: activeSites.toString(),
      icon: Radio,
      color: 'text-nexus-400',
      bg: 'bg-nexus-400/10',
    },
    {
      label: 'Alerts',
      value: alertCount.toString(),
      icon: AlertTriangle,
      color: alertCount > 0 ? 'text-amber-400' : 'text-gray-500',
      bg: alertCount > 0 ? 'bg-amber-400/10' : 'bg-gray-800/40',
    },
    {
      label: 'Avg ESG Score',
      value: avgEsgScore.toString(),
      icon: Leaf,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            className="p-3 rounded-xl border border-gray-800/40"
            style={{ background: HOLO.panelBg }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${k.bg}`}>
                <Icon size={10} className={k.color} />
              </div>
              <span className="text-[9px] text-gray-600 uppercase tracking-wider">{k.label}</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{k.value}</span>
          </div>
        );
      })}
    </div>
  );
}
