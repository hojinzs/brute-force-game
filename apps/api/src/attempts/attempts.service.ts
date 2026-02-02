import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
      blockId: Number(attempt.blockId),
      userId: attempt.userId,
      nickname: attempt.user.nickname,
      inputValue: attempt.inputValue,
      similarity: attempt.similarity,
      isFirstSubmission: attempt.isFirstSubmission,
      createdAt: attempt.createdAt,
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
