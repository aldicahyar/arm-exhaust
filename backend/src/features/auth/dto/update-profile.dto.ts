import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string.' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string.' })
  @MaxLength(30, { message: 'Phone number cannot exceed 30 characters.' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string.' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters.' })
  address?: string;
}
