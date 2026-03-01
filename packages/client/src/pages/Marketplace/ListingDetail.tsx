import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Badge, StatusBadge, ProgressBar, Button, Spinner } from '@/components/common';
import { MARKETPLACE_LABELS, DEFAULT_TIER_MULTIPLIERS } from '@nexus/shared';
import type { MarketplaceListing, SourceNodeTier } from '@nexus/shared';
import { ArrowLeft, Hexagon, ExternalLink } from 'lucide-react';
import { TokenIcon } from '@/components/common';

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function extractTier(nftId: string): SourceNodeTier {
  const lower = nftId.toLowerCase();
  if (lower.includes('legendary')) return 'Legendary';
  if (lower.includes('epic')) return 'Epic';
  if (lower.includes('rare')) return 'Rare';
  if (lower.includes('uncommon')) return 'Uncommon';
  return 'Common';
}

export default function ListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketplace/listings')
      .then(r => r.json())
      .then(res => {
        const all: MarketplaceListing[] = res.data ?? [];
        const found = all.find(l => l.listing_id === listingId) ?? null;
        setListing(found);
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div>
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Marketplace
        </Link>
        <Card>
          <p className="text-sm text-gray-500">Listing not found.</p>
        </Card>
      </div>
    );
  }

  const isNft = listing.type === 'nft';
  const isWtr = listing.type === 'wtr';
  const tier = isNft && listing.nft_id ? extractTier(listing.nft_id) : null;
  const multiplier = tier ? DEFAULT_TIER_MULTIPLIERS[tier] : null;
  const activeFraction = listing.remaining_active_fraction ?? 1;

  return (
    <div>
      <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isNft ? (
                  <Badge color="blue">NFT</Badge>
                ) : isWtr ? (
                  <Badge color="water">WTR</Badge>
                ) : (
                  <Badge color="energy">ENG</Badge>
                )}
                <StatusBadge status={listing.status} />
              </div>
              <span className="text-xs text-gray-600 font-mono">{listing.listing_id}</span>
            </div>

            {/* NFT visual / Token header */}
            {isNft ? (
              <div className="h-48 rounded-xl mb-4 bg-gradient-to-br from-nexus-600/30 via-cyan-600/20 to-gray-800 flex flex-col items-center justify-center gap-2">
                <Hexagon size={48} className="text-nexus-400/40" />
                {tier && (
                  <span className="text-sm font-medium text-white/50 uppercase tracking-wider">{tier}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <TokenIcon symbol={isWtr ? 'WTR' : 'ENG'} size={28} />
                <div>
                  <div className="text-lg font-semibold text-white">
                    {listing.amount?.toLocaleString()} {listing.type.toUpperCase()} tokens
                  </div>
                  {listing.region_code && (
                    <div className="text-xs text-gray-500">Region: {listing.region_code}</div>
                  )}
                </div>
              </div>
            )}

            {/* Detail rows */}
            <div className="space-y-3">
              {isNft && listing.nft_id && (
                <DetailRow label="NFT ID" value={listing.nft_id} mono />
              )}
              {tier && (
                <DetailRow label="Tier" value={tier} />
              )}
              {multiplier != null && (
                <DetailRow label="Governance Multiplier" value={`${multiplier.toFixed(2)}x`} />
              )}

              {!isNft && (
                <>
                  <DetailRow label="Amount" value={`${listing.amount?.toLocaleString()} tokens`} />
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Active Fraction</span>
                      <span>{(activeFraction * 100).toFixed(1)}%</span>
                    </div>
                    <ProgressBar
                      value={activeFraction}
                      variant={isWtr ? 'water' : 'energy'}
                    />
                  </div>
                  {listing.region_code && (
                    <DetailRow label="Region" value={listing.region_code} />
                  )}
                  {listing.batch_ids && listing.batch_ids.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Batch IDs</span>
                      <div className="mt-1 space-y-1">
                        {listing.batch_ids.map(id => (
                          <div key={id} className="text-xs text-gray-400 font-mono bg-gray-800/50 px-2 py-1 rounded">
                            {id}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.verifier_signatures && listing.verifier_signatures.length > 0 && (
                    <DetailRow
                      label="Verifier Signatures"
                      value={`${listing.verifier_signatures.length} signature(s)`}
                    />
                  )}
                </>
              )}

              <DetailRow label="Seller" value={truncateWallet(listing.seller_wallet)} mono />
              <DetailRow label="Listed" value={new Date(listing.created_at).toLocaleDateString()} />
              {listing.expires_at && (
                <DetailRow label="Expires" value={new Date(listing.expires_at).toLocaleDateString()} />
              )}
              {listing.tx_hash && (
                <DetailRow label="TX Hash" value={truncateWallet(listing.tx_hash)} mono />
              )}
            </div>
          </Card>

          {/* Info card */}
          <Card>
            <p className="text-xs text-gray-500">{MARKETPLACE_LABELS.batch_info}</p>
            {!isNft && (
              <p className="text-xs text-gray-600 mt-1">{MARKETPLACE_LABELS.retirement_warning}</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Card */}
          <Card header="Price">
            <div className="text-3xl font-bold text-white">
              {listing.price.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">{listing.price.currency}</div>
            {!isNft && listing.amount && listing.amount > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                {(listing.price.amount / listing.amount).toFixed(4)} {listing.price.currency}/token
              </div>
            )}
          </Card>

          {/* Trade Action */}
          {listing.status === 'active' && (
            <Link to={`/marketplace/trade/${listing.listing_id}`}>
              <Button variant="primary" size="lg" className="w-full">
                Trade
              </Button>
            </Link>
          )}

          {listing.status === 'sold' && listing.buyer_wallet && (
            <Card header="Sold">
              <div className="text-sm text-gray-400">
                Buyer: {truncateWallet(listing.buyer_wallet)}
              </div>
              {listing.sold_at && (
                <div className="text-xs text-gray-500 mt-1">
                  Sold: {new Date(listing.sold_at).toLocaleDateString()}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
