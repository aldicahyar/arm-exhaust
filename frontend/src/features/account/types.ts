export type AccountNavKey =
  | 'dashboard'
  | 'services'
  | 'orders'
  | 'documents'
  | 'community'
  | 'account'
  | 'signout';

export type AccountTabKey = 'arm-id' | 'privacy';

export type AccountDrawerMode =
  | 'none'
  | 'change-password'
  | 'edit-profile'
  | 'change-email';

export interface AccountSecurityInfo {
  readonly email: string;
  readonly hasPassword: boolean;
  readonly role?: string;
  readonly roleName?: string;
  readonly twoFactorAuth?: string;
  readonly recoveryPhoneNumber?: string;
}

export interface AccountPersonalInfo {
  readonly name: string;
  readonly phoneNumber: string;
  readonly address: string;
  readonly dateOfBirth: string;
}

export interface AccountLocationInfo {
  readonly country: string;
  readonly language: string;
}

export interface AccountAdvancedInfo {
  readonly accountIdentifier?: string;
  readonly termsUrl?: string;
}

export interface CustomerAccountData {
  readonly security: AccountSecurityInfo;
  readonly personal: AccountPersonalInfo;
  readonly location: AccountLocationInfo;
  readonly termsUrl?: string;
  readonly advanced?: AccountAdvancedInfo;
}

export interface CommunicationPreferences {
  readonly orderUpdates: boolean;
  readonly promotions: boolean;
  readonly newReleases: boolean;
  readonly channelEmail: boolean;
  readonly channelWhatsapp: boolean;
}

export const DEFAULT_COMMUNICATION_PREFERENCES: CommunicationPreferences = {
  orderUpdates: true,
  promotions: false,
  newReleases: true,
  channelEmail: true,
  channelWhatsapp: false,
};

export interface ChangePasswordPayload {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export interface UpdateProfilePayload {
  readonly name?: string;
  readonly phoneNumber?: string;
  readonly address?: string;
  readonly dateOfBirth?: string;
}

export interface AccountApiResponse<T = unknown> {
  readonly success: boolean;
  readonly message?: string;
  readonly requiresReauth?: boolean;
  readonly data?: T;
}

export const DEFAULT_CUSTOMER_ACCOUNT: CustomerAccountData = {
  security: {
    email: 'arkanpasiva@gmail.com',
    hasPassword: true,
    role: 'customer',
    roleName: 'ARM Member',
  },
  personal: {
    name: 'Arkan Pasiva',
    phoneNumber: '+18837721',
    address: 'Jl. Soekarno Hatta No. 428, Bandung, Jawa Barat 40254',
    dateOfBirth: '14 October 1998',
  },
  location: {
    country: 'Indonesia',
    language: 'English',
  },
  termsUrl: '/legal/terms',
};

export interface ActiveFabricationData {
  readonly orderCode: string;
  readonly productName: string;
  readonly targetMotorbike: string;
  readonly status: string;
  readonly stage: string;
  readonly stageLabel: string;
  readonly progressPercentage: number;
  readonly estimatedDelivery: string;
  readonly courier: {
    readonly name: string;
    readonly waybillNumber: string;
    readonly trackingUrl?: string;
  };
}

export interface CustomerMotorbikeData {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly engineSpecs: string;
  readonly headerPortMm: number;
  readonly isPrimary: boolean;
  readonly installedExhaust?: {
    readonly modelName: string;
    readonly serialNumber: string;
    readonly isVerified: boolean;
    readonly warrantyStatus: string;
    readonly warrantyType: string;
    readonly verificationUrl: string;
    readonly verificationToken?: string;
  };
}

export interface CustomerDashboardTelemetry {
  readonly memberSince: string;
  readonly activeFabrication?: ActiveFabricationData | null;
  readonly motorbikes: readonly CustomerMotorbikeData[];
}

export interface PublicCertificateData {
  readonly isAuthentic: boolean;
  readonly isProtected?: boolean;
  readonly requiresToken?: boolean;
  readonly tokenValid?: boolean;
  readonly serialNumber: string;
  readonly modelName: string;
  readonly vehicleMatch: string;
  readonly materialGrade?: string;
  readonly fabricationDate?: string;
  readonly welderSignature?: string;
  readonly warrantyStatus?: string;
  readonly warrantyType?: string;
  readonly verificationCount?: number;
  readonly isRevoked?: boolean;
  readonly revokedReason?: string;
  readonly ownerMasked?: string;
  readonly cityOrigin?: string;
  readonly message?: string;
}

