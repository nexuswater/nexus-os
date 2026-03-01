/**
 * NexusGovernanceMirror ABI (minimal stub)
 *
 * Spoke / mirror contract deployed on each secondary chain
 * (XRPL EVM, Arbitrum, HyperEVM). Collects local votes and
 * relays deltas to the Hub via Axelar GMP.
 */
export const GOVERNANCE_MIRROR_ABI = [
  {
    type: 'function',
    name: 'vote',
    inputs: [
      { name: 'id', type: 'uint64' },
      { name: 'choice', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'delegate',
    inputs: [{ name: 'operator', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'undelegate',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'localVotingPowerOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'power', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getProposal',
    inputs: [{ name: 'id', type: 'uint64' }],
    outputs: [
      {
        name: 'proposal',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint64' },
          { name: 'start', type: 'uint64' },
          { name: 'end', type: 'uint64' },
          { name: 'localYes', type: 'uint256' },
          { name: 'localNo', type: 'uint256' },
          { name: 'localAbstain', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'voted',
    inputs: [
      { name: 'id', type: 'uint64' },
      { name: 'voter', type: 'address' },
    ],
    outputs: [{ name: 'hasVoted', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'broadcastNonce',
    inputs: [],
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hubChain',
    inputs: [],
    outputs: [{ name: 'chainName', type: 'string' }],
    stateMutability: 'view',
  },
] as const;
