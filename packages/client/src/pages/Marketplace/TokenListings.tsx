import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge, StatusBadge, ProgressBar, Spinner, EmptyState } from '@/components/common';
import type { MarketplaceListing } from '@nexus/shared';
import { ArrowLeft } from 'lucide-react';
import { TokenIcon } from '@/components/common';

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function TokenListings() {
  const { tokenType } = useParams<{ tokenType: string }>();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedType = tokenType?.toLowerCase() ?? '';

  useEffect(() => {
    fetch('/api/marketplace/listings')
      .then(r => r.json())
      .then(res => {
        const all: MarketplaceListing[] = res.data ?? [];
        setListings(all.filter(l => l.type === normalizedType));
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [normalizedType]);

  const isWtr = normalizedType === 'wtr';
  const tokenLabel = tokenType?.toUpperCase() ?? 'TOKEN';
  const variant = isWtr ? 'water' : 'energy';
  const badgeColor = isWtr ? 'water' : 'energy';

  return (
    <div>
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to Marketplace
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <TokenIcon symbol={tokenLabel} size={24} />
        <h1 className="page-title mb-0">${tokenLabel} Listings</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Batch-aware {tokenLabel} impact token listings with active fraction and region data.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<TokenIcon symbol={tokenLabel} size={32} />}
          title={`No ${tokenLabel} listings`}
          description={`No active ${tokenLabel} listings are currently available.`}
          actionLabel="Back to Marketplace"
          actionTo="/marketplace"
        />
      ) : (
        <div className="space-y-3">
          {listings.map(listing => {
            const activeFraction = listing.remaining_active_fraction ?? 1;
            const pricePerToken = listing.amount && listing.amount > 0
              ? (listing.price.amount / listing.amount)
              : 0;

            return (
              <Link
                key={listing.listing_id}
                to={`/marketplace/listing/${listing.listing_id}`}
                className="card hover:border-gray-700 transition-colors flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  <TokenIcon symbol={tokenLabel} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={badgeColor as 'water' | 'energy'}>{tokenLabel}</Badge>
                    <StatusBadge status={listing.status} />
                    {listing.region_code && (
                      <span className="text-[11px] text-gray-500 font-mono">{listing.region_code}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {listing.amount?.toLocaleString()} tokens
                    </span>
                    <span className="text-xs text-gray-500">
                      Seller: {truncateWallet(listing.seller_wallet)}
                    </span>
                  </div>

                  <ProgressBar
                    value={activeFraction}
                    variant={variant as 'water' | 'energy'}
                    label="Active Fraction"
                    showPercent
                  />
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-semibold text-white">
                    {listing.price.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{listing.price.currency}</div>
                  {pricePerToken > 0 && (
                    <div className="text-[11px] text-gray-600 mt-0.5">
                      {pricePerToken.toFixed(4)}/token
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
