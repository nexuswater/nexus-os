/**
 * Scores — Detailed Water Score / Energy Score / Impact Score.
 * Shows drivers, history trend, and next-best-actions.
 */
import { TripleScoreRings, MetricCard, RecommendationList } from '@/components/health';
import {
  generateUserScores, generateScoreDrivers, generateRecommendations,
} from '@/mock/generators/health';
import {
  TrendingUp, TrendingDown, Droplets, Zap, Info,
} from 'lucide-react';

const scores = generateUserScores();
const drivers = generateScoreDrivers();
const recommendations = generateRecommendations();

const driverIcons = {
  water: Droplets,
  energy: Zap,
};
const driverColors = {
  water: '#00b8f0',
  energy: '#f99d07',
};

export default function Scores() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Your Scores</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Track your water and energy efficiency over time
        </p>
      </div>

      {/* Score Rings — large */}
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
        <TripleScoreRings
          waterScore={scores.waterScore}
          energyScore={scores.energyScore}
          impactScore={scores.impactScore}
          waterDelta={scores.waterDelta}
          energyDelta={scores.energyDelta}
          impactDelta={scores.impactDelta}
          size={150}
        />
      </div>

      {/* Score Trend — simplified line viz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ScoreTrendCard
          label="Water Score"
          color="#00b8f0"
          history={scores.waterHistory}
          current={scores.waterScore}
        />
        <ScoreTrendCard
          label="Energy Score"
          color="#f99d07"
          history={scores.energyHistory}
          current={scores.energyScore}
        />
        <ScoreTrendCard
          label="Impact Score"
          color="#25D695"
          history={scores.impactHistory}
          current={scores.impactScore}
        />
      </div>

      {/* What moved your score */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={14} className="text-[#64748B]" />
          What moved your score
        </h3>
        <div className="space-y-2.5">
          {drivers.map(d => {
            const Icon = driverIcons[d.category];
            const color = driverColors[d.category];
            return (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}12` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 text-sm text-white/80">{d.label}</div>
                <div className={`flex items-center gap-1 text-sm font-bold ${d.direction === 'up' ? 'text-[#25D695]' : 'text-[#EF4444]'}`}>
                  {d.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {d.direction === 'up' ? '+' : ''}{d.impact} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <RecommendationList
          recommendations={recommendations}
          limit={5}
          title="Next Best Actions"
        />
      </div>
    </div>
  );
}

// ─── Mini trend sparkline card ─────────────────────────────

function ScoreTrendCard({ label, color, history, current }: {
  label: string;
  color: string;
  history: number[];
  current: number;
}) {
  const max = Math.max(...history, 100);
  const min = Math.min(...history, 0);
  const range = max - min || 1;
  const h = 60;
  const w = 200;
  const step = w / (history.length - 1);

  const points = history
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(' ');

  const change = history.length >= 2 ? current - history[0] : 0;

  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#64748B]">{label}</span>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{current}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="text-xs mt-2 text-[#64748B]">
        {change >= 0 ? (
          <span className="text-[#25D695]">↑ {change} pts over 12 months</span>
        ) : (
          <span className="text-[#EF4444]">↓ {Math.abs(change)} pts over 12 months</span>
        )}
      </div>
    </div>
  );
}
