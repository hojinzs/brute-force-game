import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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