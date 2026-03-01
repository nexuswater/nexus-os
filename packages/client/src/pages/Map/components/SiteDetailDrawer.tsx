import { X, Droplets, Zap, Shield, AlertTriangle, MapPin, Clock, Wifi, FileSearch } from 'lucide-react';
import { useMapStore } from '../store';
import { useNexusReceipts } from '@/mock/useNexusStore';
import { HOLO, statusColor } from '../hologramStyles';

const TYPE_LABELS: Record<string, string> = {
  AWG: 'Atmospheric Water Generator',
  GREYWATER: 'Greywater Recycling',
  RAIN: 'Rain Harvest',
  UTILITY: 'Utility Partner',
  EMERGENCY: 'Emergency Deployment',
  SPACE: 'Orbital / Lunar',
};

export default function SiteDetailDrawer() {
  const sites = useMapStore((s) => s.sites);
  const selectedSiteId = useMapStore((s) => s.selectedSiteId);
  const selectSite = useMapStore((s) => s.selectSite);
  const setVaultReceipt = useMapStore((s) => s.setVaultReceipt);
  const receipts = useNexusReceipts();

  const site = sites.find((s) => s.id === selectedSiteId);
  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <MapPin size={24} className="text-gray-700 mb-2" />
        <p className="text-xs text-gray-600">Select a site on the globe</p>
        <p className="text-[10px] text-gray-700 mt-1">Click any hologram pin to view details</p>
      </div>
    );
  }

  const color = statusColor(site.status);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{site.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
              style={{ backgroundColor: color + '18', color }}
            >
              {site.status}
            </span>
            <span className="text-[10px] text-gray-600">{TYPE_LABELS[site.type] ?? site.type}</span>
          </div>
        </div>
        <button
          onClick={() => selectSite(null)}
          className="p-1 text-gray-600 hover:text-gray-400 rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <MapPin size={10} />
        {site.region} · {site.lat.toFixed(2)}, {site.lng.toFixed(2)}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {site.litersToday > 0 && (
          <div className="p-2.5 rounded-lg bg-water-400/5 border border-water-400/10">
            <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
              <Droplets size={9} className="text-water-400" />
              Today
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {site.litersToday.toLocaleString()} L
            </span>
          </div>
        )}
        {site.liters7d > 0 && (
          <div className="p-2.5 rounded-lg bg-water-400/5 border border-water-400/10">
            <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
              <Droplets size={9} className="text-water-400" />
              7-Day
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {site.liters7d.toLocaleString()} L
            </span>
          </div>
        )}
        {(site.energyKwhToday ?? 0) > 0 && (
          <div className="p-2.5 rounded-lg bg-energy-400/5 border border-energy-400/10">
            <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
              <Zap size={9} className="text-energy-400" />
              Energy Today
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {site.energyKwhToday?.toLocaleString()} kWh
            </span>
          </div>
        )}
        {(site.esgScore ?? 0) > 0 && (
          <div className="p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
            <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
              <Shield size={9} className="text-emerald-400" />
              ESG Score
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {site.esgScore}/100
            </span>
          </div>
        )}
      </div>

      {/* Water Quality */}
      {site.waterQuality && (
        <div className="p-2.5 rounded-lg border border-gray-800/40" style={{ background: HOLO.panelBg }}>
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">Water Quality</span>
          <div className="flex items-center gap-4 mt-1">
            <div>
              <span className="text-xs text-gray-400">TDS</span>
              <span className="text-xs font-bold text-white ml-1 tabular-nums">{site.waterQuality.tds} ppm</span>
            </div>
            <div>
              <span className="text-xs text-gray-400">UV</span>
              <span className={`text-xs font-bold ml-1 ${
                site.waterQuality.uvStatus === 'OK' ? 'text-emerald-400' :
                site.waterQuality.uvStatus === 'WARN' ? 'text-amber-400' : 'text-red-400'
              }`}>{site.waterQuality.uvStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {site.alerts && site.alerts.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">Alerts</span>
          {site.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded-lg text-[10px] ${
                alert.level === 'CRIT' ? 'bg-red-400/5 border border-red-400/10 text-red-400' :
                alert.level === 'WARN' ? 'bg-amber-400/5 border border-amber-400/10 text-amber-400' :
                'bg-blue-400/5 border border-blue-400/10 text-blue-400'
              }`}
            >
              <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Minted Batches */}
      {((site.wtrMintedBatchIds?.length ?? 0) > 0 || (site.engMintedBatchIds?.length ?? 0) > 0) && (
        <div>
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">Minted Batches</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {site.wtrMintedBatchIds?.map((b) => (
              <span key={b} className="text-[9px] px-1.5 py-0.5 rounded bg-water-400/10 text-water-400">{b}</span>
            ))}
            {site.engMintedBatchIds?.map((b) => (
              <span key={b} className="text-[9px] px-1.5 py-0.5 rounded bg-energy-400/10 text-energy-400">{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* View Proof Trail — if site has minted batches */}
      {((site.wtrMintedBatchIds?.length ?? 0) > 0 || (site.engMintedBatchIds?.length ?? 0) > 0) && (() => {
        // Find a receipt matching this site's batches
        const allBatchIds = [...(site.wtrMintedBatchIds ?? []), ...(site.engMintedBatchIds ?? [])];
        const matchingReceipt = receipts.find((r) => allBatchIds.includes(r.batchId))
          ?? receipts.find((r) => r.siteId === site.id)
          ?? (receipts.length > 0 ? receipts[0] : null);

        if (!matchingReceipt) return null;
        return (
          <button
            onClick={() => setVaultReceipt(matchingReceipt.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all hover:bg-nexus-400/15"
            style={{
              background: 'rgba(37, 214, 149, 0.08)',
              border: '1px solid rgba(37, 214, 149, 0.15)',
              color: '#25D695',
            }}
          >
            <FileSearch size={11} />
            View Proof Trail
          </button>
        );
      })()}

      {/* Last update */}
      <div className="flex items-center gap-1.5 text-[9px] text-gray-700 pt-2 border-t border-gray-800/30">
        <Clock size={9} />
        Last update: {new Date(site.lastUpdateISO).toLocaleString()}
      </div>
    </div>
  );
}
