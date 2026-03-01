import type {
  ApiResponse,
  PaginatedResponse,
  Wallet,
  WalletSession,
  Installation,
  ProofPackage,
  MPTBatch,
  WeightedBatchSummary,
  SourceNodeNFT,
  DAOProposal,
  Vote,
  VotingPowerBreakdown,
  GovernanceConfig,
  TreasuryOverview,
  TreasuryAction,
  MarketplaceListing,
  TradePreview,
  MarketPolicyConfig,
  ImpactTotals,
  ImpactBreakdown,
  Notification,
} from '@nexus/shared';
import { API_BASE_URL } from '@/config/constants';

/** Base fetch wrapper with error handling */
async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return res.json();
}

// ─── Wallet ──────────────────────────────────────────────

export const walletApi = {
  /** Create auth nonce for wallet signing */
  createNonce: (address: string) =>
    request<{ nonce: string; payload_uuid: string }>('/wallet/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  /** Verify signed nonce and create session */
  verifySignature: (payload_uuid: string, tx_hash: string) =>
    request<WalletSession>('/wallet/verify', {
      method: 'POST',
      body: JSON.stringify({ payload_uuid, tx_hash }),
    }),

  /** Get wallet profile */
  getProfile: (address: string) =>
    request<Wallet>(`/wallet/${address}`),
};

// ─── Installations ───────────────────────────────────────

export const installationsApi = {
  list: (page?: number) =>
    request<PaginatedResponse<Installation>>(`/installations?page=${page ?? 1}`),

  get: (id: string) =>
    request<Installation>(`/installations/${id}`),

  create: (data: Partial<Installation>) =>
    request<Installation>('/installations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Proofs ──────────────────────────────────────────────

export const proofsApi = {
  list: (status?: string) =>
    request<PaginatedResponse<ProofPackage>>(`/proofs?status=${status ?? 'pending'}`),

  get: (id: string) =>
    request<ProofPackage>(`/proofs/${id}`),

  submit: (data: Partial<ProofPackage>) =>
    request<ProofPackage>('/proofs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  review: (id: string, decision: { approved: boolean; reason?: string }) =>
    request<ProofPackage>(`/proofs/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(decision),
    }),
};

// ─── Batches (MPT) ───────────────────────────────────────

export const batchesApi = {
  /** Get all batches for a wallet */
  listByWallet: (address: string, tokenType?: 'WTR' | 'ENG') =>
    request<MPTBatch[]>(`/batches?wallet=${address}&token=${tokenType ?? ''}`),

  /** Get weighted summary for a wallet */
  getWeightedSummary: (address: string) =>
    request<WeightedBatchSummary[]>(`/batches/summary?wallet=${address}`),

  /** Get single batch detail */
  get: (id: string) =>
    request<MPTBatch>(`/batches/${id}`),

  /** Create a new batch (mint) */
  create: (data: Partial<MPTBatch>) =>
    request<MPTBatch>('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Source Node NFTs ────────────────────────────────────

export const nftsApi = {
  listByWallet: (address: string) =>
    request<SourceNodeNFT[]>(`/nfts?wallet=${address}`),

  get: (id: string) =>
    request<SourceNodeNFT>(`/nfts/${id}`),
};

// ─── DAO ─────────────────────────────────────────────────

export const daoApi = {
  /** List proposals with optional status filter */
  listProposals: (status?: string) =>
    request<PaginatedResponse<DAOProposal>>(`/dao/proposals?status=${status ?? ''}`),

  getProposal: (id: string) =>
    request<DAOProposal>(`/dao/proposals/${id}`),

  createProposal: (data: Partial<DAOProposal>) =>
    request<DAOProposal>('/dao/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Cast a vote */
  vote: (proposalId: string, data: { choice: string; wallet: string }) =>
    request<Vote>(`/dao/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get voting power breakdown for a wallet */
  getVotingPower: (address: string) =>
    request<VotingPowerBreakdown>(`/dao/voting-power?wallet=${address}`),

  /** Get current governance config */
  getConfig: () =>
    request<GovernanceConfig>('/dao/config'),
};

// ─── Treasury ────────────────────────────────────────────

export const treasuryApi = {
  getOverview: () =>
    request<TreasuryOverview>('/treasury'),

  listActions: () =>
    request<PaginatedResponse<TreasuryAction>>('/treasury/actions'),
};

// ─── Marketplace ─────────────────────────────────────────

export const marketplaceApi = {
  listListings: (type?: string) =>
    request<PaginatedResponse<MarketplaceListing>>(`/marketplace/listings?type=${type ?? ''}`),

  getListing: (id: string) =>
    request<MarketplaceListing>(`/marketplace/listings/${id}`),

  createListing: (data: Partial<MarketplaceListing>) =>
    request<MarketplaceListing>('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTradePreview: (listingId: string, buyerWallet: string) =>
    request<TradePreview>(`/marketplace/listings/${listingId}/preview?buyer=${buyerWallet}`),

  getPolicyConfig: () =>
    request<MarketPolicyConfig>('/marketplace/policy'),
};

// ─── Impact ──────────────────────────────────────────────

export const impactApi = {
  getTotals: (wallet?: string) =>
    request<ImpactTotals>(`/impact/totals${wallet ? `?wallet=${wallet}` : ''}`),

  getBreakdown: () =>
    request<ImpactBreakdown>('/impact/breakdown'),
};

// ─── Notifications ───────────────────────────────────────

export const notificationsApi = {
  list: () =>
    request<Notification[]>('/notifications'),

  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'POST' }),
};
