import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, MaxLength, IsArray } from 'class-validator';

export class CreateCampaignSlideDto {
  @IsNotEmpty({ message: 'Kategori wajib diisi.' })
  @IsString({ message: 'Kategori harus berupa teks.' })
  @MaxLength(30, { message: 'Kategori maksimal 30 karakter.' })
  category: string;

  @IsNotEmpty({ message: 'Tag wajib diisi.' })
  @IsString({ message: 'Tag harus berupa teks.' })
  @MaxLength(50, { message: 'Tag maksimal 50 karakter.' })
  tag: string;

  @IsNotEmpty({ message: 'Judul slide wajib diisi.' })
  @IsString({ message: 'Judul slide harus berupa teks.' })
  @MaxLength(150, { message: 'Judul slide maksimal 150 karakter.' })
  title: string;

  @IsNotEmpty({ message: 'Strip title wajib diisi.' })
  @IsString({ message: 'Strip title harus berupa teks.' })
  @MaxLength(80, { message: 'Strip title maksimal 80 karakter.' })
  strip_title: string;

  @IsNotEmpty({ message: 'URL tujuan (href) wajib diisi.' })
  @IsString({ message: 'URL tujuan harus berupa teks.' })
  @MaxLength(255, { message: 'URL tujuan maksimal 255 karakter.' })
  href: string;

  @IsNotEmpty({ message: 'URL gambar wajib diisi.' })
  @IsString({ message: 'URL gambar harus berupa teks.' })
  @MaxLength(255, { message: 'URL gambar maksimal 255 karakter.' })
  image_url: string;

  @IsOptional()
  @IsNumber({}, { message: 'Sort order harus berupa angka.' })
  sort_order?: number;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean.' })
  is_active?: boolean;
}

export class UpdateCampaignSlideDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  strip_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  href?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ReorderContentDto {
  @IsArray({ message: 'orderedIds harus berupa array string UUID.' })
  @IsString({ each: true, message: 'Setiap ID dalam array harus berupa string.' })
  orderedIds: string[];
}
