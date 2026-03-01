import { Radio, Coins, AlertTriangle, RefreshCw } from 'lucide-react';
import { useMapStore } from '../store';
import { HOLO } from '../hologramStyles';

const TYPE_ICON: Record<string, React.FC<{ size?: number; className?: string }>> = {
  iot_reading: Radio,
  batch_mint: Coins,
  alert: AlertTriangle,
  status_change: RefreshCw,
};

const TYPE_COLOR: Record<string, string> = {
  iot_reading: 'text-cyan-400',
  batch_mint: 'text-nexus-400',
  alert: 'text-amber-400',
  status_change: 'text-cyan-400',
};

export default function ActivityFeed() {
  const events = useMapStore((s) => s.events);
  const selectSite = useMapStore((s) => s.selectSite);

  return (
    <div
      className="rounded-xl border border-gray-800/40 overflow-hidden"
      style={{ background: HOLO.panelBg }}
    >
      <div className="px-3 py-2 border-b border-gray-800/30 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-nexus-400 animate-pulse" />
        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Live Activity</span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {events.slice(0, 8).map((evt) => {
          const Icon = TYPE_ICON[evt.type] || Radio;
          const color = evt.level === 'CRIT' ? 'text-red-400' : evt.level === 'WARN' ? 'text-amber-400' : (TYPE_COLOR[evt.type] || 'text-gray-400');

          return (
            <button
              key={evt.id}
              onClick={() => selectSite(evt.siteId)}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors border-b border-gray-800/20 last:border-0"
            >
              <Icon size={11} className={`${color} mt-0.5 flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-gray-300 truncate">{evt.siteName}</span>
                  <span className="text-[8px] text-gray-700 flex-shrink-0">
                    {timeAgo(evt.timeISO)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 truncate">{evt.message}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
