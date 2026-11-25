export interface ActiveFabricationDto {
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

export interface CustomerMotorbikeDto {
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

export interface CustomerDashboardResponseDto {
  readonly memberSince: string;
  readonly activeFabrication?: ActiveFabricationDto | null;
  readonly motorbikes: readonly CustomerMotorbikeDto[];
}
