import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Modal, Spinner } from '@/components/common';
import type { MarketplaceListing } from '@nexus/shared';
import { ArrowLeft, Check, Shield, UserCheck, FileCheck, Copy } from 'lucide-react';

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export default function TradePreview() {
  const { listingId } = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const mockTxHash = '8A3F2B7E19D4C6A50E1F8B3D7C2A9E4F6B1D8C3A5E7F2B4D6A8C1E3F5B7D9A2';

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
  const platformFee = listing.price.amount * 0.01;
  const networkFee = 0.000012;
  const totalCost = listing.price.amount + platformFee + networkFee;

  const receiveLabel = isNft
    ? `1 Source Node NFT (${listing.nft_id ?? 'Unknown'})`
    : `${listing.amount?.toLocaleString()} ${listing.type.toUpperCase()} tokens`;

  const policyChecks = [
    { label: 'Participant Allowlist', description: 'Buyer is on the approved participant list', icon: UserCheck },
    { label: 'Asset Compliance', description: 'Asset passes policy engine checks', icon: FileCheck },
    { label: 'Anti-Wash Trading', description: 'Transaction does not violate wash-trade rules', icon: Shield },
  ];

  function handleConfirm() {
    setConfirming(true);
    // Simulate trade execution
    setTimeout(() => {
      setConfirming(false);
      setShowSuccess(true);
    }, 1500);
  }

  return (
    <div>
      <Link
        to={`/marketplace/listing/${listing.listing_id}`}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Back to Listing
      </Link>

      <h1 className="page-title">Trade Preview</h1>
      <p className="text-sm text-gray-400 mb-6">Review the details before confirming this trade.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* You Pay */}
        <Card header="You Pay">
          <div className="stat-value">
            {listing.price.amount.toLocaleString()} {listing.price.currency}
          </div>
          <div className="stat-label mt-1">
            Listing price for {isNft ? 'Source Node' : `${listing.type.toUpperCase()} tokens`}
          </div>
        </Card>

        {/* You Receive */}
        <Card header="You Receive">
          <div className="stat-value">{receiveLabel}</div>
          <div className="stat-label mt-1">
            {isNft ? 'XLS-20 NFT transfer' : 'Batch-aware token transfer'}
          </div>
          {!isNft && listing.region_code && (
            <div className="text-xs text-gray-600 mt-2">Region: {listing.region_code}</div>
          )}
        </Card>
      </div>

      {/* Policy Checks */}
      <Card header="Policy Checks" className="mb-4">
        <div className="space-y-3">
          {policyChecks.map(check => (
            <div key={check.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check size={12} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{check.label}</div>
                <div className="text-xs text-gray-500">{check.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fees */}
      <Card header="Fee Breakdown" className="mb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Platform Fee (1%)</span>
            <span className="text-white">{platformFee.toFixed(4)} {listing.price.currency}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-white">{networkFee.toFixed(6)} XRP</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-800">
            <span className="text-gray-300 font-medium">Total Cost</span>
            <span className="text-white font-semibold">{totalCost.toFixed(4)} {listing.price.currency}</span>
          </div>
        </div>
      </Card>

      {/* Confirm Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Processing...
          </span>
        ) : (
          'Confirm Trade'
        )}
      </Button>

      {/* Success Modal */}
      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} title="Trade Successful">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Trade Confirmed</h3>
          <p className="text-sm text-gray-400 mb-4">
            Your trade has been submitted to the ledger.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="text-[11px] text-gray-500 mb-1">Transaction Hash</div>
            <div className="text-xs text-gray-300 font-mono break-all">
              {mockTxHash}
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/marketplace" className="flex-1">
              <Button variant="secondary" className="w-full">Back to Marketplace</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(mockTxHash)}
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
