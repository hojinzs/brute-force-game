import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { CpService } from '../shared/services/cp.service';
import { SimilarityCalculator } from '../shared/utils/similarity-calculator';
import { PasswordService } from '../shared/services/password.service';
import { BlocksService } from '../blocks/blocks.service';
import { SseService } from '../sse/sse.service';
import { CreateAttemptDto, AttemptResponseDto } from './dto/attempt.dto';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cpService: CpService,
    private readonly passwordService: PasswordService,
    private readonly blocksService: BlocksService,
    private readonly sseService: SseService,
  ) {}

  async submitAttempt(
    userId: string,
    blockId: bigint,
    createAttemptDto: CreateAttemptDto,
  ): Promise<AttemptResponseDto> {
    // Get current block
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'ACTIVE') {
      throw new BadRequestException('Block is not active');
    }

    // Check if user already submitted this exact input
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        blockId,
        userId,
        inputValue: createAttemptDto.inputValue,
      },
    });

    if (existingAttempt) {
      throw new ConflictException('You have already submitted this answer');
    }

    // Consume CP
    const cpConsumed = await this.cpService.consumeCP(userId);
    if (!cpConsumed) {
      throw new BadRequestException('Insufficient CP. Please wait for refill.');
    }

    // Calculate similarity
    const similarity = SimilarityCalculator.calculateSimilarity(
      createAttemptDto.inputValue,
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
        inputValue: createAttemptDto.inputValue,
        similarity,
        isFirstSubmission,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Increment block points (prize pool)
    await this.blocksService.incrementBlockPoints(blockId, BigInt(10));

    // Check if answer is correct (100% similarity)
    const isCorrect = similarity === 100;

    // Emit SSE event for new attempt
    this.sseService.emitNewAttempt({
      blockId: blockId.toString(),
      userId: attempt.userId,
      nickname: attempt.user.nickname,
      inputValue: attempt.inputValue,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.isFirstSubmission,
      createdAt: attempt.createdAt,
    });

    if (isCorrect) {
      // Mark block as solved
      await this.blocksService.markBlockAsSolved(blockId, userId, attempt.id);
      
      // Emit block status change event
      this.sseService.emitBlockStatusChange({
        blockId: blockId.toString(),
        status: 'SOLVED',
        winnerId: userId,
        winnerNickname: attempt.user.nickname,
        solvedAt: new Date(),
      });
    }

    // Get remaining CP
    const remainingCP = await this.cpService.getCurrentCP(userId);

    // Get updated block status
    const updatedBlock = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: { status: true },
    });

    return {
      id: attempt.id,
      blockId: attempt.blockId,
      userId: attempt.userId,
      inputValue: attempt.inputValue,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.isFirstSubmission,
      createdAt: attempt.createdAt,
      isCorrect,
      remainingCP,
      blockStatus: updatedBlock?.status || 'UNKNOWN',
    };
  }

  async getBlockAttempts(blockId: bigint, limit: number = 50) {
    const attempts = await this.prisma.attempt.findMany({
      where: { blockId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            isAnonymous: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return attempts.map(attempt => ({
      id: attempt.id,
      inputValue: attempt.inputValue,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.isFirstSubmission,
      createdAt: attempt.createdAt,
      user: attempt.user,
    }));
  }

  async getUserAttempts(userId: string, limit: number = 20) {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId },
      include: {
        block: {
          select: {
            id: true,
            status: true,
            seedHint: true,
            difficultyConfig: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return attempts.map(attempt => ({
      id: attempt.id,
      block: attempt.block,
      inputValue: attempt.inputValue,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.isFirstSubmission,
      createdAt: attempt.createdAt,
    }));
  }

  async getAttemptStats(blockId: bigint) {
    const stats = await this.prisma.attempt.groupBy({
      by: ['userId'],
      where: { blockId },
      _count: {
        id: true,
      },
      _max: {
        similarity: true,
      },
    });

    const totalAttempts = await this.prisma.attempt.count({
      where: { blockId },
    });

    const uniqueUsers = stats.length;

    const maxSimilarity = await this.prisma.attempt.findFirst({
      where: { blockId },
      orderBy: { similarity: 'desc' },
      select: { similarity: true },
    });

    return {
      totalAttempts,
      uniqueUsers,
      maxSimilarity: maxSimilarity?.similarity || 0,
      topUsers: stats
        .sort((a, b) => b._max.similarity! - a._max.similarity!)
        .slice(0, 5)
        .map(stat => ({
          userId: stat.userId,
          attempts: stat._count.id,
          bestSimilarity: stat._max.similarity,
        })),
    };
  }
}