export type AccountNavKey =
  | 'dashboard'
  | 'services'
  | 'orders'
  | 'documents'
  | 'community'
  | 'account'
  | 'signout';

export type AccountTabKey = 'arm-id' | 'privacy' | 'third-party';

export interface AccountSecurityInfo {
  readonly email: string;
  readonly hasPassword: boolean;
  readonly twoFactorAuth: string;
  readonly recoveryPhoneNumber: string;
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
  readonly accountIdentifier: string;
  readonly termsUrl: string;
}

export interface CustomerAccountData {
  readonly security: AccountSecurityInfo;
  readonly personal: AccountPersonalInfo;
  readonly location: AccountLocationInfo;
  readonly advanced: AccountAdvancedInfo;
}

export const DEFAULT_CUSTOMER_ACCOUNT: CustomerAccountData = {
  security: {
    email: 'arkanpasiva@gmail.com',
    hasPassword: true,
    twoFactorAuth: 'Email',
    recoveryPhoneNumber: '+18837721',
  },
  personal: {
    name: 'Arkan Pasiva',
    phoneNumber: '+18837721',
    address: 'Jl. Soekarno Hatta No. 428, Bandung, Jawa Barat 40254',
    dateOfBirth: '-',
  },
  location: {
    country: 'Indonesia',
    language: 'English',
  },
  advanced: {
    accountIdentifier: 'cc2b3f3f-7ca5-4b84-b426-906c3fa5981f',
    termsUrl: '/legal/terms',
  },
};
