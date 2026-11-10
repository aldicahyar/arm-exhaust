import { IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsOptional()
  @IsString()
  credential?: string;

  @IsOptional()
  @IsString()
  idToken?: string;
}
