export interface VerifyCertificateResponseDto {
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

export function maskCustomerNameForPdp(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'ARM Verified Customer';
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    const single = parts[0] ?? '';
    return single.length > 2
      ? `${single.slice(0, 2)}${'*'.repeat(Math.max(1, single.length - 2))}`
      : `${single}*`;
  }

  const firstName = parts[0];
  const initials = parts
    .slice(1)
    .map((p) => `${p.charAt(0).toUpperCase()}.`)
    .join(' ');

  return `${firstName} ${initials}`;
}
