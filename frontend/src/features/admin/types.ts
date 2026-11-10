export interface UserRoleDetails {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number;
  can_access_admin: boolean;
  can_access_b2b: boolean;
  badge_style: { bg?: string; border?: string; text?: string } | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  role_details?: UserRoleDetails | null;
  roleDetails?: UserRoleDetails | null;
  discount_percent?: number;
}

export interface MasterRole {
  id: string;
  name: string;
  description: string | null;
  discount_percent?: number;
  can_access_admin: boolean;
  can_access_b2b: boolean;
}

export interface VipInviteItem {
  id: string;
  token: string;
  inviteUrl: string;
  partner_name: string;
  partnerName?: string;
  partner_phone?: string | null;
  partnerPhone?: string | null;
  role_to_grant: string;
  roleToGrant?: string;
  role_name?: string;
  status: 'active' | 'claimed' | 'expired' | 'revoked';
  max_uses: number;
  used_count: number;
  expires_at: string;
  expiresAt?: string;
  claimed_at?: string | null;
  claimedAt?: string | null;
  claimed_by_email?: string | null;
  claimed_by_name?: string | null;
  creator_name?: string | null;
  is_revoked: boolean;
  isRevoked?: boolean;
  created_at: string;
  createdAt?: string;
}

export interface GeneratedInviteResult {
  id: string;
  token: string;
  inviteUrl: string;
  partnerName: string;
  partnerPhone?: string | null;
  roleToGrant: string;
  expiresAt: string;
  expiresInHours?: number;
}

export interface CrmMetrics {
  totalUsers: number;
  resellerCount: number;
  distributorCount: number;
  pendingInvites: number;
}

export type ExhaustOrderStatus =
  | 'Menunggu Konfirmasi'
  | 'Antrean Produksi & QC'
  | 'Siap Kirim'
  | 'Selesai';

export type ExhaustOrderType = 'READY STOCK' | 'PRE-ORDER / CUSTOM';

export type ExhaustPaymentStatus = 'Lunas' | 'DP 50%' | 'Belum Bayar';

export type ExhaustSlaStatus = 'urgent' | 'warning' | 'normal' | 'done';

export interface ExhaustOrder {
  id: string;
  customerName: string;
  customerRole: 'Reseller B2B' | 'Retail Customer' | 'Distributor VIP';
  customerPhone: string;
  workshopName?: string;
  productName: string;
  exhaustSpecs: string;
  orderType: ExhaustOrderType;
  status: ExhaustOrderStatus;
  targetDispatchDate: string;
  slaLabel: string;
  slaStatus: ExhaustSlaStatus;
  totalAmount: number;
  downPaymentAmount?: number;
  paymentStatus: ExhaustPaymentStatus;
  courier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

export type TaxMode = 'include' | 'exclude';

export interface TaxConfigData {
  taxPercent: number;
  taxMode: TaxMode;
  autoFakturB2B: boolean;
  companyName: string;
  companyNpwp: string;
  companyAddress: string;
  pkpNumber?: string;
  fakturPrefix?: string;
  updatedAt?: string;
}

