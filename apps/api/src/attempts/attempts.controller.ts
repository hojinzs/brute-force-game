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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Auth } from '../decorators/auth.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { AttemptsService } from './attempts.service';
import { CreateAttemptDto } from './dto/attempt.dto';

@ApiTags('attempts')
@Controller('attempts')
// @UseGuards(ThrottlerGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post(':blockId')
  @Auth()
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
    console.log('[AttemptsController] submitAttempt called:', { userId: user.sub, blockId, input: createAttemptDto.inputValue });
    try {
      const result = await this.attemptsService.submitAttempt(
        user.sub,
        BigInt(blockId),
        createAttemptDto,
      );
      console.log('[AttemptsController] submitAttempt success:', { attemptId: result.id, similarity: result.similarity });
      return result;
    } catch (error) {
      console.error('[AttemptsController] submitAttempt error:', error);
      throw error;
    }
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