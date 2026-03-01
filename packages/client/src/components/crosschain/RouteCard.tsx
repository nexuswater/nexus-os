import { ArrowRight, Clock, Shield, Zap } from 'lucide-react';

interface RouteStep {
  type: string;
  adapter: string;
  inputToken: string;
  outputToken: string;
  estimatedTimeSeconds: number;
}

interface RouteCardProps {
  route: {
    id: string;
    steps: RouteStep[];
    totalEstimatedOutput: number;
    netOutputAfterFees: number;
    totalEstimatedTimeSeconds: number;
    reliability: number;
    rank: number;
  };
  outputToken: string;
  selected?: boolean;
  onSelect?: () => void;
}

const ADAPTER_LABELS: Record<string, string> = {
  XRPL_DEX: 'XRPL DEX',
  EVM_AMM: 'Uniswap V3',
  BRIDGE: 'Axelar Bridge',
};

export default function RouteCard({ route, outputToken, selected, onSelect }: RouteCardProps) {
  const reliabilityColor = route.reliability >= 0.9 ? '#25D695' : route.reliability >= 0.8 ? '#F5C542' : '#EF4444';
  const isBest = route.rank === 1;
  
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? 'bg-[#25D695]/[0.06] border-[#25D695]/40 shadow-[0_0_16px_rgba(37,214,149,0.08)]'
          : 'bg-[#0D1117] border-[#1C2432] hover:border-[#25D69530]'
      }`}
    >
      {/* Header: Best badge + output */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isBest && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#25D695]/15 text-[#25D695]">
              Best
            </span>
          )}
          <span className="text-[10px] text-[#475569]">Route #{route.rank}</span>
        </div>
        <span className="text-lg font-bold text-white tabular-nums">
          {route.netOutputAfterFees.toLocaleString(undefined, { maximumFractionDigits: 4 })} {outputToken}
        </span>
      </div>

      {/* Step timeline */}
      <div className="flex items-center gap-1 mb-3">
        {route.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`px-2 py-1 rounded text-[10px] font-medium ${
              step.type === 'SWAP' ? 'bg-[#22D3EE]/10 text-[#22D3EE]' :
              step.type === 'BRIDGE' ? 'bg-[#F5C542]/10 text-[#F5C542]' :
              'bg-[#64748B]/10 text-[#64748B]'
            }`}>
              {ADAPTER_LABELS[step.adapter] ?? step.adapter}
            </div>
            {i < route.steps.length - 1 && (
              <ArrowRight size={10} className="text-[#475569]" />
            )}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[10px] text-[#64748B]">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          ~{Math.round(route.totalEstimatedTimeSeconds)}s
        </span>
        <span className="flex items-center gap-1" style={{ color: reliabilityColor }}>
          <Shield size={10} />
          {(route.reliability * 100).toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <Zap size={10} />
          {route.steps.length} step{route.steps.length > 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}
