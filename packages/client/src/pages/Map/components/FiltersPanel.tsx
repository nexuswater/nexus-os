import {
  Search,
  Waves,
  Droplets,
  CloudRain,
  Building,
  Siren,
  Rocket,
  Radio,
  Zap,
  Coins,
  Globe,
  Moon,
  Satellite,
  Thermometer,
  Bot,
} from 'lucide-react';
import { useMapStore, type TimeRange, type FlowType, type HeatmapMode, type ProjectionMode } from '../store';
import type { NexusSiteType } from '../mockData';

/* ───────── Static config ───────── */

const SITE_TYPE_CONFIG: { type: NexusSiteType; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { type: 'AWG', label: 'AWG', icon: Waves },
  { type: 'GREYWATER', label: 'Greywater', icon: Droplets },
  { type: 'RAIN', label: 'Rain', icon: CloudRain },
  { type: 'UTILITY', label: 'Utility', icon: Building },
  { type: 'EMERGENCY', label: 'Emergency', icon: Siren },
  { type: 'SPACE', label: 'Orbital', icon: Rocket },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
];

const FLOW_CONFIG: { flow: FlowType; label: string; icon: React.FC<{ size?: number; className?: string }>; activeColor: string }[] = [
  { flow: 'water', label: 'Water', icon: Waves, activeColor: 'text-[#25D695]' },
  { flow: 'energy', label: 'Energy', icon: Zap, activeColor: 'text-[#4ADE80]' },
  { flow: 'tokens', label: 'Tokens', icon: Coins, activeColor: 'text-[#22D3EE]' },
  { flow: 'emergency', label: 'Emergency', icon: Siren, activeColor: 'text-[#F5C542]' },
];

const HEATMAP_MODES: { value: HeatmapMode; label: string }[] = [
  { value: 'liters', label: 'Liters' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'esg', label: 'ESG' },
];

const PROJECTIONS: { value: ProjectionMode; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { value: 'earth', label: 'Earth', icon: Globe },
  { value: 'orbital', label: 'Orbital', icon: Satellite },
  { value: 'lunar', label: 'Lunar', icon: Moon },
];

/* ───────── Reusable toggle switch ───────── */

function ToggleSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-8 h-4 rounded-full transition-colors relative ${
        active ? 'bg-nexus-400/40' : 'bg-gray-800'
      }`}
    >
      <div
        className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
          active ? 'left-4 bg-nexus-400' : 'left-0.5 bg-gray-600'
        }`}
      />
    </button>
  );
}

/* ───────── Section divider ───────── */

function Divider() {
  return <div className="border-b border-gray-800/30 my-3" />;
}

/* ───────── Main component ───────── */

export default function FiltersPanel() {
  // Filters
  const visibleTypes = useMapStore((s) => s.visibleTypes);
  const toggleType = useMapStore((s) => s.toggleType);
  const timeRange = useMapStore((s) => s.timeRange);
  const setTimeRange = useMapStore((s) => s.setTimeRange);
  const showArcs = useMapStore((s) => s.showArcs);
  const toggleArcs = useMapStore((s) => s.toggleArcs);
  const showHeatmap = useMapStore((s) => s.showHeatmap);
  const toggleHeatmap = useMapStore((s) => s.toggleHeatmap);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const setSearchQuery = useMapStore((s) => s.setSearchQuery);

  // Flows
  const flowToggles = useMapStore((s) => s.flowToggles);
  const toggleFlow = useMapStore((s) => s.toggleFlow);

  // Heatmap
  const heatmapMode = useMapStore((s) => s.heatmapMode);
  const setHeatmapMode = useMapStore((s) => s.setHeatmapMode);

  // Agent layer
  const showAgentLayer = useMapStore((s) => s.showAgentLayer);
  const toggleAgentLayer = useMapStore((s) => s.toggleAgentLayer);

  // Projection
  const projection = useMapStore((s) => s.projection);
  const setProjection = useMapStore((s) => s.setProjection);

  return (
    <div className="space-y-0">
      {/* ── 1. Search ── */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs bg-gray-950/60 border border-gray-800/60 rounded-lg text-white placeholder:text-gray-700 focus:outline-none focus:border-nexus-400/30"
        />
      </div>

      <Divider />

      {/* ── 2. Layers (site type toggles) ── */}
      <div>
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5 block">Layers</span>
        <div className="flex flex-wrap gap-1.5">
          {SITE_TYPE_CONFIG.map(({ type, label, icon: Icon }) => {
            const active = visibleTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                  active
                    ? 'bg-nexus-400/10 text-nexus-400 border border-nexus-400/20'
                    : 'bg-gray-900/40 text-gray-600 border border-gray-800/30 hover:text-gray-400'
                }`}
              >
                <Icon size={10} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* ── 3. Flows ── */}
      <div>
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5 block">Flows</span>
        <div className="flex flex-wrap gap-1.5">
          {FLOW_CONFIG.map(({ flow, label, icon: Icon, activeColor }) => {
            const active = flowToggles[flow];
            return (
              <button
                key={flow}
                onClick={() => toggleFlow(flow)}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all border ${
                  active
                    ? `bg-nexus-400/10 ${activeColor} border-nexus-400/20`
                    : 'bg-gray-900/40 text-gray-600 border-gray-800/30 hover:text-gray-400'
                }`}
              >
                <Icon size={10} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* ── 4. Time Range ── */}
      <div>
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5 block">Time Range</span>
        <div className="flex gap-1 p-0.5 bg-gray-900/40 rounded-lg">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                timeRange === tr.value
                  ? 'bg-nexus-400/15 text-nexus-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── 5. Overlay ── */}
      <div>
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-2 block">Overlay</span>
        <div className="space-y-2">
          {/* Data Streams toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <Radio size={10} />
              Data Streams
            </span>
            <ToggleSwitch active={showArcs} onToggle={toggleArcs} />
          </div>

          {/* Heatmap toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <Thermometer size={10} />
              Heatmap
            </span>
            <ToggleSwitch active={showHeatmap} onToggle={toggleHeatmap} />
          </div>

          {/* Agent layer toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <Bot size={10} />
              Agents
            </span>
            <ToggleSwitch active={showAgentLayer} onToggle={toggleAgentLayer} />
          </div>

          {/* Heatmap mode sub-selector (visible when heatmap is on) */}
          {showHeatmap && (
            <div className="flex gap-1 p-0.5 bg-gray-900/40 rounded-lg ml-4">
              {HEATMAP_MODES.map((hm) => (
                <button
                  key={hm.value}
                  onClick={() => setHeatmapMode(hm.value)}
                  className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    heatmapMode === hm.value
                      ? 'bg-nexus-400/15 text-nexus-400'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {hm.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* ── 6. Projection ── */}
      <div>
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5 block">Projection</span>
        <div className="flex gap-1 p-0.5 bg-gray-900/40 rounded-lg">
          {PROJECTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setProjection(value)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                projection === value
                  ? 'bg-nexus-400/15 text-nexus-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon size={10} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
