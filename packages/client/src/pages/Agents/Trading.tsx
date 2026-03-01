import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, Activity, Clock, RefreshCw, Settings,
  PlusCircle, XCircle, BarChart3, Zap,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Trading() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'config'>('positions');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/agents/${agentId}`).then(r => r.json()),
      fetch(`${API}/agents/trading/positions?agentId=${agentId}`).then(r => r.json()),
      fetch(`${API}/agents/trading/orders?agentId=${agentId}`).then(r => r.json()),
    ])
      .then(([agentData, posData, ordData]) => {
        setAgent(agentData.agent);
        setPositions(posData.positions || []);
        setOrders(ordData.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [agentId]);

  const totalPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
  const openOrderCount = orders.filter(o => o.status === 'open').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-nexus-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/agents" className="text-xs text-gray-600 hover:text-gray-400">Agents</Link>
            <span className="text-xs text-gray-700">/</span>
            <span className="text-xs text-gray-400">{agent?.name || 'Trading'}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Trading Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 text-xs font-medium rounded-lg transition-colors">
            <RefreshCw size={12} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/15 text-amber-400 text-xs font-medium rounded-lg transition-colors">
            <PlusCircle size={12} />
            New Order
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1">
            <Activity size={10} />
            Open Positions
          </div>
          <span className="text-lg font-bold text-white tabular-nums">{positions.filter(p => p.status === 'open').length}</span>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1">
            {totalPnl >= 0 ? <TrendingUp size={10} className="text-emerald-400" /> : <TrendingDown size={10} className="text-red-400" />}
            Unrealized P&L
          </div>
          <span className={`text-lg font-bold tabular-nums ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
          </span>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1">
            <Clock size={10} />
            Open Orders
          </div>
          <span className="text-lg font-bold text-white tabular-nums">{openOrderCount}</span>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mb-1">
            <DollarSign size={10} />
            24h Volume
          </div>
          <span className="text-lg font-bold text-white tabular-nums">
            ${(agent?.stats?.totalVolumeUsd || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-900/60 rounded-xl w-fit">
        {(['positions', 'orders', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Positions Table */}
      {activeTab === 'positions' && (
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800/40">
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Pair</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Side</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Entry</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Current</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">P&L</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Opened</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos: any) => (
                  <tr key={pos.id} className="border-b border-gray-800/20 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs font-semibold text-white">{pos.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        pos.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {pos.side === 'buy' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {pos.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300 tabular-nums">{pos.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{pos.entryPrice}</td>
                    <td className="px-4 py-3 text-xs text-white font-medium tabular-nums">{pos.currentPrice}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-semibold tabular-nums ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)}
                        <span className="text-[10px] ml-1 opacity-70">
                          ({pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{new Date(pos.openedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-600">No open positions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800/40">
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Pair</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Side</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Filled</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord: any) => (
                  <tr key={ord.id} className="border-b border-gray-800/20 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs font-semibold text-white">{ord.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${ord.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ord.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 uppercase">{ord.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-300 tabular-nums">{ord.price || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-300 tabular-nums">{ord.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                      {ord.filledAmount.toLocaleString()}/{ord.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        ord.status === 'filled' ? 'bg-emerald-400/10 text-emerald-400' :
                        ord.status === 'open' ? 'bg-blue-400/10 text-blue-400' :
                        ord.status === 'cancelled' ? 'bg-gray-500/10 text-gray-500' :
                        'bg-amber-400/10 text-amber-400'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ord.status === 'open' && (
                        <button className="text-red-400 hover:text-red-300">
                          <XCircle size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-xs text-gray-600">No orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Config Panel */}
      {activeTab === 'config' && (
        <div className="bg-gray-900/50 border border-gray-800/60 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-white">Trading Configuration</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Strategy</label>
              <select className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40">
                <option value="market_maker">Market Maker</option>
                <option value="grid">Grid Trading</option>
                <option value="dca">DCA</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="momentum">Momentum</option>
                <option value="rebalance">Rebalance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Trading Pair</label>
              <select className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40">
                <option value="WTR/NXS">WTR / NXS</option>
                <option value="NXS/XRP">NXS / XRP</option>
                <option value="ENG/XRP">ENG / XRP</option>
                <option value="WTR/XRP">WTR / XRP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Position Size</label>
              <input
                type="number"
                defaultValue={50000}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Daily Trades</label>
              <input
                type="number"
                defaultValue={100}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Stop Loss %</label>
              <input
                type="number"
                defaultValue={5}
                step={0.5}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Slippage (bps)</label>
              <input
                type="number"
                defaultValue={50}
                className="w-full px-3 py-2 bg-gray-950/60 border border-gray-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-nexus-400/40"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button className="flex items-center gap-2 px-5 py-2 bg-nexus-400 text-gray-950 text-sm font-semibold rounded-xl hover:bg-nexus-300 transition-colors">
              <Zap size={14} />
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
