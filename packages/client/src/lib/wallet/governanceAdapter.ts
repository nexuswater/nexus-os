/**
 * Governance Adapter
 *
 * Handles vote submission across XRPL and EVM rails.
 * XRPL votes go through Hook-based governance; EVM votes use contract or off-chain signatures.
 */

export type VoteRail = 'xrpl' | 'evm';

export interface VoteSubmission {
  proposalId: string;
  votingPower: number;
  rail: VoteRail;
  choice: 'for' | 'against' | 'abstain';
}

export interface VoteResult {
  tx_hash: string;
}

/**
 * Submit a vote on a DAO proposal via the specified rail.
 *
 * @param vote - The vote parameters including proposal, power, rail, and choice
 * @returns The transaction hash from the backend
 */
export async function submitVote(vote: VoteSubmission): Promise<VoteResult> {
  if (vote.rail === 'xrpl') {
    // XRPL: Submit via Hook-based governance (stub)
    console.log('[Governance] Submitting XRPL vote:', vote);
  } else {
    // EVM: Submit via EVM contract or off-chain signature (stub)
    console.log('[Governance] Submitting EVM vote:', vote);
  }

  // Mock: post to backend
  const res = await fetch('/api/dao/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vote),
  });

  if (!res.ok) {
    throw new Error(`Vote submission failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data ?? { tx_hash: `tx-vote-${Date.now()}` };
}
