import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Vote, Clock, ArrowRightLeft } from 'lucide-react';
import { Card, Badge, Spinner } from '@/components/common';
import type { SourceNodeNFT } from '@nexus/shared';

const tierColors: Record<string, 'gray' | 'green' | 'blue' | 'yellow' | 'red'> = {
  Common: 'gray',
  Uncommon: 'green',
  Rare: 'blue',
  Epic: 'yellow',
  Legendary: 'red',
};

function truncateWallet(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function NFTImpact() {
  const { nftId } = useParams<{ nftId: string }>();
  const [nft, setNft] = useState<SourceNodeNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/nfts');
        const json = await res.json();
        if (json.success) {
          const found = (json.data as SourceNodeNFT[]).find((n) => n.nft_id === nftId);
          if (found) {
            setNft(found);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error('Failed to load NFT:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [nftId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !nft) {
    return (
      <div>
        <Link to="/impact" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Impact
        </Link>
        <Card>
          <p className="text-sm text-gray-500">NFT not found: {nftId}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link to="/impact" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Impact
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title mb-2">Source Node Impact</h1>
          <div className="flex items-center gap-3">
            <Badge color={tierColors[nft.tier] ?? 'gray'}>{nft.tier}</Badge>
            <span className="text-sm text-gray-400 tabular-nums">{nft.multiplier}x multiplier</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">NFT ID</div>
          <div className="text-xs text-gray-400 font-mono">{nft.nft_id}</div>
        </div>
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-water-500/10">
              <Star className="w-4 h-4 text-water-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Water Offset Share</span>
          </div>
          <div className="stat-value text-water-400">
            {(nft.attributes.water_offset_share * 100).toFixed(0)}%
          </div>
          <div className="stat-label">of total water impact</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">ESG Score</span>
          </div>
          <div className="stat-value text-emerald-400">
            {nft.attributes.esg_score}
          </div>
          <div className="stat-label">out of 100</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-nexus-500/10">
              <Vote className="w-4 h-4 text-nexus-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Governance Contribution</span>
          </div>
          <div className="stat-value text-nexus-400">
            {nft.attributes.governance_contribution_score}
          </div>
          <div className="stat-label">contribution score</div>
        </Card>
      </div>

      {/* Metadata */}
      <Card header="Details" icon={<Clock className="w-4 h-4" />} className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Minted</span>
            <span className="text-gray-300">{formatDate(nft.minted_at)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Current Owner</span>
            <span className="text-gray-300 font-mono text-xs">{truncateWallet(nft.owner_wallet)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Metadata URI</span>
            <span className="text-gray-400 font-mono text-xs truncate max-w-[200px]">{nft.metadata_uri}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Multiplier</span>
            <span className="text-gray-300 tabular-nums">{nft.multiplier}x</span>
          </div>
        </div>
      </Card>

      {/* Ownership History */}
      <Card header="Ownership History" icon={<ArrowRightLeft className="w-4 h-4" />}>
        {nft.ownership_history.length === 0 ? (
          <p className="text-sm text-gray-500">No ownership transfers recorded.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-800" />

            <div className="space-y-4">
              {[...nft.ownership_history]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((record, idx) => (
                  <div key={idx} className="relative flex gap-4 pl-6">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 border-gray-700 bg-gray-900" />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">{formatDate(record.timestamp)}</div>
                      <div className="text-sm text-gray-300">
                        <span className="font-mono text-xs text-gray-400">{truncateWallet(record.from_wallet)}</span>
                        <span className="text-gray-600 mx-2">&rarr;</span>
                        <span className="font-mono text-xs text-gray-300">{truncateWallet(record.to_wallet)}</span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">tx: {record.tx_hash}</div>
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
