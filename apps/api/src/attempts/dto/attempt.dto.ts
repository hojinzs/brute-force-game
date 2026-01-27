import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttemptDto {
  @ApiProperty({
    description: 'Input value to check against password',
    example: 'password123',
  })
  @IsString()
  inputValue: string;
}

export class AttemptResponseDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: '12345',
  })
  id: string;

  @ApiProperty({
    description: 'Block ID',
    example: '67890',
  })
  blockId: bigint;

  @ApiProperty({
    description: 'User ID',
    example: 'user123',
  })
  userId: string;

  @ApiProperty({
    description: 'Input value attempted',
    example: 'password123',
  })
  inputValue: string;

  @ApiProperty({
    description: 'Similarity score (0-1)',
    example: 0.85,
  })
  similarity: number;

  @ApiProperty({
    description: 'Whether this is the first submission',
    example: true,
  })
  isFirstSubmission: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Whether the attempt is correct',
    example: false,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Remaining computing power',
    example: 45,
  })
  remainingCP: number;

  @ApiProperty({
    description: 'Current block status',
    example: 'ACTIVE',
  })
  blockStatus: string;
}