import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum BlockStatus {
  WAITING_HINT = 'WAITING_HINT',
  WAITING_PASSWORD = 'WAITING_PASSWORD',
  ACTIVE = 'ACTIVE',
  SOLVED = 'SOLVED',
}

export class ForceTransitionDto {
  @ApiProperty({
    description: 'Target block status to transition into',
    example: 'ACTIVE',
    enum: BlockStatus,
  })
  @IsEnum(BlockStatus)
  targetStatus: BlockStatus;

  @ApiPropertyOptional({
    description: 'Hint for WAITING_HINT transition',
    example: 'A common English word',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hint?: string;

  @ApiPropertyOptional({
    description: 'Password for WAITING_PASSWORD transition',
    example: 'Secret123!',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @ApiProperty({
    description: 'Reason for admin intervention',
    example: 'Block stuck in waiting state',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
