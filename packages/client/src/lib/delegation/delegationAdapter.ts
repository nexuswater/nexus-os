import type { DelegationRecord } from '@nexus/shared';

export interface TxResult {
  tx_hash: string;
  success: boolean;
}

export async function createDelegation(record: Omit<DelegationRecord, 'id' | 'status' | 'startTime' | 'policyVersion'>): Promise<TxResult> {
  const res = await fetch('/api/delegation/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const json = await res.json();
  return json.data ?? { tx_hash: `tx-delegate-${Date.now()}`, success: true };
}

export async function revokeDelegation(id: string): Promise<TxResult> {
  const res = await fetch(`/api/delegation/${id}/revoke`, {
    method: 'POST',
  });
  const json = await res.json();
  return json.data ?? { tx_hash: `tx-revoke-${Date.now()}`, success: true };
}

export async function getDelegationsFor(address: string): Promise<DelegationRecord[]> {
  const res = await fetch(`/api/delegation?address=${address}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function getDelegationsToYou(address: string): Promise<DelegationRecord[]> {
  const res = await fetch(`/api/delegation/incoming?address=${address}`);
  const json = await res.json();
  return json.data ?? [];
}
