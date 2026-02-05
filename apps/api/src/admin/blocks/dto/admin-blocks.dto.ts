import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BlockStatus } from '../../../prisma/generated/client';

export class ForceTransitionDto {
  @IsEnum(BlockStatus)
  targetStatus: BlockStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hint?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
