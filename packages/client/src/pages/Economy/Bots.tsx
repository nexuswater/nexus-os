/**
 * Agent Economy — Autonomous Bots
 * Bot cards, signal feed, and run controls.
 */

import { useState, useMemo } from 'react';
import {
  Bot, Activity, Play, Pause, Sparkles, Clock,
  Zap, ShieldAlert, TrendingUp, Radio,
} from 'lucide-react';
import {
  generateBots,
  generateBotSignals,
  generateBotRuns,
} from '@/mock/generators/economy';

// ─── Data ────────────────────────────────────────────────

const bots = generateBots();
const botSignals = generateBotSignals();
const botRuns = generateBotRuns();

const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'bg-blue-400/15 text-blue-400',
  WARN: 'bg-amber-400/15 text-amber-400',
  CRITICAL: 'bg-red-400/15 text-red-400',
};

const BOT_TYPE_ICONS: Record<string, typeof Bot> = {
  LIQUIDITY_ROUTER: TrendingUp,
  NEGOTIATION_ASSIST: Zap,
  MARKET_MAKER: Activity,
  RISK_SENTINEL: ShieldAlert,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ───────────────────────────────────────────

export default function Bots() {
  const [runningBotId, setRunningBotId] = useState<string | null>(null);
  const [pausedBots, setPausedBots] = useState<Set<string>>(new Set());

  const signalsByBot = useMemo(() => {
    const map: Record<string, typeof botSignals> = {};
    for (const s of botSignals) {
      (map[s.botId] ??= []).push(s);
    }
    return map;
  }, []);

  const allSignals = useMemo(
    () =>
      [...botSignals].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [],
  );

  const handleRun = (botId: string) => {
    setRunningBotId(botId);
    setTimeout(() => setRunningBotId(null), 2000);
  };

  const togglePause = (botId: string) => {
    setPausedBots(prev => {
      const next = new Set(prev);
      if (next.has(botId)) next.delete(botId);
      else next.add(botId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Radio size={16} className="text-[#25D695]" />
            Autonomous Bots
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            System agents that route, negotiate, and monitor on your behalf
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]" />
          {bots.filter(b => b.status === 'ACTIVE' && !pausedBots.has(b.id)).length} active
        </div>
      </div>

      {/* Bot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bots.map(bot => {
          const runs = botRuns
            .filter(r => r.botId === bot.id)
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
          const sigs = (signalsByBot[bot.id] ?? [])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          const isActive = bot.status === 'ACTIVE' && !pausedBots.has(bot.id);
          const isRunning = runningBotId === bot.id;
          const TypeIcon = BOT_TYPE_ICONS[bot.botType] ?? Bot;

          return (
            <div
              key={bot.id}
              className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 space-y-3 hover:border-[#25D695]/20 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
                      <TypeIcon size={14} className="text-[#25D695]" />
                    </div>
                    <span className="text-sm font-semibold text-white">{bot.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1C2432] text-gray-400">
                    {bot.botType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive
                        ? 'bg-[#25D695] shadow-[0_0_6px_rgba(37,214,149,0.5)]'
                        : 'bg-gray-600'
                    }`}
                  />
                  <span className="text-[10px] text-gray-500">
                    {isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-600 block text-[10px]">Last Run</span>
                  <span className="text-gray-300 font-mono">
                    {bot.lastRunAt ? timeAgo(bot.lastRunAt) : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block text-[10px]">Signals</span>
                  <span className="text-white font-mono font-semibold">
                    {(signalsByBot[bot.id] ?? []).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block text-[10px]">Runs</span>
                  <span className="text-gray-300 font-mono">{runs.length}</span>
                </div>
              </div>

              {/* Recent signals */}
              {sigs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    Recent Signals
                  </span>
                  {sigs.map(sig => (
                    <div
                      key={sig.id}
                      className="flex items-center gap-2 bg-[#0B0F14] rounded px-2 py-1.5"
                    >
                      <span
                        className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          SEVERITY_COLORS[sig.severity] ?? ''
                        }`}
                      >
                        {sig.severity}
                      </span>
                      <span className="text-[10px] text-gray-300 truncate flex-1">
                        {sig.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleRun(bot.id)}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded bg-[#25D695]/15 text-[#25D695] hover:bg-[#25D695]/25 transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <span className="w-3 h-3 border-2 border-[#25D695] border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={10} /> Run Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => togglePause(bot.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold rounded bg-[#1C2432] text-gray-400 hover:bg-[#1C2432]/80 transition-colors"
                >
                  {isActive ? (
                    <>
                      <Pause size={10} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={10} /> Resume
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Signal Feed */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-[#25D695]" />
          <span className="text-xs font-semibold text-white">Signal Feed</span>
          <span className="text-[10px] text-gray-600 font-mono">
            {allSignals.length} signals from all bots
          </span>
        </div>

        <div className="space-y-2">
          {allSignals.map(sig => {
            const bot = bots.find(b => b.id === sig.botId);
            const isRecommendation =
              sig.type === 'OFFER_RECOMMENDED' || sig.type === 'TRADE_ROUTE_RECOMMENDED';

            const payloadEntries = Object.entries(sig.payload as Record<string, unknown>)
              .filter(([k]) => k !== 'type')
              .slice(0, 3);
            const payloadSummary = payloadEntries
              .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toLocaleString() : v}`)
              .join(' | ');

            return (
              <div
                key={sig.id}
                className="bg-[#111820] border border-[#1C2432] rounded-lg p-3 flex items-start gap-3"
              >
                <span
                  className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    SEVERITY_COLORS[sig.severity] ?? ''
                  }`}
                >
                  {sig.severity}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white">
                      {sig.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">{bot?.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono truncate">
                    {payloadSummary}
                  </p>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {fmtDate(sig.createdAt)}
                  </span>
                </div>

                {isRecommendation && (
                  <button className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold rounded bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors">
                    <Sparkles size={10} />
                    Apply
                  </button>
                )}
              </div>
            );
          })}

          {allSignals.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-12">No signals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
