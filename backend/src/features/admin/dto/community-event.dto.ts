import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, MaxLength } from 'class-validator';

export class CreateCommunityEventDto {
  @IsNotEmpty({ message: 'Kategori event wajib diisi.' })
  @IsString({ message: 'Kategori event harus berupa teks.' })
  @MaxLength(30, { message: 'Kategori event maksimal 30 karakter.' })
  category: string;

  @IsNotEmpty({ message: 'Tag event wajib diisi.' })
  @IsString({ message: 'Tag event harus berupa teks.' })
  @MaxLength(50, { message: 'Tag event maksimal 50 karakter.' })
  tag: string;

  @IsNotEmpty({ message: 'Tanggal event wajib diisi.' })
  @IsString({ message: 'Tanggal event harus berupa teks.' })
  @MaxLength(50, { message: 'Tanggal event maksimal 50 karakter.' })
  event_date: string;

  @IsNotEmpty({ message: 'Judul event wajib diisi.' })
  @IsString({ message: 'Judul event harus berupa teks.' })
  @MaxLength(150, { message: 'Judul event maksimal 150 karakter.' })
  title: string;

  @IsNotEmpty({ message: 'Deskripsi event wajib diisi.' })
  @IsString({ message: 'Deskripsi event harus berupa teks.' })
  description: string;

  @IsNotEmpty({ message: 'URL gambar event wajib diisi.' })
  @IsString({ message: 'URL gambar event harus berupa teks.' })
  @MaxLength(255, { message: 'URL gambar event maksimal 255 karakter.' })
  image_url: string;

  @IsOptional()
  @IsString({ message: 'Link event harus berupa teks.' })
  @MaxLength(255, { message: 'Link event maksimal 255 karakter.' })
  href?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Sort order harus berupa angka.' })
  sort_order?: number;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean.' })
  is_active?: boolean;
}

export class UpdateCommunityEventDto {
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
  @MaxLength(50)
  event_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  href?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
