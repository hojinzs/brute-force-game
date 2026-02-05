import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

enum BlockStatus {
  WAITING_HINT = 'WAITING_HINT',
  WAITING_PASSWORD = 'WAITING_PASSWORD',
  ACTIVE = 'ACTIVE',
  SOLVED = 'SOLVED',
}

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
