import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum UserRole {
  USER = 'USER',
  MASTER = 'MASTER',
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Updated role for the target user',
    example: 'MASTER',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
