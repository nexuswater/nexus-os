import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Store, Plus, TrendingUp, MessageSquare, Terminal,
  Briefcase, ArrowLeftRight, Zap, GitBranch, ShieldCheck, FileDown,
  AlertTriangle, Vote, BarChart3, Wrench, Siren, Calendar,
  Loader2, Trash2, Play,
} from 'lucide-react';
import {
  useNexusSites,
  useNexusBatches,
  useNexusReceipts,
  useNexusProposals,
  useNexusUser,
  useNexusActions,
  useNexusEvents,
  useNexusVotes,
  useNexusPrices,
} from '@/mock/useNexusStore';
import { Select } from '@/components/common';

// ── Constants ──────────────────────────────────────────────────

const TOKENS = ['NXS', 'WTR', 'ENG', 'XRP', 'RLUSD', 'USDC', 'ETH'] as const;
const CHAINS = ['XRPL', 'BASE', 'ARBITRUM', 'COREUM'] as const;
const BRIDGE_TOKENS = ['NXS', 'WTR', 'ENG', 'USDC'] as const;

type Category = 'ANALYTICS' | 'TRADING' | 'BRIDGE' | 'VERIFICATION' | 'EXPORT' | 'MONITORING' | 'GOVERNANCE' | 'OPERATIONS' | 'EMERGENCY';

interface SkillDef {
  id: string;
  name: string;
  icon: typeof Briefcase;
  category: Category;
  description: string;
}

const SKILLS: SkillDef[] = [
  { id: 'portfolio',    name: 'Review Portfolio',        icon: Briefcase,      category: 'ANALYTICS',     description: 'Aggregate balances across all chains and display risk summary.' },
  { id: 'swapQuote',    name: 'Generate Swap Quote',     icon: ArrowLeftRight, category: 'TRADING',       description: 'Fetch a real-time price quote for a token swap.' },
  { id: 'swap',         name: 'Execute Swap',            icon: Zap,            category: 'TRADING',       description: 'Execute a token swap through the DEX aggregator.' },
  { id: 'bridge',       name: 'Start Bridge Transfer',   icon: GitBranch,      category: 'BRIDGE',        description: 'Initiate a cross-chain bridge transfer.' },
  { id: 'verify',       name: 'Verify Mint Receipt',     icon: ShieldCheck,    category: 'VERIFICATION',  description: 'Run verification rules against a mint receipt.' },
  { id: 'audit',        name: 'Generate Audit Pack',     icon: FileDown,       category: 'EXPORT',        description: 'Export a compliance audit pack in selected formats.' },
  { id: 'anomaly',      name: 'Detect Anomalies',        icon: AlertTriangle,  category: 'MONITORING',    description: 'Scan a site for data anomalies and create alerts.' },
  { id: 'proposal',     name: 'Create DAO Proposal',     icon: Vote,           category: 'GOVERNANCE',    description: 'Submit a new governance proposal to the DAO.' },
  { id: 'govSummary',   name: 'Governance Summary',      icon: BarChart3,      category: 'ANALYTICS',     description: 'Compute participation stats across all proposals.' },
  { id: 'maintenance',  name: 'Recommend Maintenance',   icon: Wrench,         category: 'OPERATIONS',    description: 'Flag a site for scheduled maintenance.' },
  { id: 'emergency',    name: 'Route Emergency Water',   icon: Siren,          category: 'EMERGENCY',     description: 'Dispatch emergency water routing between two sites.' },
  { id: 'monthEnd',     name: 'Month End Close',         icon: Calendar,       category: 'OPERATIONS',    description: 'Advance proposals and retire active batch fractions.' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  ANALYTICS:    'text-sky-400 border-sky-400/30 bg-sky-400/5',
  TRADING:      'text-[#25D695] border-[#25D695]/30 bg-[#25D695]/5',
  BRIDGE:       'text-amber-400 border-amber-400/30 bg-amber-400/5',
  VERIFICATION: 'text-teal-400 border-teal-400/30 bg-teal-400/5',
  EXPORT:       'text-blue-400 border-blue-400/30 bg-blue-400/5',
  MONITORING:   'text-orange-400 border-orange-400/30 bg-orange-400/5',
  GOVERNANCE:   'text-pink-400 border-pink-400/30 bg-pink-400/5',
  OPERATIONS:   'text-gray-400 border-gray-400/30 bg-gray-400/5',
  EMERGENCY:    'text-red-400 border-red-400/30 bg-red-400/5',
};

const NAV_LINKS = [
  { label: 'My Agents',    path: '/agents/my',                           icon: Bot },
  { label: 'Marketplace',  path: '/agents/marketplace',                  icon: Store },
  { label: 'Create Agent', path: '/agents/create',                       icon: Plus },
  { label: 'Trading',      path: '/agents/agent_water_trader/trading',   icon: TrendingUp },
  { label: 'A2A Intents',  path: '/agents/intents',                      icon: MessageSquare },
] as const;

interface ConsoleEntry {
  id: number;
  ts: string;
  skill: string;
  lines: string[];
  status: 'SUCCESS' | 'ERROR';
}

// ── Main Component ─────────────────────────────────────────────

export default function Agents() {
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [running, setRunning] = useState(false);
  const [consoleLog, setConsoleLog] = useState<ConsoleEntry[]>([]);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const entryId = useRef(0);

  const sites = useNexusSites();
  const batches = useNexusBatches();
  const receipts = useNexusReceipts();
  const proposals = useNexusProposals();
  const user = useNexusUser();
  const actions = useNexusActions();
  const events = useNexusEvents();
  const votes = useNexusVotes();
  const prices = useNexusPrices();

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLog]);

  const selectSkill = useCallback((skill: SkillDef) => {
    setSelectedSkill(skill);
    setFormState({});
  }, []);

  const setField = useCallback((key: string, val: any) => {
    setFormState(prev => ({ ...prev, [key]: val }));
  }, []);

  const pushEntry = useCallback((skill: string, lines: string[], status: 'SUCCESS' | 'ERROR') => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog(prev => [...prev, { id: ++entryId.current, ts, skill, lines, status }]);
  }, []);

  const clearConsole = useCallback(() => setConsoleLog([]), []);

  // ── Skill Execution ────────────────────────────────────────

  const runSkill = useCallback(async () => {
    if (!selectedSkill || running) return;
    setRunning(true);

    // Simulate brief async delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

    try {
      const lines: string[] = [];
      const sk = selectedSkill.id;

      if (sk === 'portfolio') {
        lines.push('--- Portfolio Balances ---');
        const totals: Record<string, number> = {};
        user.chainBalances.forEach(cb => {
          Object.entries(cb.balances).forEach(([tok, amt]) => {
            totals[tok] = (totals[tok] || 0) + (amt as number);
          });
        });
        let totalUsd = 0;
        Object.entries(totals).forEach(([tok, amt]) => {
          const price = prices.find(p => p.token === tok)?.usd ?? 0;
          const usd = amt * price;
          totalUsd += usd;
          lines.push(`  ${tok.padEnd(8)} ${amt.toLocaleString(undefined, { maximumFractionDigits: 2 }).padStart(14)}  ~$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        });
        lines.push(`  ${'TOTAL'.padEnd(8)} ${''.padStart(14)}  ~$${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        lines.push('--- Risk Summary ---');
        const highRisk = Object.entries(totals).filter(([, v]) => v > 10000).length;
        lines.push(`  Concentrated positions (>10k): ${highRisk}`);
        lines.push(`  Chains active: ${user.chainBalances.length}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'swapQuote') {
        const tokenIn = formState.tokenIn || TOKENS[0];
        const tokenOut = formState.tokenOut || TOKENS[1];
        const amount = parseFloat(formState.amount) || 100;
        const quote = actions.swapQuote(tokenIn as any, tokenOut as any, amount);
        lines.push(`Quote: ${amount} ${tokenIn} -> ${tokenOut}`);
        lines.push(`  Mid Price:         ${quote.midPrice.toFixed(6)}`);
        lines.push(`  Amount Out:   ${quote.amountOut.toFixed(4)} ${tokenOut}`);
        lines.push(`  Fee:          ${quote.fee.toFixed(4)}`);
        lines.push(`  Slippage:     ${(quote.slippage * 100).toFixed(2)}%`);
        lines.push(`  Route:        ${quote.route.join(' -> ')}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'swap') {
        const tokenIn = formState.tokenIn || TOKENS[0];
        const tokenOut = formState.tokenOut || TOKENS[1];
        const amount = parseFloat(formState.amount) || 100;
        actions.swap(tokenIn as any, tokenOut as any, amount);
        lines.push(`Swap executed: ${amount} ${tokenIn} -> ${tokenOut}`);
        lines.push('  Status:     FILLED');
        lines.push(`  Timestamp:  ${new Date().toISOString()}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'bridge') {
        const token = formState.token || BRIDGE_TOKENS[0];
        const amount = parseFloat(formState.amount) || 50;
        const fromChain = formState.fromChain || CHAINS[0];
        const toChain = formState.toChain || CHAINS[1];
        actions.bridge(token as any, amount, fromChain as any, toChain as any);
        lines.push(`Bridge initiated: ${amount} ${token}`);
        lines.push(`  From:   ${fromChain}`);
        lines.push(`  To:     ${toChain}`);
        lines.push('  Status: INITIATED');
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'verify') {
        const receiptId = formState.receiptId || receipts[0]?.id;
        if (!receiptId) throw new Error('No receipts available');
        const result = actions.verifyReceipt(receiptId) as any;
        lines.push(`Receipt: ${receiptId}`);
        lines.push(`  Score:    ${result?.score ?? 'N/A'}/100`);
        lines.push('  Rules:');
        (result?.rules ?? []).forEach((r: any) => {
          lines.push(`    [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
        });
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'audit') {
        const formats = new Set<string>();
        if (formState.pdf !== false) formats.add('PDF');
        if (formState.csv) formats.add('CSV');
        if (formState.json) formats.add('JSON');
        if (formats.size === 0) formats.add('PDF');
        const result = actions.exportAuditPack(receipts.slice(0, 5), { region: 'ALL' }, formats) as any;
        lines.push('Audit Pack generated');
        lines.push(`  Receipts:  ${receipts.slice(0, 5).length}`);
        lines.push(`  Formats:   ${[...formats].join(', ')}`);
        lines.push(`  Artifacts: ${result?.artifacts?.length ?? 'N/A'}`);
        lines.push(`  Size:      ${result?.totalBytes ? (result.totalBytes / 1024).toFixed(1) + ' KB' : 'N/A'}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'anomaly') {
        const siteId = formState.siteId || sites[0]?.id;
        if (!siteId) throw new Error('No sites available');
        const site = sites.find(s => s.id === siteId);
        actions.createAlert(siteId, 'OUTLIER', 'HIGH', `Anomaly detected by agent at ${site?.name || siteId}`);
        lines.push(`Anomaly scan: ${site?.name || siteId}`);
        lines.push('  Alert created: OUTLIER / HIGH');
        lines.push(`  Site status:   ${site?.status}`);
        lines.push(`  TDS reading:   ${site?.waterQuality.tds ?? 'N/A'}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'proposal') {
        const title = formState.title || 'Untitled Proposal';
        const type = formState.type || 'BUDGET';
        const desc = formState.description || 'No description provided.';
        actions.createProposal(title, type, desc);
        lines.push(`Proposal created: "${title}"`);
        lines.push(`  Type:   ${type}`);
        lines.push(`  Status: DRAFT`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'govSummary') {
        lines.push('--- Governance Summary ---');
        const total = proposals.length;
        const active = proposals.filter(p => p.status === 'ACTIVE').length;
        const passed = proposals.filter(p => p.status === 'PASSED').length;
        const failed = proposals.filter(p => p.status === 'FAILED').length;
        const totalVotes = votes.length;
        const forVotes = votes.filter(v => v.choice === 'FOR').length;
        const againstVotes = votes.filter(v => v.choice === 'AGAINST').length;
        const quorum = proposals.length > 0 ? proposals.reduce((s, p) => s + p.totalVoters, 0) / proposals.length : 0;
        lines.push(`  Total Proposals:  ${total}`);
        lines.push(`  Active:           ${active}`);
        lines.push(`  Passed:           ${passed}`);
        lines.push(`  Failed:           ${failed}`);
        lines.push(`  Total Votes Cast: ${totalVotes}`);
        lines.push(`  FOR votes:        ${forVotes} (${totalVotes ? ((forVotes / totalVotes) * 100).toFixed(1) : 0}%)`);
        lines.push(`  AGAINST votes:    ${againstVotes} (${totalVotes ? ((againstVotes / totalVotes) * 100).toFixed(1) : 0}%)`);
        lines.push(`  Avg Participation: ${quorum.toFixed(0)} voters`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'maintenance') {
        const siteId = formState.siteId || sites[0]?.id;
        if (!siteId) throw new Error('No sites available');
        const site = sites.find(s => s.id === siteId);
        actions.createAlert(siteId, 'MAINTENANCE_DUE', 'MEDIUM', `Maintenance recommended for ${site?.name || siteId}`);
        lines.push(`Maintenance alert: ${site?.name || siteId}`);
        lines.push('  Category:  MAINTENANCE_DUE');
        lines.push('  Severity:  MEDIUM');
        lines.push(`  Next audit: ${site?.compliance.nextAudit ?? 'N/A'}`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'emergency') {
        const fromSiteId = formState.fromSiteId || sites[0]?.id;
        const toSiteId = formState.toSiteId || sites[1]?.id;
        if (!fromSiteId || !toSiteId) throw new Error('Need two sites');
        const fromSite = sites.find(s => s.id === fromSiteId);
        const toSite = sites.find(s => s.id === toSiteId);
        actions.createAlert(
          fromSiteId, 'EMERGENCY' as any, 'CRITICAL',
          `Emergency water routing: ${fromSite?.name} -> ${toSite?.name}`
        );
        lines.push('Emergency routing dispatched');
        lines.push(`  From: ${fromSite?.name} (${fromSite?.location.city})`);
        lines.push(`  To:   ${toSite?.name} (${toSite?.location.city})`);
        lines.push('  Severity: CRITICAL');
        lines.push('  Status:   DISPATCHED');
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }

      else if (sk === 'monthEnd') {
        actions.advanceProposals();
        const activeBatches = batches.filter(b => b.status === 'ACTIVE').slice(0, 3);
        let retired = 0;
        activeBatches.forEach(b => {
          const amt = Math.min(b.amountMinted * 0.05, b.remainingValue);
          if (amt > 0) {
            actions.retire(b.id, amt);
            retired++;
          }
        });
        lines.push('Month-End Close executed');
        lines.push('  Proposals advanced');
        lines.push(`  Batches retired: ${retired}/${activeBatches.length}`);
        lines.push(`  Retirement rate: 5% of minted`);
        pushEntry(selectedSkill.name, lines, 'SUCCESS');
      }
    } catch (err: any) {
      pushEntry(selectedSkill.name, [`ERROR: ${err.message || String(err)}`], 'ERROR');
    } finally {
      setRunning(false);
    }
  }, [selectedSkill, running, formState, actions, user, prices, receipts, sites, batches, proposals, votes, pushEntry]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B0F14] text-gray-300 pb-12 space-y-4">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#25D695]/10 flex items-center justify-center">
            <Terminal size={16} className="text-[#25D695]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Agent Skills Runner</h1>
            <p className="text-[10px] font-mono text-gray-600">{'// phase_6 > interactive_skills'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-500 hover:text-[#25D695] hover:bg-[#111820] rounded-md transition-all">
                <Icon size={12} /> {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 3-Column Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-4">

        {/* LEFT: Skills List */}
        <div className="space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2 px-1">
            Available Skills ({SKILLS.length})
          </div>
          {SKILLS.map(skill => {
            const Icon = skill.icon;
            const active = selectedSkill?.id === skill.id;
            return (
              <button key={skill.id} onClick={() => selectSkill(skill)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  active
                    ? 'bg-[#111820] border-[#25D695]/40 shadow-[0_0_12px_rgba(37,214,149,0.08)]'
                    : 'bg-[#111820] border-[#1C2432] hover:border-gray-600'
                }`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${active ? 'bg-[#25D695]/10' : 'bg-[#1C2432]'}`}>
                    <Icon size={14} className={active ? 'text-[#25D695]' : 'text-gray-500'} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[12px] font-mono font-medium truncate ${active ? 'text-white' : 'text-gray-300'}`}>{skill.name}</div>
                    <span className={`inline-block text-[8px] font-mono uppercase tracking-widest mt-0.5 px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[skill.category]}`}>
                      {skill.category}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">{skill.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CENTER: Skill Runner */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg overflow-hidden flex flex-col">
          {selectedSkill ? (
            <>
              <div className="px-5 py-4 border-b border-[#1C2432]">
                <div className="flex items-center gap-2 mb-1">
                  <selectedSkill.icon size={16} className="text-[#25D695]" />
                  <h2 className="text-sm font-mono font-semibold text-white">{selectedSkill.name}</h2>
                  <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedSkill.category]}`}>
                    {selectedSkill.category}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono">{selectedSkill.description}</p>
              </div>

              <div className="flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar">
                <SkillForm
                  skillId={selectedSkill.id}
                  formState={formState}
                  setField={setField}
                  sites={sites}
                  receipts={receipts}
                />
              </div>

              <div className="px-5 py-3 border-t border-[#1C2432]">
                <button onClick={runSkill} disabled={running}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#25D695] text-[#0B0F14] hover:bg-[#25D695]/90 active:scale-[0.98]">
                  {running ? <><Loader2 size={16} className="animate-spin" /> Running...</> : <><Play size={14} /> Run Skill</>}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Terminal size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-mono text-gray-600">Select a skill to begin</p>
                <p className="text-[10px] font-mono text-gray-700 mt-1">12 skills available</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Output Console */}
        <div className="bg-[#0A0E13] border border-[#1C2432] rounded-lg overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
          <div className="px-4 py-2.5 border-b border-[#1C2432] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D695] opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D695]" />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Output Console</span>
            </div>
            {consoleLog.length > 0 && (
              <button onClick={clearConsole}
                className="flex items-center gap-1 text-[10px] font-mono uppercase text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar font-mono text-[11px]">
            {consoleLog.length === 0 && (
              <div className="text-gray-700 text-center py-8 text-[10px]">
                {'> Awaiting skill execution...'}
              </div>
            )}
            {consoleLog.map(entry => (
              <div key={entry.id} className="border-b border-[#1C2432]/60 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-600">[{entry.ts}]</span>
                  <span className="text-[#25D695] font-semibold">{entry.skill}</span>
                  <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    entry.status === 'SUCCESS' ? 'text-[#25D695] bg-[#25D695]/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {entry.status}
                  </span>
                </div>
                {entry.lines.map((line, i) => (
                  <div key={i} className={`whitespace-pre leading-relaxed ${
                    line.startsWith('ERROR') ? 'text-red-400'
                    : line.startsWith('---') ? 'text-gray-500'
                    : line.includes('[PASS]') ? 'text-[#25D695]'
                    : line.includes('[FAIL]') ? 'text-red-400'
                    : 'text-gray-400'
                  }`}>{line}</div>
                ))}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skill Form Component ───────────────────────────────────────

function SkillForm({
  skillId,
  formState,
  setField,
  sites,
  receipts,
}: {
  skillId: string;
  formState: Record<string, any>;
  setField: (key: string, val: any) => void;
  sites: any[];
  receipts: any[];
}) {
  const inputCls = 'w-full bg-[#0B0F14] border border-[#1C2432] rounded-md px-3 py-2 text-sm font-mono text-gray-300 focus:outline-none focus:border-[#25D695]/50 transition-colors';
  const labelCls = 'block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5';

  if (skillId === 'portfolio' || skillId === 'govSummary' || skillId === 'monthEnd') {
    return (
      <div className="text-center py-6">
        <p className="text-sm font-mono text-gray-500">No inputs required</p>
        <p className="text-[10px] font-mono text-gray-700 mt-1">Click Run Skill to execute</p>
      </div>
    );
  }

  if (skillId === 'swapQuote' || skillId === 'swap') {
    return (
      <>
        <div>
          <label className={labelCls}>Token In</label>
          <Select value={formState.tokenIn || ''} onChange={v => setField('tokenIn', v)} placeholder="Select token..."
            options={TOKENS.map(t => ({ value: t, label: t }))} />
        </div>
        <div>
          <label className={labelCls}>Token Out</label>
          <Select value={formState.tokenOut || ''} onChange={v => setField('tokenOut', v)} placeholder="Select token..."
            options={TOKENS.map(t => ({ value: t, label: t }))} />
        </div>
        <div>
          <label className={labelCls}>Amount</label>
          <input type="number" placeholder="100" value={formState.amount || ''} onChange={e => setField('amount', e.target.value)} className={inputCls} />
        </div>
      </>
    );
  }

  if (skillId === 'bridge') {
    return (
      <>
        <div>
          <label className={labelCls}>Token</label>
          <Select value={formState.token || ''} onChange={v => setField('token', v)} placeholder="Select token..."
            options={BRIDGE_TOKENS.map(t => ({ value: t, label: t }))} />
        </div>
        <div>
          <label className={labelCls}>Amount</label>
          <input type="number" placeholder="50" value={formState.amount || ''} onChange={e => setField('amount', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>From Chain</label>
          <Select value={formState.fromChain || ''} onChange={v => setField('fromChain', v)} placeholder="Select chain..."
            options={CHAINS.map(c => ({ value: c, label: c }))} />
        </div>
        <div>
          <label className={labelCls}>To Chain</label>
          <Select value={formState.toChain || ''} onChange={v => setField('toChain', v)} placeholder="Select chain..."
            options={CHAINS.map(c => ({ value: c, label: c }))} />
        </div>
      </>
    );
  }

  if (skillId === 'verify') {
    return (
      <div>
        <label className={labelCls}>Receipt ID</label>
        <Select value={formState.receiptId || ''} onChange={v => setField('receiptId', v)} placeholder="Select receipt..."
          options={receipts.map(r => ({ value: r.id, label: `${r.id} (${r.ticker} - ${r.amount})` }))} />
      </div>
    );
  }

  if (skillId === 'audit') {
    return (
      <div>
        <label className={labelCls}>Export Formats</label>
        <div className="space-y-2 mt-2">
          {['PDF', 'CSV', 'JSON'].map(fmt => (
            <label key={fmt} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox"
                checked={formState[fmt.toLowerCase()] ?? (fmt === 'PDF')}
                onChange={e => setField(fmt.toLowerCase(), e.target.checked)}
                className="w-4 h-4 rounded border-[#1C2432] bg-[#0B0F14] text-[#25D695] focus:ring-[#25D695]/30 focus:ring-offset-0"
              />
              <span className="text-sm font-mono text-gray-400 group-hover:text-gray-300 transition-colors">{fmt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (skillId === 'anomaly' || skillId === 'maintenance') {
    return (
      <div>
        <label className={labelCls}>Site</label>
        <Select value={formState.siteId || ''} onChange={v => setField('siteId', v)} placeholder="Select site..."
          options={sites.map(s => ({ value: s.id, label: `${s.name} (${s.location.city})` }))} />
      </div>
    );
  }

  if (skillId === 'proposal') {
    return (
      <>
        <div>
          <label className={labelCls}>Title</label>
          <input type="text" placeholder="Proposal title..." value={formState.title || ''} onChange={e => setField('title', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <Select value={formState.type || ''} onChange={v => setField('type', v)} placeholder="Select type..."
            options={['REWARD_RATE', 'NEW_DEPLOYMENT', 'BUDGET', 'PARAMETER_CHANGE', 'EMERGENCY'].map(t => ({ value: t, label: t.replace(/_/g, ' ') }))} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={4} placeholder="Describe the proposal..." value={formState.description || ''} onChange={e => setField('description', e.target.value)}
            className={`${inputCls} resize-none`} />
        </div>
      </>
    );
  }

  if (skillId === 'emergency') {
    return (
      <>
        <div>
          <label className={labelCls}>From Site (Source)</label>
          <Select value={formState.fromSiteId || ''} onChange={v => setField('fromSiteId', v)} placeholder="Select source site..."
            options={sites.map(s => ({ value: s.id, label: `${s.name} (${s.location.city})` }))} />
        </div>
        <div>
          <label className={labelCls}>To Site (Destination)</label>
          <Select value={formState.toSiteId || ''} onChange={v => setField('toSiteId', v)} placeholder="Select destination site..."
            options={sites.map(s => ({ value: s.id, label: `${s.name} (${s.location.city})` }))} />
        </div>
      </>
    );
  }

  return null;
}
