import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Auth } from '../decorators/auth.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { AttemptsService } from './attempts.service';

@ApiTags('attempts')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

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
  @Auth()
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