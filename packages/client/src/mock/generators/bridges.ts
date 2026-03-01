/**
 * bridges.ts — Generate 30 cross-chain bridge records.
 * Status mix: 5 INITIATED, 5 CONFIRMING, 3 RELAYING, 15 COMPLETED, 2 FAILED.
 * Tokens: NXS, WTR, ENG, USDC. Chains: XRPL, BASE, ARBITRUM, COREUM.
 */
import type { Rng } from '../seed';
import {
  randInt, randFloat, round, pick,
  hexId, txHash, xrplAddress, evmAddress,
  hoursAgo, daysAgo, offsetFrom, BRIDGE_TOKENS, CHAINS,
} from '../seed';
import type { BridgeRecord, BridgeStatus } from '../types';
import type { Chain, BridgeToken } from '../seed';

// ─── Constants ──────────────────────────────────────────

const BRIDGE_COUNT = 30;

const STATUS_PLAN: BridgeStatus[] = [
  ...Array(5).fill('INITIATED' as BridgeStatus),
  ...Array(5).fill('CONFIRMING' as BridgeStatus),
  ...Array(3).fill('RELAYING' as BridgeStatus),
  ...Array(15).fill('COMPLETED' as BridgeStatus),
  ...Array(2).fill('FAILED' as BridgeStatus),
];

const REQUIRED_CONFS: Record<Chain, number> = {
  XRPL: 4,
  BASE: 12,
  ARBITRUM: 15,
  COREUM: 6,
};

const FEE_RANGES: Record<BridgeToken, [number, number]> = {
  NXS: [0.5, 5.0],
  WTR: [0.2, 3.0],
  ENG: [0.2, 3.0],
  USDC: [0.1, 2.0],
};

// ─── Helpers ────────────────────────────────────────────

function pickOtherChain(rng: Rng, exclude: Chain): Chain {
  const others = CHAINS.filter((c) => c !== exclude);
  return pick(rng, others);
}

function addressFor(rng: Rng, chain: Chain): string {
  return chain === 'XRPL' ? xrplAddress(rng) : evmAddress(rng);
}

// ─── Generator ──────────────────────────────────────────

export function generateBridges(rng: Rng): BridgeRecord[] {
  const records: BridgeRecord[] = [];

  for (let i = 0; i < BRIDGE_COUNT; i++) {
    const status = STATUS_PLAN[i];
    const token = pick(rng, BRIDGE_TOKENS);
    const sourceChain = pick(rng, CHAINS);
    const destChain = pickOtherChain(rng, sourceChain);
    const amount = round(randFloat(rng, 50, 50_000), 2);

    const [feeMin, feeMax] = FEE_RANGES[token];
    const fee = round(randFloat(rng, feeMin, feeMax), 4);

    const reqConfs = REQUIRED_CONFS[sourceChain];
    let confirmations: number;
    switch (status) {
      case 'INITIATED':   confirmations = 0; break;
      case 'CONFIRMING':  confirmations = randInt(rng, 1, reqConfs - 1); break;
      case 'RELAYING':    confirmations = reqConfs; break;
      case 'COMPLETED':   confirmations = reqConfs; break;
      case 'FAILED':      confirmations = randInt(rng, 0, reqConfs); break;
      default:            confirmations = 0;
    }

    const initiatedAt = status === 'COMPLETED'
      ? daysAgo(randInt(rng, 1, 60))
      : hoursAgo(randInt(rng, 0, 48));

    const completedAt = status === 'COMPLETED'
      ? offsetFrom(initiatedAt, randInt(rng, 120_000, 3_600_000))
      : status === 'FAILED'
        ? offsetFrom(initiatedAt, randInt(rng, 60_000, 1_800_000))
        : null;

    records.push({
      id: `bridge-${hexId(rng, 12)}`,
      token,
      amount,
      sourceChain,
      destChain,
      status,
      initiatedAt,
      completedAt,
      fee,
      feeToken: token,
      confirmations,
      requiredConfirmations: reqConfs,
      sourceTxHash: txHash(rng),
      destTxHash: status === 'COMPLETED' ? txHash(rng) : null,
      sender: addressFor(rng, sourceChain),
      recipient: addressFor(rng, destChain),
    });
  }

  return records;
}
