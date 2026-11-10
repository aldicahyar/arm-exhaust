import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email tidak valid.' })
  email: string;

  @IsString({ message: 'OTP harus berupa string.' })
  @Length(6, 6, { message: 'OTP harus 6 digit angka.' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP harus 6 digit angka.' })
  otp: string;
}
