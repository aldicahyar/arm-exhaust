import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email tidak valid.' })
  email: string;

  @IsString({ message: 'Password wajib diisi.' })
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
