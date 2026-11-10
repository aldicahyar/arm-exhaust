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
