import { IsEnum } from 'class-validator';

enum UserRole {
  USER = 'USER',
  MASTER = 'MASTER',
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
