import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CheckoutStripeDto {
  @IsString({ message: 'productId wajib diisi.' })
  productId: string;

  @IsOptional()
  @IsString()
  kategori?: string;

  @IsOptional()
  @IsString()
  inlet?: string;

  @IsOptional()
  @IsString()
  saringan?: string;

  @IsOptional()
  @IsString()
  motor?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
