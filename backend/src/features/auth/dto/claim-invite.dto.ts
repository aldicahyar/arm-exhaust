import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClaimInviteDto {
  @IsNotEmpty({ message: 'Token undangan wajib disertakan.' })
  @IsString({ message: 'Token harus berupa teks string.' })
  token: string;

  @IsOptional()
  @IsString()
  credential?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
