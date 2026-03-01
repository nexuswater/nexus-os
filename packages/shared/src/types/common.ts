/** Standard paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

/** Standard API error response */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Standard API success response */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/** Notification types */
export type NotificationType =
  | 'proposal_voting_deadline'
  | 'batch_nearing_retirement'
  | 'mint_approval_pending'
  | 'marketplace_listing_expiring'
  | 'proof_status_update'
  | 'trade_completed'
  | 'vote_recorded';

/** User notification */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

/** App mode — web dApp vs Xaman xApp */
export type AppMode = 'web' | 'xapp';

/** Network mode */
export type NetworkMode = 'mainnet' | 'testnet' | 'devnet';

/** Impact totals for the dashboard */
export interface ImpactTotals {
  total_water_offset_gallons: number;
  total_energy_offset_kwh: number;
  total_retired_value: number;
  total_active_value: number;
  installations_count: number;
  regions_count: number;
}

/** Impact breakdown by dimension */
export interface ImpactBreakdown {
  by_region: ImpactRegionEntry[];
  by_technology: ImpactTechEntry[];
  by_installer: ImpactInstallerEntry[];
}

export interface ImpactRegionEntry {
  region_code: string;
  water_offset: number;
  energy_offset: number;
  installations: number;
}

export interface ImpactTechEntry {
  technology_type: string;
  water_offset: number;
  energy_offset: number;
  installations: number;
}

export interface ImpactInstallerEntry {
  installer_wallet: string;
  installer_name?: string;
  water_offset: number;
  energy_offset: number;
  installations: number;
}
