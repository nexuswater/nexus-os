/**
 * HeatmapLegend — Gradient bar showing current heatmap scale.
 * Only visible when showHeatmap=true.
 */
import { useMapStore } from '../store';
import { HEAT_GRADIENT, GLASS } from '../hologramStyles';

const MODE_LABELS: Record<string, { label: string; unit: string }> = {
  liters: { label: 'Water Output', unit: 'L/day' },
  alerts: { label: 'Alert Density', unit: 'alerts' },
  esg: { label: 'ESG Score', unit: 'score' },
};

export default function HeatmapLegend() {
  const showHeatmap = useMapStore((s) => s.showHeatmap);
  const heatmapMode = useMapStore((s) => s.heatmapMode);

  if (!showHeatmap) return null;

  const mode = MODE_LABELS[heatmapMode] || { label: 'Intensity', unit: '' };

  return (
    <div
      className="absolute bottom-14 right-3 z-20 rounded-lg p-2 hidden sm:block"
      style={{
        background: GLASS.bg,
        backdropFilter: GLASS.blur,
        WebkitBackdropFilter: GLASS.blur,
        border: `1px solid ${GLASS.border}`,
        boxShadow: GLASS.shadow,
        minWidth: 120,
      }}
    >
      <div className="text-[7px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
        {mode.label}
      </div>

      {/* Gradient bar */}
      <div
        className="h-2 rounded-full w-full"
        style={{
          background: `linear-gradient(90deg, ${HEAT_GRADIENT.low}, ${HEAT_GRADIENT.medium}, ${HEAT_GRADIENT.high}, ${HEAT_GRADIENT.critical})`,
        }}
      />

      {/* Scale labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[6px] font-mono text-white/25">Low</span>
        <span className="text-[6px] font-mono text-white/25">Med</span>
        <span className="text-[6px] font-mono text-white/25">High</span>
        <span className="text-[6px] font-mono text-white/25">Critical</span>
      </div>

      {/* Unit */}
      <div className="text-[6px] font-mono text-nexus-400/30 text-center mt-0.5">
        {mode.unit}
      </div>
    </div>
  );
}
