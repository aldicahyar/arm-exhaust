import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HomeHeaderDto {
  @IsOptional()
  @IsString({ message: 'Tag header harus berupa teks.' })
  @MaxLength(50, { message: 'Tag header maksimal 50 karakter.' })
  tag?: string;

  @IsOptional()
  @IsString({ message: 'Judul header harus berupa teks.' })
  @MaxLength(150, { message: 'Judul header maksimal 150 karakter.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Label link harus berupa teks.' })
  @MaxLength(50, { message: 'Label link maksimal 50 karakter.' })
  linkLabel?: string;

  @IsOptional()
  @IsString({ message: 'URL link harus berupa teks.' })
  @MaxLength(255, { message: 'URL link maksimal 255 karakter.' })
  linkHref?: string;
}

export class UpdateHomeHeadersDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HomeHeaderDto)
  section2?: HomeHeaderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HomeHeaderDto)
  section3?: HomeHeaderDto;
}
