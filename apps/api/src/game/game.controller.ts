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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { GameService } from './game.service';
import { GenerateBlockDto, CheckAnswerDto } from './dto/game.dto';

@ApiTags('game')
@Controller('game')
@UseGuards(ThrottlerGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Public()
  @Post('generate-block')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new password block' })
  @ApiResponse({ status: 201, description: 'Block successfully generated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateBlock(
    @CurrentUser() user: JwtPayload | undefined,
    @Body() generateBlockDto: GenerateBlockDto,
  ) {
    return this.gameService.generateBlock(generateBlockDto, user?.sub);
  }

  @Public()
  @Post('check-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check password answer for current block' })
  @ApiResponse({ status: 200, description: 'Answer checked successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async checkAnswer(
    @CurrentUser() user: JwtPayload,
    @Body() checkAnswerDto: CheckAnswerDto,
  ) {
    if (!user) {
      throw new Error('Authentication required');
    }
    return this.gameService.checkAnswer(user.sub, checkAnswerDto);
  }

  @Public()
  @Get('current')
  @ApiOperation({ summary: 'Get current active block' })
  @ApiResponse({ status: 200, description: 'Current block retrieved successfully' })
  async getCurrentBlock() {
    return this.gameService.getCurrentBlock();
  }

  @Public()
  @Get('rankings')
  @ApiOperation({ summary: 'Get player rankings' })
  @ApiResponse({ status: 200, description: 'Rankings retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of rankings to return', type: Number })
  async getRankings(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.gameService.getRankings(limitNum);
  }

  @Get('my-rank')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user rank' })
  @ApiResponse({ status: 200, description: 'User rank retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRank(@CurrentUser() user: JwtPayload) {
    return this.gameService.getUserRank(user.sub);
  }
}