import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, StatusBadge, Spinner, EmptyState } from '@/components/common';
import type { MarketplaceListing } from '@nexus/shared';
import { Hexagon, ArrowLeft } from 'lucide-react';

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function extractTier(nftId: string): string {
  const lower = nftId.toLowerCase();
  if (lower.includes('legendary')) return 'Legendary';
  if (lower.includes('epic')) return 'Epic';
  if (lower.includes('rare')) return 'Rare';
  if (lower.includes('uncommon')) return 'Uncommon';
  return 'Common';
}

const tierGradients: Record<string, string> = {
  Common: 'from-gray-700/40 via-gray-600/20 to-gray-800',
  Uncommon: 'from-green-700/30 via-emerald-600/20 to-gray-800',
  Rare: 'from-blue-700/30 via-cyan-600/20 to-gray-800',
  Epic: 'from-amber-700/30 via-yellow-600/20 to-gray-800',
  Legendary: 'from-amber-600/30 via-orange-500/20 to-gray-800',
};

export default function NFTListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketplace/listings')
      .then(r => r.json())
      .then(res => {
        const all: MarketplaceListing[] = res.data ?? [];
        setListings(all.filter(l => l.type === 'nft'));
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to Marketplace
      </Link>

      <h1 className="page-title">Source Node Listings</h1>
      <p className="text-sm text-gray-400 mb-6">Browse available Source Node NFTs on the marketplace.</p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<Hexagon size={32} />}
          title="No NFT listings"
          description="No Source Node NFTs are currently listed for sale."
          actionLabel="Back to Marketplace"
          actionTo="/marketplace"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => {
            const tier = listing.nft_id ? extractTier(listing.nft_id) : 'Common';
            const gradient = tierGradients[tier] ?? tierGradients.Common;

            return (
              <Link
                key={listing.listing_id}
                to={`/marketplace/listing/${listing.listing_id}`}
                className="card hover:border-gray-700 transition-colors group"
              >
                {/* Placeholder art gradient */}
                <div className={`h-36 rounded-lg mb-3 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
                  <Hexagon size={36} className="text-white/20 group-hover:text-white/30 transition-colors" />
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{tier}</span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <Badge color="blue">NFT</Badge>
                  <StatusBadge status={listing.status} />
                </div>

                <div className="text-sm font-medium text-white truncate mb-1">
                  {listing.nft_id ?? 'Source Node'}
                </div>

                <div className="text-lg font-semibold text-white">
                  {listing.price.amount.toLocaleString()} <span className="text-sm text-gray-400">{listing.price.currency}</span>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Seller: {truncateWallet(listing.seller_wallet)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
