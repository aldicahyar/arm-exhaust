import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  AccountApiResponse,
  CustomerAccountData,
  CommunicationPreferences,
} from '../types';
import { DEFAULT_CUSTOMER_ACCOUNT, DEFAULT_COMMUNICATION_PREFERENCES } from '../types';

export async function changeAccountPassword(
  payload: ChangePasswordPayload,
): Promise<AccountApiResponse> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message ?? 'Failed to update password. Please check your credentials.';
      return {
        success: false,
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      };
    }

    return {
      success: true,
      message: data?.message ?? 'Password successfully updated.',
      requiresReauth: Boolean(data?.requiresReauth),
    };
  } catch {
    return {
      success: false,
      message: 'Network error occurred. Please try again.',
    };
  }
}

export async function updateAccountProfile(
  payload: UpdateProfilePayload,
): Promise<AccountApiResponse<{ id: string; name: string; email: string }>> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message ?? 'Failed to update profile information.';
      return {
        success: false,
        message: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully.',
      data: data?.user,
    };
  } catch {
    return {
      success: false,
      message: 'Network error occurred. Please try again.',
    };
  }
}

export async function fetchCurrentAccountData(): Promise<CustomerAccountData | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      return null;
    }
    const body = await res.json();
    if (!body?.user) {
      return null;
    }

    const user = body.user;
    return {
      security: {
        email: user.email ?? DEFAULT_CUSTOMER_ACCOUNT.security.email,
        hasPassword: true,
        role: user.role ?? DEFAULT_CUSTOMER_ACCOUNT.security.role,
        roleName: user.role_name ?? user.roleDetails?.name ?? 'ARM Member',
        twoFactorAuth: 'Email',
        recoveryPhoneNumber: user.phone ?? DEFAULT_CUSTOMER_ACCOUNT.security.recoveryPhoneNumber,
      },
      personal: {
        name: user.name ?? DEFAULT_CUSTOMER_ACCOUNT.personal.name,
        phoneNumber: user.phone ?? DEFAULT_CUSTOMER_ACCOUNT.personal.phoneNumber,
        address: user.address ?? DEFAULT_CUSTOMER_ACCOUNT.personal.address,
        dateOfBirth: user.date_of_birth ?? '-',
      },
      location: {
        country: 'Indonesia',
        language: 'English',
      },
      termsUrl: '/legal/terms',
    };
  } catch {
    return null;
  }
}

const STORAGE_KEY_PREFIX = 'arm_comm_preferences_';

export function loadStoredPreferences(userId: string): CommunicationPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_COMMUNICATION_PREFERENCES;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return DEFAULT_COMMUNICATION_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      orderUpdates: true, // Always enforce true
      promotions: Boolean(parsed.promotions),
      newReleases: Boolean(parsed.newReleases),
      channelEmail: parsed.channelEmail !== false,
      channelWhatsapp: Boolean(parsed.channelWhatsapp),
    };
  } catch {
    return DEFAULT_COMMUNICATION_PREFERENCES;
  }
}

export function saveStoredPreferences(
  userId: string,
  prefs: {
    orderUpdates: boolean;
    promotions: boolean;
    newReleases: boolean;
    channelEmail: boolean;
    channelWhatsapp: boolean;
  }
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${userId}`,
      JSON.stringify({
        ...prefs,
        orderUpdates: true,
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}
