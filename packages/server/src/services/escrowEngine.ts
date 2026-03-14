/**
 * Escrow Engine — lock, release, and refund funds using the in-memory BalanceLedger.
 */
import type { Escrow, AssetSymbol } from '@nexus/shared';
import { store } from './agentEconomyStore.js';

export interface EscrowResult {
  success: boolean;
  escrow?: Escrow;
  error?: string;
}

/**
 * Lock funds from payer's available balance into escrow.
 * Creates a new Escrow record and adjusts the payer's BalanceLedger.
 */
export function lockFunds(params: {
  rfqId: string;
  payerAgentId: string;
  payeeAgentId: string;
  asset: AssetSymbol;
  amount: number;
  releaseCondition: Escrow['releaseCondition'];
}): EscrowResult {
  const { rfqId, payerAgentId, payeeAgentId, asset, amount, releaseCondition } = params;

  // Check payer has sufficient available balance
  const balance = store.getBalance(payerAgentId, asset);
  if (!balance || balance.available < amount) {
    return { success: false, error: `Insufficient ${asset} balance. Available: ${balance?.available ?? 0}, Required: ${amount}` };
  }

  // Lock the balance
  const locked = store.lockBalance(payerAgentId, asset, amount);
  if (!locked) {
    return { success: false, error: 'Failed to lock balance' };
  }

  const escrow: Escrow = {
    id: store.nextId('escrow'),
    rfqId,
    payerAgentId,
    payeeAgentId,
    asset,
    amount,
    status: 'LOCKED',
    releaseCondition,
    createdAt: new Date().toISOString(),
  };

  store.addEscrow(escrow);
  return { success: true, escrow };
}

/**
 * Release escrowed funds to the payee.
 * Moves funds from payer's locked balance to payee's available balance.
 */
export function releaseFunds(escrowId: string): EscrowResult {
  const escrow = store.getEscrow(escrowId);
  if (!escrow) {
    return { success: false, error: `Escrow ${escrowId} not found` };
  }
  if (escrow.status !== 'LOCKED') {
    return { success: false, error: `Escrow is ${escrow.status}, cannot release` };
  }

  // Deduct from payer's locked balance
  const payerBal = store.getBalance(escrow.payerAgentId, escrow.asset);
  if (payerBal) {
    payerBal.locked -= escrow.amount;
    payerBal.updatedAt = new Date().toISOString();
  }

  // Credit payee's available balance
  store.updateBalance(escrow.payeeAgentId, escrow.asset, escrow.amount);

  // Update escrow status
  escrow.status = 'RELEASED';
  escrow.releasedAt = new Date().toISOString();

  return { success: true, escrow };
}

/**
 * Refund escrowed funds back to the payer.
 * Moves funds from payer's locked balance back to available.
 */
export function refundFunds(escrowId: string): EscrowResult {
  const escrow = store.getEscrow(escrowId);
  if (!escrow) {
    return { success: false, error: `Escrow ${escrowId} not found` };
  }
  if (escrow.status !== 'LOCKED') {
    return { success: false, error: `Escrow is ${escrow.status}, cannot refund` };
  }

  // Unlock: move from locked back to available for payer
  store.unlockBalance(escrow.payerAgentId, escrow.asset, escrow.amount);

  // Update escrow status
  escrow.status = 'REFUNDED';
  escrow.releasedAt = new Date().toISOString();

  return { success: true, escrow };
}
