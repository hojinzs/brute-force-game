import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../shared/database/prisma.service';
import { PasswordService } from '../shared/services/password.service';
import { CpService } from '../shared/services/cp.service';
import { RankingService } from '../shared/services/ranking.service';
import { BlocksService } from '../blocks/blocks.service';
import { SimilarityCalculator } from '../shared/utils/similarity-calculator';
import { CheckAnswerDto } from './dto/game.dto';
import { DifficultyConfig } from '../shared/utils/types';

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly cpService: CpService,
    private readonly rankingService: RankingService,
    private readonly blocksService: BlocksService,
  ) {}

  async checkAnswer(userId: string, checkAnswerDto: CheckAnswerDto) {
    const blockId = BigInt(checkAnswerDto.blockId);

    // Get the block
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new BadRequestException('Block not found');
    }

    if (block.status !== 'ACTIVE') {
      throw new BadRequestException('Block is not active');
    }

    // Check for duplicate submission
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        blockId,
        userId,
        inputValue: checkAnswerDto.answer,
      },
    });

    if (existingAttempt) {
      throw new BadRequestException('You have already submitted this answer');
    }

    // Consume CP
    const cpConsumed = await this.cpService.consumeCP(userId);
    if (!cpConsumed) {
      throw new BadRequestException('Insufficient CP. Please wait for refill.');
    }

    // Calculate similarity
    const similarity = SimilarityCalculator.calculateSimilarity(
      checkAnswerDto.answer,
      block.answerPlaintext || '',
    );

    // Check if this is the first submission for this user/block
    const userAttempts = await this.prisma.attempt.count({
      where: { blockId, userId },
    });
    const isFirstSubmission = userAttempts === 0;

    // Create attempt record
    const attempt = await this.prisma.attempt.create({
      data: {
        blockId,
        userId,
        inputValue: checkAnswerDto.answer,
        similarity,
        isFirstSubmission,
      },
    });

    // Increment block points (prize pool)
    await this.prisma.block.update({
      where: { id: blockId },
      data: {
        accumulatedPoints: {
          increment: BigInt(10),
        },
      },
    });

    // Get updated block
    const updatedBlock = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    // Check if answer is correct (100% similarity)
    const isCorrect = similarity === 100;

    if (isCorrect) {
      // Mark block as solved (delegates to BlocksService)
      await this.blocksService.markBlockAsSolved(blockId, userId, attempt.id);
    }

    // Get remaining CP
    const remainingCP = await this.cpService.getCurrentCP(userId);

    return {
      attemptId: attempt.id,
      similarity,
      isFirstSubmission,
      isCorrect,
      remainingCP,
      blockStatus: isCorrect ? 'SOLVED' : updatedBlock?.status || 'ACTIVE',
      accumulatedPoints: updatedBlock?.accumulatedPoints.toString() || '0',
      message: isCorrect ? 'Congratulations! You solved the block!' : `Similarity: ${similarity.toFixed(2)}%`,
    };
  }

  async getCurrentBlock() {
    const block = await this.prisma.block.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('No active block found');
    }

    return {
      id: block.id.toString(),
      status: block.status,
      seedHint: block.seedHint,
      difficultyConfig: block.difficultyConfig,
      accumulatedPoints: block.accumulatedPoints.toString(),
      attemptCount: block._count.attempts,
      createdAt: block.createdAt,
    };
  }

  async getRankings(limit: number = 10) {
    const rankings = await this.rankingService.getTopRanking(limit);
    
    return {
      rankings: rankings.map(ranking => ({
        rank: ranking.rank,
        nickname: ranking.nickname,
        totalPoints: ranking.totalPoints.toString(),
        country: ranking.country,
      })),
      totalUsers: rankings.length,
    };
  }

  async getUserRank(userId: string) {
    const rank = await this.rankingService.getUserRank(userId);
    const leaderboard = await this.rankingService.getLeaderboardAroundUser(userId, 3);

    return {
      rank: rank.rank,
      totalPoints: rank.totalPoints.toString(),
      above: leaderboard.above.map(user => ({
        rank: user.rank,
        nickname: user.nickname,
        totalPoints: user.totalPoints.toString(),
      })),
      below: leaderboard.below.map(user => ({
        rank: user.rank,
        nickname: user.nickname,
        totalPoints: user.totalPoints.toString(),
      })),
    };
  }
}