import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CharsetType } from '../../shared/utils/types';

enum BlockStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SOLVED = 'SOLVED',
}

export class CreateBlockDto {
  @ApiPropertyOptional({
    description: 'Seed hint for password generation',
    example: 'hack123',
  })
  @IsOptional()
  @IsString()
  seedHint?: string;

  @ApiPropertyOptional({
    description: 'Character set for password',
    example: ['lowercase', 'numbers'],
    enum: ['lowercase', 'uppercase', 'alphanumeric', 'symbols'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  charset?: CharsetType[];

  @ApiPropertyOptional({
    description: 'Password length',
    example: 8,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  length?: number;
}

export class UpdateBlockDto {
  @ApiPropertyOptional({
    description: 'Block status',
    example: 'ACTIVE',
    enum: BlockStatus,
  })
  @IsOptional()
  @IsEnum(BlockStatus)
  status?: BlockStatus;

  @ApiPropertyOptional({
    description: 'Seed hint for password generation',
    example: 'hack123',
  })
  @IsOptional()
  @IsString()
  seedHint?: string;

  @ApiPropertyOptional({
    description: 'Character set for password',
    example: ['lowercase', 'numbers'],
    enum: ['lowercase', 'uppercase', 'alphanumeric', 'symbols'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  charset?: CharsetType[];

  @ApiPropertyOptional({
    description: 'Password length',
    example: 8,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  length?: number;
}