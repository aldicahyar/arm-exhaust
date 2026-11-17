import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  AccountApiResponse,
  CustomerAccountData,
} from '../types';
import { DEFAULT_CUSTOMER_ACCOUNT } from '../types';

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
        twoFactorAuth: 'Email',
        recoveryPhoneNumber: user.phone ?? DEFAULT_CUSTOMER_ACCOUNT.security.recoveryPhoneNumber,
      },
      personal: {
        name: user.name ?? DEFAULT_CUSTOMER_ACCOUNT.personal.name,
        phoneNumber: user.phone ?? DEFAULT_CUSTOMER_ACCOUNT.personal.phoneNumber,
        address: user.address ?? DEFAULT_CUSTOMER_ACCOUNT.personal.address,
        dateOfBirth: '-',
      },
      location: {
        country: 'Indonesia',
        language: 'English',
      },
      advanced: {
        accountIdentifier: user.id ?? DEFAULT_CUSTOMER_ACCOUNT.advanced.accountIdentifier,
        termsUrl: '/legal/terms',
      },
    };
  } catch {
    return null;
  }
}
