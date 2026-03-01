import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Filter } from 'lucide-react';
import { Card, StatusBadge, Spinner } from '@/components/common';

interface AuditLogEntry {
  id: string;
  action: string;
  actor_wallet: string;
  actor_role: string;
  target: string;
  details: string;
  timestamp: string;
}

function truncateWallet(addr: string): string {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

const actionColors: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'cyan'> = {
  proof_approved: 'green',
  proof_rejected: 'red',
  batch_minted: 'blue',
  proposal_executed: 'cyan',
  allowlist_update: 'cyan',
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/audit-log');
        const json = await res.json();
        if (json.success) {
          setEntries(json.data ?? []);
        }
      } catch (err) {
        console.error('Failed to load audit log:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter entries
  let filtered = entries;
  if (filter !== 'all') {
    filtered = filtered.filter((e) => e.action === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.details.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.actor_wallet.toLowerCase().includes(q),
    );
  }

  // Sort most recent first
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const actionTypes = Array.from(new Set(entries.map((e) => e.action)));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Audit Log</h1>
        <span className="text-xs text-gray-500">{entries.length} entries</span>
      </div>

      <Card>
        <div className="text-sm text-gray-500 mb-4">
          Immutable, append-only log of all administrative actions.
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white text-xs pl-8 pr-3 py-1.5 rounded border border-gray-700 focus:border-nexus-500 focus:outline-none appearance-none"
            >
              <option value="all">All categories</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded border border-gray-700 focus:border-nexus-500 focus:outline-none flex-1"
          />
        </div>

        {/* Timeline */}
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">No audit log entries match your filter.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-800" />

            <div className="space-y-1">
              {sorted.map((entry) => (
                <div key={entry.id} className="relative flex gap-4 pl-7 py-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 top-4 w-[15px] h-[15px] rounded-full border-2 bg-gray-900 ${
                      entry.action.includes('rejected')
                        ? 'border-red-500'
                        : entry.action.includes('approved')
                          ? 'border-emerald-500'
                          : entry.action.includes('minted')
                            ? 'border-blue-500'
                            : entry.action.includes('executed')
                              ? 'border-cyan-500'
                              : 'border-gray-600'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusBadge status={entry.action} color={actionColors[entry.action]} />
                      <span className="text-xs text-gray-500 font-mono" title={entry.actor_wallet}>
                        {truncateWallet(entry.actor_wallet)}
                      </span>
                      <StatusBadge status={entry.actor_role} color="gray" />
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-300 mb-1">
                      {entry.details}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span>{relativeTime(entry.timestamp)}</span>
                      <span className="font-mono">target: {entry.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
