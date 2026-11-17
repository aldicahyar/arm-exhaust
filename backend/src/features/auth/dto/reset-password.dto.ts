import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token pemulihan tidak valid.' })
  @IsNotEmpty({ message: 'Token pemulihan wajib disertakan.' })
  token: string;

  @IsString({ message: 'Kata sandi baru wajib diisi.' })
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter.' })
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
