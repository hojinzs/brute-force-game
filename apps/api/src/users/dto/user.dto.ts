import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User nickname',
    example: 'hacker123',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'User country code',
    example: 'US',
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Email consent for marketing',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailConsent?: boolean;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class CreateAnonymousUserDto {
  @ApiProperty({
    description: 'Anonymous user nickname',
    example: 'guest123',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User country code',
    example: 'US',
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Email consent for marketing',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  emailConsent?: boolean;
}