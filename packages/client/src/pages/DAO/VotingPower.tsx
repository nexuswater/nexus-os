import { useState, useEffect } from 'react';
import { Card, ProgressBar, Spinner } from '@/components/common';
import {
  TOKEN_LABELS,
  GOVERNANCE_EXPLANATIONS,
  DEFAULT_TIER_MULTIPLIERS,
} from '@nexus/shared';
import type {
  MPTBatch,
  SourceNodeNFT,
  SourceNodeTier,
  MultiRailWalletState,
  CrossRailGovernanceConfig,
  WalletBalances,
} from '@nexus/shared';
import { Link2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const TIERS: SourceNodeTier[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const DEFAULT_BALANCES: WalletBalances = { nxs: 0, xrp: 0, rlusd: 0 };

export default function VotingPower() {
  const [batches, setBatches] = useState<MPTBatch[]>([]);
  const [nfts, setNfts] = useState<SourceNodeNFT[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-rail state
  const [xrplBalances, setXrplBalances] = useState<WalletBalances>(DEFAULT_BALANCES);
  const [evmBalances, setEvmBalances] = useState<WalletBalances>(DEFAULT_BALANCES);
  const [xrplConnected, setXrplConnected] = useState(false);
  const [evmConnected, setEvmConnected] = useState(false);
  const [govConfig, setGovConfig] = useState<CrossRailGovernanceConfig | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/batches').then(r => r.json()),
      fetch('/api/nfts').then(r => r.json()),
      fetch('/api/swap/wallet').then(r => r.json()),
      fetch('/api/swap/governance-config').then(r => r.json()),
    ])
      .then(([b, n, w, gc]) => {
        setBatches(b.data ?? []);
        setNfts(n.data ?? []);

        // Parse wallet state
        const walletState: MultiRailWalletState = w.data ?? w;
        if (walletState.xrplBalances) setXrplBalances(walletState.xrplBalances);
        if (walletState.evmBalances) setEvmBalances(walletState.evmBalances);
        setXrplConnected(walletState.xrpl !== null && walletState.xrpl !== undefined);
        setEvmConnected(walletState.evm !== null && walletState.evm !== undefined);

        // Parse governance config
        const config: CrossRailGovernanceConfig = gc.data ?? gc;
        setGovConfig(config);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Compute Values ────────────────────────────────────

  // NXS from both rails
  const xrplNxs = xrplBalances.nxs;
  const evmNxs = evmConnected ? evmBalances.nxs : 0;
  const combinedNxs = xrplNxs + evmNxs;

  const wtrBatches = batches.filter(b => b.token_ticker === 'WTR');
  const engBatches = batches.filter(b => b.token_ticker === 'ENG');

  const wtrTotal = wtrBatches.reduce((s, b) => s + b.amount_minted, 0);
  const engTotal = engBatches.reduce((s, b) => s + b.amount_minted, 0);

  const wtrActive = wtrBatches.reduce(
    (s, b) => s + b.amount_minted * (1 - b.current_retired_fraction),
    0,
  );
  const engActive = engBatches.reduce(
    (s, b) => s + b.amount_minted * (1 - b.current_retired_fraction),
    0,
  );

  const wtrActiveFraction = wtrTotal > 0 ? wtrActive / wtrTotal : 0;
  const engActiveFraction = engTotal > 0 ? engActive / engTotal : 0;

  // NFT multiplier: highest tier
  const nftTiers: SourceNodeTier[] = nfts.map(n => n.tier);
  const effectiveMultiplier =
    nftTiers.length > 0
      ? Math.max(...nftTiers.map(t => DEFAULT_TIER_MULTIPLIERS[t]))
      : 1.0;

  // VP = (combinedNxs + WTR_active * 0.1 + ENG_active * 0.1) * NFT_multiplier
  const wtrWeight = 0.1;
  const engWeight = 0.1;
  const vp = (combinedNxs + wtrActive * wtrWeight + engActive * engWeight) * effectiveMultiplier;

  const crossRailEnabled = govConfig?.crossRailEnabled ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Governance Authority</h1>

      {/* Cross-Rail Status Banner */}
      {crossRailEnabled && (
        <Card className="mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Link2 size={16} className="text-nexus-400" />
              Cross-Rail Status
            </div>
            {xrplConnected && evmConnected ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 size={14} />
                Both XRPL and EVM wallets contributing to governance
              </div>
            ) : evmConnected && !xrplConnected ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
                <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm text-amber-300">
                  XRPL wallet required for impact-weighted governance and NFT multipliers
                </span>
              </div>
            ) : xrplConnected && !evmConnected ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Info size={14} className="text-gray-500" />
                Connect EVM wallet to include EVM NXS in governance
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info size={14} />
                No wallets connected
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 1. Holdings That Drive Governance */}
      <Card header="Holdings That Drive Governance" className="mb-4">
        <div className="space-y-3">
          {/* NXS by Rail */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-semibold text-white">
                {xrplNxs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">XRPL NXS</div>
            </div>
            {evmConnected && (
              <div>
                <div className="text-lg font-semibold text-white">
                  {evmNxs.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">EVM NXS</div>
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-nexus-400">
                {combinedNxs.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                {evmConnected ? 'Combined NXS' : TOKEN_LABELS.NXS.name}
              </div>
            </div>
          </div>

          {/* Impact Tokens + Source Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-800/60">
            <div>
              <div className="text-lg font-semibold text-water-400">
                {wtrActive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">{TOKEN_LABELS.WTR.name} Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-energy-400">
                {engActive.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400">{TOKEN_LABELS.ENG.name} Active</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-nexus-400">{nfts.length}</div>
              <div className="text-xs text-gray-400">Source Nodes Held</div>
            </div>
          </div>
        </div>

        {/* Why these count */}
        <div className="mt-4 pt-3 border-t border-gray-800 space-y-1">
          <p className="text-xs text-gray-500">{GOVERNANCE_EXPLANATIONS.nxs_always_counts}</p>
          <p className="text-xs text-gray-500">{GOVERNANCE_EXPLANATIONS.retired_excluded}</p>
        </div>
      </Card>

      {/* 2. WTR/ENG Batch Weighting for Governance */}
      <Card header="Impact Token Weighting" className="mb-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-water-400">{TOKEN_LABELS.WTR.name} Batches</span>
              <span className="text-xs text-gray-400">
                {wtrActive.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {wtrTotal.toLocaleString()} active
              </span>
            </div>
            {wtrBatches.length === 0 ? (
              <p className="text-xs text-gray-500">No WTR batches.</p>
            ) : (
              <ProgressBar
                value={wtrActiveFraction}
                variant="water"
                label={`${wtrBatches.length} batch${wtrBatches.length !== 1 ? 'es' : ''}`}
                showPercent
              />
            )}
            <p className="text-xs text-gray-600 mt-1">{TOKEN_LABELS.WTR.disclaimer}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-energy-400">{TOKEN_LABELS.ENG.name} Batches</span>
              <span className="text-xs text-gray-400">
                {engActive.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {engTotal.toLocaleString()} active
              </span>
            </div>
            {engBatches.length === 0 ? (
              <p className="text-xs text-gray-500">No ENG batches.</p>
            ) : (
              <ProgressBar
                value={engActiveFraction}
                variant="energy"
                label={`${engBatches.length} batch${engBatches.length !== 1 ? 'es' : ''}`}
                showPercent
              />
            )}
            <p className="text-xs text-gray-600 mt-1">{TOKEN_LABELS.ENG.disclaimer}</p>
          </div>
        </div>
      </Card>

      {/* 3. NFT Governance Amplifier */}
      <Card header="Source Node Governance Amplifier" className="mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span>Multipliers Enabled</span>
            <span className="text-green-400">Yes</span>
          </div>
          {govConfig?.nftMultiplierXRPLOnly && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Info size={12} />
              <span>NFT multipliers apply to XRPL-held Source Nodes only</span>
            </div>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            {TIERS.map((tier) => {
              const held = nftTiers.filter(t => t === tier).length;
              return (
                <div key={tier} className="flex justify-between">
                  <span className={held > 0 ? 'text-white' : ''}>
                    {tier} {held > 0 && <span className="text-nexus-400">({held} held)</span>}
                  </span>
                  <span className={held > 0 ? 'text-white font-medium' : ''}>
                    {DEFAULT_TIER_MULTIPLIERS[tier].toFixed(2)}x
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-gray-400 pt-2 border-t border-gray-800">
            <span>Active Mode</span>
            <span className="text-white">Highest Tier</span>
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span>Your Effective Multiplier</span>
            <span className="text-nexus-400 font-semibold">{effectiveMultiplier.toFixed(2)}x</span>
          </div>
          <p className="text-xs text-gray-600 pt-2">{GOVERNANCE_EXPLANATIONS.nft_multiplier_amplifies}</p>
        </div>
      </Card>

      {/* 4. Final Governance Authority */}
      <Card header="Final Governance Authority" className="border-nexus-600/30">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-white">
            {vp.toLocaleString(undefined, { maximumFractionDigits: 2 })} VP
          </div>
          <div className="text-sm text-gray-400 mt-2 font-mono">
            VP = ({xrplNxs.toLocaleString()}
            {evmConnected && <> + {evmNxs.toLocaleString()}</>}
            {' '}+ {wtrActive.toLocaleString(undefined, { maximumFractionDigits: 0 })} * {wtrWeight}{' '}
            + {engActive.toLocaleString(undefined, { maximumFractionDigits: 0 })} * {engWeight})
            {' '}* {effectiveMultiplier.toFixed(2)}x
          </div>
          {evmConnected && (
            <div className="text-xs text-gray-500 mt-1 font-mono">
              VP = (XRPL_NXS + EVM_NXS + WTR_active * 0.1 + ENG_active * 0.1) * NFT_multiplier
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-white">
                {combinedNxs.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500">
                {evmConnected ? 'Combined NXS' : 'NXS Power'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {(wtrActive * wtrWeight + engActive * engWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500">Impact Add-on</div>
            </div>
            <div>
              <div className="text-sm font-medium text-nexus-400">
                {effectiveMultiplier.toFixed(2)}x
              </div>
              <div className="text-[11px] text-gray-500">NFT Amplifier</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
