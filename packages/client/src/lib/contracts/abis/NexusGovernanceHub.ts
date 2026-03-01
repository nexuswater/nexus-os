/**
 * NexusGovernanceHub ABI (minimal stub)
 *
 * Hub contract deployed on the primary governance chain (Base).
 * Manages proposals, unified tallies, delegation, and cross-chain
 * message aggregation via Axelar GMP.
 */
export const GOVERNANCE_HUB_ABI = [
  {
    type: 'function',
    name: 'propose',
    inputs: [
      { name: 'title', type: 'bytes32' },
      { name: 'duration', type: 'uint32' },
      { name: 'quorum', type: 'uint256' },
      { name: 'executionPayload', type: 'bytes' },
    ],
    outputs: [{ name: 'proposalId', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'vote',
    inputs: [
      { name: 'id', type: 'uint64' },
      { name: 'choice', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'finalize',
    inputs: [{ name: 'id', type: 'uint64' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'execute',
    inputs: [{ name: 'id', type: 'uint64' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'delegate',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'scope', type: 'uint8' },
      { name: 'feeBps', type: 'uint16' },
      { name: 'expiry', type: 'uint32' },
    ],
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
    name: 'votingPowerOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'power', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'delegatedPowerOf',
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
          { name: 'proposer', type: 'address' },
          { name: 'title', type: 'bytes32' },
          { name: 'start', type: 'uint32' },
          { name: 'end', type: 'uint32' },
          { name: 'status', type: 'uint8' },
          { name: 'localYes', type: 'uint256' },
          { name: 'localNo', type: 'uint256' },
          { name: 'localAbstain', type: 'uint256' },
          { name: 'unifiedYes', type: 'uint256' },
          { name: 'unifiedNo', type: 'uint256' },
          { name: 'unifiedAbstain', type: 'uint256' },
          { name: 'quorumRequired', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUnifiedTally',
    inputs: [{ name: 'id', type: 'uint64' }],
    outputs: [
      { name: 'yes', type: 'uint256' },
      { name: 'no', type: 'uint256' },
      { name: 'abstain', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLocalTally',
    inputs: [{ name: 'id', type: 'uint64' }],
    outputs: [
      { name: 'yes', type: 'uint256' },
      { name: 'no', type: 'uint256' },
      { name: 'abstain', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'proposalSeq',
    inputs: [],
    outputs: [{ name: 'seq', type: 'uint64' }],
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
    name: 'registerRemoteMirror',
    inputs: [
      { name: 'chainName', type: 'string' },
      { name: 'mirrorAddress', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'migrationActive',
    inputs: [],
    outputs: [{ name: 'active', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'proposalThreshold',
    inputs: [],
    outputs: [{ name: 'threshold', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
