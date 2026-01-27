import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateBlockDto {
  @ApiPropertyOptional({
    description: 'Previous block ID for continuity',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  previousBlockId?: string;

  @ApiPropertyOptional({
    description: 'Character set for password generation',
    example: ['lowercase', 'uppercase', 'numbers'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  charset?: string[];

  @ApiPropertyOptional({
    description: 'Password length',
    example: '8',
  })
  @IsOptional()
  @IsString()
  length?: string;
}

export class CheckAnswerDto {
  @ApiProperty({
    description: 'Block ID to check answer against',
    example: '12345',
  })
  @IsString()
  blockId: string;

  @ApiProperty({
    description: 'Password answer to check',
    example: 'password123',
  })
  @IsString()
  answer: string;
}