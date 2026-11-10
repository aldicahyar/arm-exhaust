import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Nama harus 2-100 karakter.' })
  @MaxLength(100, { message: 'Nama harus 2-100 karakter.' })
  name: string;

  @IsEmail({}, { message: 'Email tidak valid.' })
  email: string;

  @IsString({ message: 'Password wajib diisi.' })
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
