import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateHomeValuePropDto {
  @IsOptional()
  @IsString({ message: 'Nomor pilar harus berupa teks.' })
  @MaxLength(10, { message: 'Nomor pilar maksimal 10 karakter.' })
  step_number?: string;

  @IsNotEmpty({ message: 'Judul pilar wajib diisi.' })
  @IsString({ message: 'Judul pilar harus berupa teks.' })
  @MaxLength(100, { message: 'Judul pilar maksimal 100 karakter.' })
  title: string;

  @IsNotEmpty({ message: 'Deskripsi pilar wajib diisi.' })
  @IsString({ message: 'Deskripsi pilar harus berupa teks.' })
  description: string;

  @IsOptional()
  @IsInt({ message: 'Sort order harus berupa bilangan bulat.' })
  sort_order?: number;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean.' })
  is_active?: boolean;
}

export class UpdateHomeValuePropDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  step_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
