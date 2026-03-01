import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Shield, AlertTriangle, FileText, Globe, Activity } from 'lucide-react';
import { Card, Spinner } from '@/components/common';
import { useWallet } from '@/hooks';

export default function Admin() {
  const { hasRole } = useWallet();
  const isAdmin = hasRole('council') || hasRole('auditor') || hasRole('oracle');
  const [pendingCount, setPendingCount] = useState(0);
  const [allowlistCount, setAllowlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [proofsRes, allowlistRes] = await Promise.all([
          fetch('/api/proofs'),
          fetch('/api/admin/allowlist'),
        ]);
        const proofsJson = await proofsRes.json();
        const allowlistJson = await allowlistRes.json();

        if (proofsJson.success) {
          const proofs = proofsJson.data?.data ?? proofsJson.data;
          setPendingCount(proofs.filter((p: { status: string }) => p.status === 'pending').length);
        }
        if (allowlistJson.success) {
          setAllowlistCount(allowlistJson.data?.participants?.length ?? 0);
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div>
        <h1 className="page-title">Admin</h1>
        <Card>
          <p className="text-sm text-red-400">
            Access denied. This section requires council, auditor, or oracle role.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const cards = [
    {
      to: '/admin/proofs',
      icon: <ClipboardCheck className="w-5 h-5" />,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      title: 'Proof Queue',
      description: 'Review and approve/reject proof submissions',
      stat: pendingCount > 0 ? `${pendingCount} pending` : 'All clear',
      statColor: pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400',
    },
    {
      to: '/admin/allowlist',
      icon: <Shield className="w-5 h-5" />,
      iconBg: 'bg-nexus-500/10',
      iconColor: 'text-nexus-400',
      title: 'Market Allowlist',
      description: 'Manage participant and asset allowlists',
      stat: `${allowlistCount} participants`,
      statColor: 'text-gray-400',
    },
    {
      to: '/admin/emergency',
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      title: 'Emergency Controls',
      description: 'Pause minting, freeze market, manage circuit breakers',
      stat: 'No active states',
      statColor: 'text-emerald-400',
    },
    {
      to: '/admin/audit',
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      title: 'Audit Log',
      description: 'Immutable append-only activity log',
      stat: 'View log',
      statColor: 'text-gray-400',
    },
    {
      to: '/admin/networks',
      icon: <Globe className="w-5 h-5" />,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      title: 'Networks',
      description: 'Multi-chain governance network registry & spoke mirrors',
      stat: 'View registry',
      statColor: 'text-gray-400',
    },
    {
      to: '/admin/protocol-health',
      icon: <Activity className="w-5 h-5" />,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      title: 'Protocol Health',
      description: 'Institutional readiness score & adversarial stress analysis',
      stat: 'Grade: B (73/100)',
      statColor: 'text-purple-400',
    },
  ];

  return (
    <div>
      <h1 className="page-title">Admin Console</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="card hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor}`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white group-hover:text-nexus-400 transition-colors">
                  {card.title}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{card.description}</div>
                <div className={`text-xs mt-2 font-medium ${card.statColor}`}>
                  {card.stat}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
