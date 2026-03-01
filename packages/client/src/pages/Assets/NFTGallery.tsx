import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Spinner } from '@/components/common';
import { ArrowLeft, Gem } from 'lucide-react';
import type { SourceNodeNFT, SourceNodeTier } from '@nexus/shared';

const TIER_COLORS: Record<SourceNodeTier, { badge: 'gray' | 'green' | 'blue' | 'yellow' | 'red'; gradient: string }> = {
  Common:    { badge: 'gray',   gradient: 'from-gray-600 to-gray-800' },
  Uncommon:  { badge: 'green',  gradient: 'from-emerald-600 to-emerald-900' },
  Rare:      { badge: 'blue',   gradient: 'from-blue-600 to-blue-900' },
  Epic:      { badge: 'yellow', gradient: 'from-amber-600 to-amber-900' },
  Legendary: { badge: 'red',    gradient: 'from-orange-500 to-orange-900' },
};

export default function NFTGallery() {
  const [nfts, setNfts] = useState<SourceNodeNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nfts')
      .then((r) => r.json())
      .then((res) => {
        setNfts(res.data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // Tier summary counts
  const tiers: SourceNodeTier[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const tierCounts: Record<string, number> = {};
  for (const n of nfts) {
    tierCounts[n.tier] = (tierCounts[n.tier] ?? 0) + 1;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        to="/assets"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Assets
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Gem className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Source Node NFTs</h1>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {tiers.map((tier) => (
          <Card key={tier} className="text-center py-3">
            <div className={`text-lg font-bold ${(tierCounts[tier] ?? 0) > 0 ? 'text-white' : 'text-gray-700'}`}>
              {tierCounts[tier] ?? 0}
            </div>
            <div className="text-xs text-gray-400">{tier}</div>
          </Card>
        ))}
      </div>

      {/* NFT Grid */}
      {nfts.length === 0 ? (
        <Card header="Your Collection">
          <p className="text-sm text-gray-500 py-8 text-center">No Source Node NFTs in this wallet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {nfts.map((nft) => {
            const style = TIER_COLORS[nft.tier];
            return (
              <Link
                key={nft.nft_id}
                to={`/impact/nft/${nft.nft_id}`}
                className="group"
              >
                <div className="card hover:border-gray-700 transition-all duration-200 group-hover:scale-[1.01]">
                  {/* Art placeholder */}
                  <div
                    className={`h-32 rounded-lg bg-gradient-to-br ${style.gradient} mb-4 flex items-center justify-center`}
                  >
                    <Gem className="w-8 h-8 text-white/20" />
                  </div>

                  {/* Tier badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge color={style.badge}>{nft.tier}</Badge>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {nft.multiplier}x
                    </span>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">ESG Score</span>
                      <span className="text-xs font-medium text-gray-300 tabular-nums">
                        {nft.attributes.esg_score}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Water Offset</span>
                      <span className="text-xs font-medium text-water-400 tabular-nums">
                        {(nft.attributes.water_offset_share * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Governance</span>
                      <span className="text-xs font-medium text-nexus-400 tabular-nums">
                        {nft.attributes.governance_contribution_score}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
