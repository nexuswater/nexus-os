/**
 * Fee Engine — computes fees for skill calls and trades.
 */
import type { FeeConfig } from '@nexus/shared';

export interface SkillCallFeeResult {
  totalCost: number;
  platformFee: number;
  sellerPayout: number;
  receiptFee: number;
}

export interface TradeFeeResult {
  settlementFee: number;
  receiptFee: number;
  totalFees: number;
}

/**
 * Compute fees for a skill call execution.
 *
 * Pricing models:
 * - PER_CALL: basePrice * 1 (flat)
 * - PER_DOC / PER_1K_EVENTS: basePrice * unitsUsed (or per 1k for events)
 * - SUBSCRIPTION: basePrice (flat monthly)
 * - SUCCESS_FEE: basePrice + (estimatedCost * successFeeBps / 10000) applied later by caller
 *
 * Platform take rate is applied as a percentage of totalCost.
 * Receipt flat fee is added on top.
 */
export function computeSkillCallFees(params: {
  basePrice: number;
  unitsUsed: number;
  estimatedUnits: number;
  pricingModel: string;
  sellerType: string; // NEXUS | PARTNER | THIRD_PARTY
  feeConfig: FeeConfig;
  successFeeBps?: number;
}): SkillCallFeeResult {
  const { basePrice, unitsUsed, pricingModel, feeConfig, successFeeBps = 0 } = params;

  // Calculate raw cost based on pricing model
  let rawCost: number;
  switch (pricingModel) {
    case 'PER_CALL':
    case 'SUBSCRIPTION':
      rawCost = basePrice;
      break;
    case 'PER_DOC':
      rawCost = basePrice * unitsUsed;
      break;
    case 'PER_1K_EVENTS':
      rawCost = basePrice * (unitsUsed / 1000);
      break;
    case 'SUCCESS_FEE':
      // Base is zero for success fee; the fee is applied as bps on the underlying value
      rawCost = basePrice;
      break;
    default:
      rawCost = basePrice * unitsUsed;
  }

  // Apply success fee on top if applicable
  if (successFeeBps > 0 && pricingModel === 'SUCCESS_FEE') {
    // For success fee model, the cost is the fee itself (bps on estimated cost)
    rawCost = rawCost + (params.estimatedUnits * successFeeBps) / 10000;
  }

  const totalCost = Math.max(rawCost, feeConfig.minFee);

  // Platform take rate
  const platformFee = round((totalCost * feeConfig.platformTakeRateBps) / 10000);

  // Receipt flat fee
  const receiptFee = feeConfig.receiptFlatFee;

  // Seller gets what is left after platform fee and receipt fee
  const sellerPayout = round(totalCost - platformFee - receiptFee);

  return {
    totalCost: round(totalCost + receiptFee),
    platformFee,
    sellerPayout: Math.max(sellerPayout, 0),
    receiptFee,
  };
}

/**
 * Compute fees for a trade (buy/sell environmental assets).
 *
 * Settlement fee is bps on the trade amount.
 * Receipt flat fee is always added.
 */
export function computeTradeFees(params: {
  amountIn: number;
  feeConfig: FeeConfig;
}): TradeFeeResult {
  const { amountIn, feeConfig } = params;

  const settlementFee = round((amountIn * feeConfig.settlementFeeBps) / 10000);
  const receiptFee = feeConfig.receiptFlatFee;
  const totalFees = round(settlementFee + receiptFee);

  return { settlementFee, receiptFee, totalFees };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
