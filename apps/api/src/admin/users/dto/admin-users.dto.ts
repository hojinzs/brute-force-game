import { IsEnum } from 'class-validator';
import { UserRole } from '../../../prisma/generated/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
