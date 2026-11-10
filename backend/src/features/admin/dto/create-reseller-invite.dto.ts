import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateResellerInviteDto {
  @IsNotEmpty({ message: 'Nama mitra wajib diisi.' })
  @IsString({ message: 'Nama mitra harus berupa teks.' })
  partnerName: string;

  @IsOptional()
  @IsString({ message: 'Nomor telepon mitra harus berupa teks.' })
  partnerPhone?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Masa berlaku harus berupa angka jam.' })
  @Min(1, { message: 'Masa berlaku minimal 1 jam.' })
  @Max(720, { message: 'Masa berlaku maksimal 720 jam (30 hari).' })
  expiresInHours?: number;

  @IsOptional()
  @IsString({ message: 'Role harus berupa string.' })
  roleToGrant?: string;
}
