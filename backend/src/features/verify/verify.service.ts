import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { VerifyCertificateResponseDto } from './dto/verify-certificate-response.dto';
import { maskCustomerNameForPdp } from './dto/verify-certificate-response.dto';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifySerialNumber(rawSerial: string, token?: string): Promise<VerifyCertificateResponseDto> {
    if (!rawSerial || typeof rawSerial !== 'string') {
      throw new NotFoundException('Invalid serial number parameter.');
    }

    const canonicalSerial = rawSerial.trim().toUpperCase();
    const cleanToken = token ? token.trim() : undefined;

    // 1. Query Prisma database
    const certificate = await this.prisma.exhaustCertificate.findUnique({
      where: { serial_number: canonicalSerial },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        motorbike: {
          select: {
            brand: true,
            model: true,
            year: true,
          },
        },
      },
    });

    if (!certificate) {
      // Check for default showcase serial number if DB empty (e.g., initial seed for Ninja ZX-25R)
      if (canonicalSerial === 'ARM-ZX25R-2026-0882') {
        const isDemoTokenMatch = cleanToken === 'v_k9m2xLq1p8yT3w';

        if (!isDemoTokenMatch) {
          return {
            isAuthentic: true,
            isProtected: true,
            requiresToken: true,
            tokenValid: false,
            serialNumber: 'ARM-ZX25R-2026-0882',
            modelName: 'Megaphone Titanium GP Full System',
            vehicleMatch: 'Kawasaki Ninja ZX-25R (2023)',
            message: 'Official ARM authenticity record found. Verification token required to unlock full provenance.',
          };
        }

        return {
          isAuthentic: true,
          isProtected: false,
          requiresToken: false,
          tokenValid: true,
          serialNumber: 'ARM-ZX25R-2026-0882',
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
      }

      this.logger.warn(`Verification failed for non-existent serial: ${canonicalSerial}`);
      throw new NotFoundException(`Exhaust with serial ${canonicalSerial} was not found in the official registry.`);
    }

    const vehicleMatch = certificate.motorbike
      ? `${certificate.motorbike.brand} ${certificate.motorbike.model} (${certificate.motorbike.year})`
      : 'Kawasaki Ninja ZX-25R (2023)';

    // 2. Validate token against certificate record
    const recordToken = (certificate as { verification_token?: string | null }).verification_token;
    const tokenMatches = Boolean(
      recordToken &&
      cleanToken &&
      recordToken.toLowerCase() === cleanToken.toLowerCase()
    );

    // If token is missing or invalid, return protected challenge state (do not increment counter)
    if (!tokenMatches) {
      return {
        isAuthentic: certificate.is_active && !certificate.is_revoked,
        isProtected: true,
        requiresToken: true,
        tokenValid: false,
        serialNumber: certificate.serial_number,
        modelName: certificate.model_name,
        vehicleMatch,
        isRevoked: certificate.is_revoked,
        revokedReason: certificate.revoked_reason ?? undefined,
        message: 'Official ARM authenticity record found. Verification token required to unlock full provenance.',
      };
    }

    // 3. Increment verification count atomically only upon authenticated token unlock
    void this.prisma.exhaustCertificate.update({
      where: { id: certificate.id },
      data: { verification_count: { increment: 1 } },
    }).catch((err) => {
      this.logger.error(`Failed to increment verification count for ${canonicalSerial}`, err);
    });

    const fabDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(certificate.fabrication_date));

    return {
      isAuthentic: certificate.is_active && !certificate.is_revoked,
      isProtected: false,
      requiresToken: false,
      tokenValid: true,
      serialNumber: certificate.serial_number,
      modelName: certificate.model_name,
      vehicleMatch,
      materialGrade: certificate.material_grade,
      fabricationDate: fabDate,
      welderSignature: certificate.welder_signature,
      warrantyStatus: certificate.warranty_status,
      warrantyType: certificate.warranty_type,
      verificationCount: certificate.verification_count + 1,
      isRevoked: certificate.is_revoked,
      revokedReason: certificate.revoked_reason ?? undefined,
      ownerMasked: maskCustomerNameForPdp(certificate.user?.name),
      cityOrigin: 'Bandung, Jawa Barat',
    };
  }
}
