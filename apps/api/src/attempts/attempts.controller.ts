import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/attempt.dto';

@ApiTags('attempts')
@Controller('attempts')
@UseGuards(ThrottlerGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post(':blockId')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit an attempt for a block' })
  @ApiResponse({ status: 201, description: 'Attempt submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiParam({ name: 'blockId', description: 'Block ID' })
  async submitAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('blockId') blockId: string,
    @Body() createAttemptDto: CreateAttemptDto,
  ) {
    return this.attemptsService.submitAttempt(
      user.sub,
      BigInt(blockId),
      createAttemptDto,
    );
  }

  @Get(':blockId')
  @ApiOperation({ summary: 'Get attempts for a specific block' })
  @ApiResponse({ status: 200, description: 'Attempts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'blockId', description: 'Block ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of attempts to return', type: Number })
  async getBlockAttempts(
    @Param('blockId') blockId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.attemptsService.getBlockAttempts(BigInt(blockId), limitNum);
  }

  @Get(':blockId/stats')
  @ApiOperation({ summary: 'Get attempt statistics for a block' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'blockId', description: 'Block ID' })
  async getAttemptStats(@Param('blockId') blockId: string) {
    return this.attemptsService.getAttemptStats(BigInt(blockId));
  }

  @Get('user/my-attempts')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user attempts' })
  @ApiResponse({ status: 200, description: 'User attempts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of attempts to return', type: Number })
  async getUserAttempts(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.attemptsService.getUserAttempts(user.sub, limitNum);
  }
}