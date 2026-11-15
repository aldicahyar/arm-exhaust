import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateHomeNewArrivalDto {
  @IsNotEmpty({ message: 'Product ID katalog resmi wajib diisi.' })
  @IsString({ message: 'Product ID harus berupa teks.' })
  @MaxLength(50, { message: 'Product ID maksimal 50 karakter.' })
  product_id: string;

  @IsOptional()
  @IsString({ message: 'Badge text harus berupa teks.' })
  @MaxLength(50, { message: 'Badge text maksimal 50 karakter.' })
  badge_text?: string;

  @IsNotEmpty({ message: 'Nama produk wajib diisi.' })
  @IsString({ message: 'Nama produk harus berupa teks.' })
  @MaxLength(100, { message: 'Nama produk maksimal 100 karakter.' })
  name: string;

  @IsNotEmpty({ message: 'Label kategori produk wajib diisi.' })
  @IsString({ message: 'Label kategori produk harus berupa teks.' })
  @MaxLength(50, { message: 'Label kategori maksimal 50 karakter.' })
  category_label: string;

  @IsOptional()
  @IsString({ message: 'Ukuran inlet harus berupa teks.' })
  @MaxLength(30, { message: 'Ukuran inlet maksimal 30 karakter.' })
  inlet?: string;

  @IsOptional()
  @IsString({ message: 'Material produk harus berupa teks.' })
  @MaxLength(50, { message: 'Material produk maksimal 50 karakter.' })
  material?: string;

  @IsNotEmpty({ message: 'Tampilan harga wajib diisi.' })
  @IsString({ message: 'Tampilan harga harus berupa teks.' })
  @MaxLength(50, { message: 'Tampilan harga maksimal 50 karakter.' })
  price_display: string;

  @IsNotEmpty({ message: 'URL gambar produk wajib diisi.' })
  @IsString({ message: 'URL gambar produk harus berupa teks.' })
  @MaxLength(255, { message: 'URL gambar produk maksimal 255 karakter.' })
  image_url: string;

  @IsNotEmpty({ message: 'URL detail produk (href) wajib diisi.' })
  @IsString({ message: 'URL detail produk harus berupa teks.' })
  @MaxLength(255, { message: 'URL detail produk maksimal 255 karakter.' })
  href: string;

  @IsOptional()
  @IsInt({ message: 'Sort order harus berupa bilangan bulat.' })
  sort_order?: number;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean.' })
  is_active?: boolean;
}

export class UpdateHomeNewArrivalDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  product_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  badge_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  inlet?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  price_display?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  href?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
