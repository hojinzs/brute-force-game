import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Auth } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { GameService } from './game.service';
import { CheckAnswerDto } from './dto/game.dto';

@ApiTags('game')
@Controller('game')
@UseGuards(ThrottlerGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('check-answer')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check password answer for current block' })
  @ApiResponse({ status: 200, description: 'Answer checked successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async checkAnswer(
    @CurrentUser() user: JwtPayload,
    @Body() checkAnswerDto: CheckAnswerDto,
  ) {
    return this.gameService.checkAnswer(user.sub, checkAnswerDto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active block' })
  @ApiResponse({ status: 200, description: 'Current block retrieved successfully' })
  async getCurrentBlock() {
    return this.gameService.getCurrentBlock();
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get player rankings' })
  @ApiResponse({ status: 200, description: 'Rankings retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of rankings to return', type: Number })
  async getRankings(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.gameService.getRankings(limitNum);
  }

  @Get('my-rank')
  @Auth()
  @ApiOperation({ summary: 'Get current user rank' })
  @ApiResponse({ status: 200, description: 'User rank retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRank(@CurrentUser() user: JwtPayload) {
    return this.gameService.getUserRank(user.sub);
  }
}