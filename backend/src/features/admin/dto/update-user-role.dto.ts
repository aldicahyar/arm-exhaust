import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'Role wajib diisi.' })
  @IsString({ message: 'Role harus berupa string.' })
  role: string;
}
