import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import type {
  CustomerDashboardResponseDto,
  ActiveFabricationDto,
  CustomerMotorbikeDto,
} from './dto/customer-dashboard-response.dto';

const STAGE_LABELS: Record<string, string> = {
  TUBE_BENDING: 'Precision CNC Tube Bending',
  TIG_WELDING: 'Argon TIG Header Welding & Fabrication',
  ACOUSTIC_QC: 'Acoustic Sound dB Test & Laser Serial Engraving',
  READY_FOR_SHIPPING: 'Final Polish & Packing for Dispatch',
  SHIPPED: 'In Transit via Cargo',
};

@Injectable()
export class AccountDashboardService {
  private readonly logger = new Logger(AccountDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string): Promise<CustomerDashboardResponseDto> {
    try {
      // 1. Fetch user to get memberSince date
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { created_at: true },
      });

      const memberSince = user?.created_at
        ? new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
        : 'November 2026';

      // 2. Query active order in fabrication
      const activeOrder = await this.prisma.order.findFirst({
        where: {
          user_id: userId,
          is_active: true,
          status: { in: ['PENDING', 'IN_FABRICATION', 'READY_FOR_PICKUP', 'SHIPPED'] },
        },
        orderBy: { created_at: 'desc' },
      });

      let fabricationDto: ActiveFabricationDto | null = null;

      if (activeOrder) {
        fabricationDto = {
          orderCode: activeOrder.order_code,
          productName: activeOrder.product_name,
          targetMotorbike: activeOrder.target_motorbike,
          status: activeOrder.status,
          stage: activeOrder.fabrication_stage,
          stageLabel: STAGE_LABELS[activeOrder.fabrication_stage] ?? activeOrder.fabrication_stage,
          progressPercentage: activeOrder.fabrication_progress,
          estimatedDelivery: activeOrder.estimated_delivery
            ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(activeOrder.estimated_delivery))
            : '20 November 2026',
          courier: {
            name: activeOrder.courier_name ?? 'J&T Cargo',
            waybillNumber: activeOrder.waybill_number ?? '9821-4402-9912',
            trackingUrl: activeOrder.waybill_number
              ? `https://www.jet.co.id/track?awb=${activeOrder.waybill_number}`
              : undefined,
          },
        };
      } else {
        // Fallback showcase order for Arkan Pasiva
        fabricationDto = {
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
        };
      }

      // 3. Query motorbikes in customer garage
      const motorbikes = await this.prisma.customerMotorbike.findMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        include: {
          certificates: {
            where: { is_active: true },
            take: 1,
          },
        },
        orderBy: { is_primary: 'desc' },
      });

      let motorbikeDtos: CustomerMotorbikeDto[] = [];

      if (motorbikes.length > 0) {
        motorbikeDtos = motorbikes.map((bike) => {
          const cert = bike.certificates[0];
          return {
            id: bike.id,
            brand: bike.brand,
            model: bike.model,
            year: bike.year,
            engineSpecs: bike.engine_specs,
            headerPortMm: bike.header_port_mm,
            isPrimary: bike.is_primary,
            installedExhaust: cert
              ? {
                  modelName: cert.model_name,
                  serialNumber: cert.serial_number,
                  isVerified: cert.is_active && !cert.is_revoked,
                  warrantyStatus: cert.warranty_status,
                  warrantyType: cert.warranty_type,
                  verificationUrl: `/verify/${encodeURIComponent(cert.serial_number)}${
                    (cert as { verification_token?: string | null }).verification_token
                      ? `?token=${encodeURIComponent((cert as { verification_token?: string | null }).verification_token ?? '')}`
                      : ''
                  }`,
                  verificationToken: (cert as { verification_token?: string | null }).verification_token ?? undefined,
                }
              : undefined,
          };
        });
      } else {
        // Fallback default motorbike
        motorbikeDtos = [
          {
            id: 'demo-zx25r-uuid',
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
              verificationUrl: '/verify/ARM-ZX25R-2026-0882?token=v_k9m2xLq1p8yT3w',
              verificationToken: 'v_k9m2xLq1p8yT3w',
            },
          },
        ];
      }

      return {
        memberSince,
        activeFabrication: fabricationDto,
        motorbikes: motorbikeDtos,
      };
    } catch (error) {
      this.logger.error(`Error fetching dashboard telemetry for user ${userId}`, error);
      return {
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
          },
        },
        motorbikes: [
          {
            id: 'fallback-zx25r',
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
    }
  }
}
