import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  AccountApiResponse,
  CustomerAccountData,
  CommunicationPreferences,
  CustomerDashboardTelemetry,
  PublicCertificateData,
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

export async function fetchDashboardTelemetry(): Promise<CustomerDashboardTelemetry> {
  const fallback: CustomerDashboardTelemetry = {
    memberSince: 'November 2026',
    activeFabrication: {
      orderCode: 'ARM-8821',
      productName: 'Megaphone Titanium GP Full System',
      targetMotorbike: 'Kawasaki Ninja ZX-25R',
      status: 'IN_FABRICATION',
      stage: 'TIG_WELDING',
      stageLabel: 'Argon TIG Header Welding & Fabrication',
      progressPercentage: 75,
      estimatedDelivery: '20 November 2026',
      courier: {
        name: 'J&T Cargo',
        waybillNumber: '9821-4402-9912',
        trackingUrl: 'https://www.jet.co.id/track?awb=9821-4402-9912',
      },
    },
    motorbikes: [
      {
        id: 'mb-zx25r-01',
        brand: 'Kawasaki',
        model: 'Ninja ZX-25R',
        year: 2023,
        engineSpecs: '249cc • 4-Cylinder Inline',
        headerPortMm: 50,
        isPrimary: true,
        installedExhaust: {
          modelName: 'Megaphone Titanium GP Full System',
          serialNumber: 'ARM-ZX25R-2026-0882',
          isVerified: true,
          warrantyStatus: 'ACTIVE',
          warrantyType: 'Lifetime Structural TIG Weld',
          verificationUrl: '/verify/ARM-ZX25R-2026-0882',
        },
      },
    ],
  };

  try {
    const res = await fetch('/api/account/dashboard');
    if (!res.ok) {
      return fallback;
    }
    const data = await res.json();
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchPublicCertificate(
  serialNumber: string,
  token?: string
): Promise<PublicCertificateData | null> {
  const canonical = (serialNumber || '').trim().toUpperCase();
  const cleanToken = token ? token.trim() : undefined;
  const isDemoTokenMatch = cleanToken === 'v_k9m2xLq1p8yT3w';

  const fallbackProtected: PublicCertificateData = {
    isAuthentic: true,
    isProtected: true,
    requiresToken: true,
    tokenValid: false,
    serialNumber: canonical || 'ARM-ZX25R-2026-0882',
    modelName: 'Megaphone Titanium GP Full System',
    vehicleMatch: 'Kawasaki Ninja ZX-25R (2023)',
    message: 'Official ARM authenticity record found. Verification token required to unlock full provenance.',
  };

  const fallbackUnlocked: PublicCertificateData = {
    isAuthentic: true,
    isProtected: false,
    requiresToken: false,
    tokenValid: true,
    serialNumber: canonical || 'ARM-ZX25R-2026-0882',
    modelName: 'Megaphone Titanium GP Full System',
    vehicleMatch: 'Kawasaki Ninja ZX-25R (2023)',
    materialGrade: 'Grade 1 Japanese Titanium (TIG Welded)',
    fabricationDate: '18 November 2026',
    welderSignature: 'ARM Master Tech #04',
    warrantyStatus: 'ACTIVE',
    warrantyType: 'Lifetime Structural TIG Weld',
    verificationCount: 1,
    isRevoked: false,
    ownerMasked: 'Arkan P.',
    cityOrigin: 'Bandung, Jawa Barat',
  };

  const fallback = isDemoTokenMatch ? fallbackUnlocked : fallbackProtected;

  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.BACKEND_URL ?? 'http://localhost:4000')
      : '';
    const tokenQuery = cleanToken ? `?token=${encodeURIComponent(cleanToken)}` : '';
    const res = await fetch(`${baseUrl}/api/verify/${encodeURIComponent(canonical)}${tokenQuery}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (canonical !== 'ARM-ZX25R-2026-0882') {
        return null;
      }
      return fallback;
    }
    const data = await res.json();
    return data ?? fallback;
  } catch {
    if (canonical !== 'ARM-ZX25R-2026-0882') {
      return null;
    }
    return fallback;
  }
}

