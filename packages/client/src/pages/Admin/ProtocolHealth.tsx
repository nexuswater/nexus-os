import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
  Coins,
  Swords,
  Scale,
  BarChart3,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card, Spinner } from '@/components/common';

/* ──────────────────────────────────────────────────────────
 * Pre-computed Institutional Readiness Score
 * Based on NEXUS protocol analysis:
 *   - Linear VP is solid but lacks anti-whale dampening
 *   - Halving emission + retirement burns, but dividend model untested
 *   - Good cross-chain defense, but no vote cap or participation incentive
 *   - DUNA + infrastructure language, but dividend risk
 * ────────────────────────────────────────────────────────── */

interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  icon: React.ReactNode;
  rationale: string;
}

interface ReadinessResult {
  overallIndex: number;
  grade: string;
  dimensions: ScoreDimension[];
  executiveSummary: string;
  timestamp: string;
}

function computeReadinessScore(): ReadinessResult {
  return {
    overallIndex: 73,
    grade: 'B',
    dimensions: [
      {
        key: 'governance',
        label: 'Governance Robustness',
        score: 72,
        icon: <ShieldCheck size={16} />,
        rationale:
          'Linear VP via veNXS is solid, but lacks anti-whale dampening curves. Timelocked execution and multi-chain mirroring add resilience. No quadratic or conviction-weighted fallback.',
      },
      {
        key: 'economic',
        label: 'Economic Sustainability',
        score: 78,
        icon: <Coins size={16} />,
        rationale:
          'Halving emission schedule with retirement burns creates deflationary pressure. Protocol-owned liquidity via treasury stabilizes price floor. Dividend model remains untested at scale.',
      },
      {
        key: 'attack',
        label: 'Attack Resistance',
        score: 68,
        icon: <Swords size={16} />,
        rationale:
          'Cross-chain vote aggregation via Axelar GMP resists single-chain capture. However, no per-address vote cap or participation incentive creates governance apathy risk and whale dominance vectors.',
      },
      {
        key: 'legal',
        label: 'Legal Defensibility',
        score: 74,
        icon: <Scale size={16} />,
        rationale:
          'DUNA wrapper provides legal entity structure. Infrastructure-first language positions token as utility. Dividend distribution to token holders introduces securities risk that needs counsel review.',
      },
      {
        key: 'overall',
        label: 'Institutional Readiness Index',
        score: 73,
        icon: <BarChart3 size={16} />,
        rationale:
          'Composite weighted score across all dimensions. Protocol is institutionally viable with targeted improvements needed in participation incentives and dividend risk mitigation.',
      },
    ],
    executiveSummary:
      'NEXUS Protocol demonstrates strong institutional foundations with a B-grade readiness score. Core governance mechanics are sound with linear vote-escrow and cross-chain mirroring. Economic sustainability benefits from deflationary tokenomics and protocol-owned liquidity. Primary risk vectors are governance apathy due to lack of participation incentives, whale dominance without vote dampening, and potential securities classification of dividend distributions. Recommended actions: implement quadratic vote dampening, add participation rewards, and restructure dividend language with legal counsel.',
    timestamp: new Date().toISOString(),
  };
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    case 'B':
      return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
    case 'C':
      return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    case 'D':
      return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    default:
      return 'text-red-400 border-red-500/40 bg-red-500/10';
  }
}

export default function ProtocolHealth() {
  const [result, setResult] = useState<ReadinessResult>(computeReadinessScore);
  const [running, setRunning] = useState(false);

  function handleRerun() {
    setRunning(true);
    // Simulate analysis delay
    setTimeout(() => {
      setResult(computeReadinessScore());
      setRunning(false);
    }, 1500);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Protocol Health</h1>
        <span className="text-xs text-gray-500">Institutional Readiness Analysis</span>
      </div>

      {/* Grade + Overall Score Banner */}
      <Card className="mb-6 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Large Grade Display */}
            <div
              className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${gradeColor(result.grade)}`}
            >
              <span className="text-4xl font-bold">{result.grade}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-white">Overall Readiness</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold ${scoreTextColor(result.overallIndex)}`}>
                  {result.overallIndex}
                </span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Composite institutional viability index
              </div>
            </div>
          </div>

          <button
            onClick={handleRerun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {running ? (
              <Spinner size="sm" />
            ) : (
              <RefreshCw size={16} />
            )}
            {running ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </Card>

      {/* Score Dimensions */}
      <div className="space-y-3 mb-6">
        {result.dimensions.map((dim) => (
          <Card key={dim.key} className="hover:border-gray-700 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-800 text-gray-400 mt-0.5">
                {dim.icon}
              </div>
              <div className="flex-1 min-w-0">
                {/* Label + Score */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{dim.label}</span>
                  <span className={`text-sm font-bold ${scoreTextColor(dim.score)}`}>
                    {dim.score}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${scoreColor(dim.score)}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>

                {/* Rationale */}
                <p className="text-xs text-gray-500 leading-relaxed">{dim.rationale}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Executive Summary */}
      <Card header="Executive Summary" className="border-gray-700/50">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
            <FileText size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300 leading-relaxed">{result.executiveSummary}</p>
            <div className="mt-3 pt-3 border-t border-gray-800/50">
              <span className="text-[11px] text-gray-600">
                Analysis timestamp: {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
