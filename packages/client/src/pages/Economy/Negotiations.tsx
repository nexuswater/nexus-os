/**
 * Agent Economy — Negotiations
 * Combined RFQ Marketplace + Negotiation Thread + Escrow Dashboard.
 */

import { useState, useMemo } from 'react';
import {
  Handshake, Clock, Users, Send, Lock, CheckCircle2,
  ArrowRightLeft, ChevronDown, ChevronRight, Sparkles,
  FileText, Shield, MessageSquare, RefreshCw,
} from 'lucide-react';
import { TabGroup } from '@/components/common';
import {
  generateRFQs,
  generateOffers,
  generateNegotiationMessages,
  generateEscrows,
  generateEconAgents,
  generateBotSignals,
} from '@/mock/generators/economy';

// ─── Data ────────────────────────────────────────────────

const rfqs = generateRFQs();
const offers = generateOffers();
const messages = generateNegotiationMessages();
const escrows = generateEscrows();
const agents = generateEconAgents();
const signals = generateBotSignals();

const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

function agentName(id: string) {
  return agentMap[id]?.name ?? id;
}

function agentScore(id: string) {
  return agentMap[id]?.reputationScore ?? 0;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

// ─── Status Badge Colors ─────────────────────────────────

const RFQ_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-[#25D695]/15 text-[#25D695] border-[#25D695]/30',
  NEGOTIATING: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  ACCEPTED: 'bg-teal-400/15 text-teal-400 border-teal-400/30',
  EXPIRED: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
};

const OFFER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-blue-400/15 text-blue-400',
  COUNTERED: 'bg-amber-400/15 text-amber-400',
  ACCEPTED: 'bg-[#25D695]/15 text-[#25D695]',
  REJECTED: 'bg-red-400/15 text-red-400',
};

const ESCROW_STATUS_COLORS: Record<string, string> = {
  LOCKED: 'bg-amber-400/15 text-amber-400',
  RELEASED: 'bg-[#25D695]/15 text-[#25D695]',
  REFUNDED: 'bg-red-400/15 text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  SKILL: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  TRADE: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  REDEMPTION: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  RETIREMENT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

// ─── Tabs ────────────────────────────────────────────────

const TABS = ['Open RFQs', 'My Negotiations', 'Escrow Dashboard'] as const;

// ─── Component ───────────────────────────────────────────

export default function Negotiations() {
  const [activeTab, setActiveTab] = useState<string>('Open RFQs');
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>('rfq_003');

  // ─── Escrow Stats ────────────────────────────────────

  const totalLocked = useMemo(
    () => escrows.filter(e => e.status === 'LOCKED').reduce((s, e) => s + e.amount, 0),
    [],
  );
  const pendingCount = escrows.filter(e => e.status === 'LOCKED').length;
  const completedCount = escrows.filter(e => e.status === 'RELEASED').length;

  // ─── Negotiation Helpers ─────────────────────────────

  const selectedRfq = rfqs.find(r => r.id === selectedRfqId);
  const threadMessages = messages.filter(m => m.rfqId === selectedRfqId);
  const threadOffers = offers.filter(o => o.rfqId === selectedRfqId);

  const rfqSignal = signals.find(
    s =>
      s.type === 'OFFER_RECOMMENDED' &&
      (s.payload as any).rfqId === selectedRfqId,
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-5">
        <TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ═══ Open RFQs ═══════════════════════════════════ */}
      {activeTab === 'Open RFQs' && (
        <div className="space-y-3">
          {rfqs.map(rfq => {
            const rfqOffers = offers.filter(o => o.rfqId === rfq.id);
            const subjectSummary =
              (rfq.subject as any).skillSlug ??
              `${(rfq.subject as any).fromAsset ?? (rfq.subject as any).asset} ${
                (rfq.subject as any).amount?.toLocaleString() ?? ''
              }`;
            return (
              <div
                key={rfq.id}
                className="bg-[#111820] border border-[#1C2432] rounded-lg p-4 hover:border-[#25D695]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category badge */}
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          CATEGORY_COLORS[rfq.category] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {rfq.category}
                      </span>
                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          RFQ_STATUS_COLORS[rfq.status] ?? ''
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </div>

                    <p className="text-sm text-white font-medium truncate">
                      {subjectSummary}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {agentName(rfq.requesterAgentId)}
                      </span>
                      <span className="font-mono text-[#25D695]">
                        {agentScore(rfq.requesterAgentId)} rep
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {relativeTime(rfq.expiresAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={11} />
                        {rfqOffers.length} offers
                      </span>
                    </div>
                  </div>

                  {/* Right */}
                  {rfq.status === 'OPEN' && (
                    <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#25D695] text-gray-950 text-xs font-semibold rounded-lg hover:bg-[#25D695]/90 transition-colors">
                      <Send size={12} />
                      Submit Offer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ My Negotiations ═════════════════════════════ */}
      {activeTab === 'My Negotiations' && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* RFQ list sidebar */}
          <div className="lg:w-64 shrink-0 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-1 block">
              Active Threads
            </span>
            {rfqs
              .filter(r => ['NEGOTIATING', 'ACCEPTED'].includes(r.status))
              .map(rfq => (
                <button
                  key={rfq.id}
                  onClick={() => setSelectedRfqId(rfq.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedRfqId === rfq.id
                      ? 'bg-[#111820] border-[#25D695]/40 text-white'
                      : 'bg-[#111820] border-[#1C2432] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        RFQ_STATUS_COLORS[rfq.status]
                      }`}
                    >
                      {rfq.status}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">{rfq.id}</span>
                  </div>
                  <p className="text-xs truncate">
                    {(rfq.subject as any).skillSlug ??
                      `${(rfq.subject as any).fromAsset ?? (rfq.subject as any).asset}`}
                  </p>
                </button>
              ))}
          </div>

          {/* Thread view */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            {/* Conversation */}
            <div className="flex-1 bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
              {selectedRfq ? (
                <>
                  {/* Status bar */}
                  <div className="px-4 py-3 border-b border-[#1C2432] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-[#25D695]" />
                      <span className="text-xs font-medium text-white">
                        {agentName(selectedRfq.requesterAgentId)}
                        {selectedRfq.targetAgentId &&
                          ` / ${agentName(selectedRfq.targetAgentId)}`}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        RFQ_STATUS_COLORS[selectedRfq.status]
                      }`}
                    >
                      {selectedRfq.status}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
                    {threadMessages.map(msg => {
                      const isOffer = msg.type === 'OFFER';
                      const relatedOffer = isOffer
                        ? offers.find(o => o.id === (msg.payload as any).offerId)
                        : null;
                      return (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {agentName(msg.senderAgentId)}
                            </span>
                            <span className="text-[10px] text-gray-600 font-mono">
                              {fmtDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {(msg.payload as any).text}
                          </p>
                          {/* Embedded offer card */}
                          {relatedOffer && (
                            <div className="mt-2 bg-[#0B0F14] border border-[#1C2432] rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <ArrowRightLeft size={12} className="text-[#25D695]" />
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                                  Offer
                                </span>
                                <span
                                  className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                    OFFER_STATUS_COLORS[relatedOffer.status]
                                  }`}
                                >
                                  {relatedOffer.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-gray-600 block">
                                    Price
                                  </span>
                                  <span className="text-white font-mono font-semibold">
                                    {relatedOffer.terms.price.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-600 block">
                                    Currency
                                  </span>
                                  <span className="text-gray-300 font-mono">
                                    {relatedOffer.terms.currency}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-600 block">
                                    Units
                                  </span>
                                  <span className="text-gray-300 font-mono">
                                    {relatedOffer.terms.units.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-600 block">
                                    Settlement
                                  </span>
                                  <span className="text-gray-300 font-mono">
                                    {relatedOffer.terms.settlementType}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {threadMessages.length === 0 && (
                      <p className="text-xs text-gray-600 text-center py-10">
                        No messages yet
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-sm text-gray-600">
                  Select a negotiation thread
                </div>
              )}
            </div>

            {/* Right sidebar: Offers */}
            <div className="lg:w-72 shrink-0 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                Current Offers
              </span>

              {threadOffers.map(offer => (
                <div
                  key={offer.id}
                  className="bg-[#111820] border border-[#1C2432] rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">
                      {agentName(offer.senderAgentId)}
                    </span>
                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        OFFER_STATUS_COLORS[offer.status]
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-gray-600 block text-[10px]">Price</span>
                      <span className="text-white font-mono font-semibold">
                        {offer.terms.price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px]">Currency</span>
                      <span className="text-gray-300 font-mono">
                        {offer.terms.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px]">Units</span>
                      <span className="text-gray-300 font-mono">
                        {offer.terms.units.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-[10px]">Settlement</span>
                      <span className="text-gray-300 font-mono">
                        {offer.terms.settlementType}
                      </span>
                    </div>
                  </div>
                  {offer.status === 'PENDING' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button className="flex-1 text-[10px] font-semibold py-1.5 rounded bg-amber-400/15 text-amber-400 hover:bg-amber-400/25 transition-colors">
                        Counter
                      </button>
                      <button className="flex-1 text-[10px] font-semibold py-1.5 rounded bg-[#25D695]/15 text-[#25D695] hover:bg-[#25D695]/25 transition-colors">
                        Accept
                      </button>
                      <button className="flex-1 text-[10px] font-semibold py-1.5 rounded bg-red-400/15 text-red-400 hover:bg-red-400/25 transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Suggestion Chip */}
              {rfqSignal && (
                <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={12} className="text-violet-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                      Nexus Suggests
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Offer{' '}
                    <span className="text-white font-mono font-semibold">
                      {(rfqSignal.payload as any).suggestedPrice}
                    </span>{' '}
                    {(rfqSignal.payload as any).currency} (
                    {(rfqSignal.payload as any).strategy} strategy,{' '}
                    {Math.round((rfqSignal.payload as any).confidence * 100)}% confidence)
                  </p>
                </div>
              )}

              {threadOffers.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-6">
                  No offers for this RFQ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Escrow Dashboard ════════════════════════════ */}
      {activeTab === 'Escrow Dashboard' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  Total Locked
                </span>
                <Lock size={14} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {totalLocked.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">RLUSD in escrow</div>
            </div>
            <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  Pending Settlements
                </span>
                <RefreshCw size={14} className="text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {pendingCount}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Awaiting release</div>
            </div>
            <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  Completed Deals
                </span>
                <CheckCircle2 size={14} className="text-[#25D695]" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {completedCount}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Successfully released</div>
            </div>
          </div>

          {/* Escrow Table */}
          <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1C2432]">
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Escrow ID
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Payer
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Payee
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Release Condition
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map(esc => (
                    <tr
                      key={esc.id}
                      className="border-b border-[#1C2432]/50 last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">
                        {esc.id}
                      </td>
                      <td className="px-4 py-3 text-xs text-white">
                        {agentName(esc.payerAgentId)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white">
                        {agentName(esc.payeeAgentId)}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-white tabular-nums">
                        {esc.amount.toLocaleString()}{' '}
                        <span className="text-gray-500 font-normal">{esc.asset}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            ESCROW_STATUS_COLORS[esc.status] ?? ''
                          }`}
                        >
                          {esc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {esc.releaseCondition}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                        {fmtDate(esc.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {escrows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-xs text-gray-600"
                      >
                        No escrows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
