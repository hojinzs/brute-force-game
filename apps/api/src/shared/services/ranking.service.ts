import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserRank(userId: string): Promise<{ rank: number; totalPoints: bigint }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const rank = await this.prisma.user.count({
      where: {
        totalPoints: { gt: user.totalPoints },
        isAnonymous: false,
      },
    });

    return { rank: rank + 1, totalPoints: user.totalPoints };
  }

  async getTopRanking(limit: number = 10): Promise<Array<{ rank: number; nickname: string; totalPoints: bigint; country?: string }>> {
    const topUsers = await this.prisma.user.findMany({
      where: { isAnonymous: false },
      select: {
        nickname: true,
        totalPoints: true,
        country: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });

    return topUsers.map((user, index) => ({
      rank: index + 1,
      nickname: user.nickname,
      totalPoints: user.totalPoints,
      country: user.country || undefined,
    }));
  }

  async updateUserPoints(userId: string, points: bigint): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: points } },
    });
  }

  async getLeaderboardAroundUser(
    userId: string,
    limit: number = 5,
  ): Promise<{
    rank: number;
    totalPoints: bigint;
    above: Array<{ rank: number; nickname: string; totalPoints: bigint }>;
    below: Array<{ rank: number; nickname: string; totalPoints: bigint }>;
  }> {
    const userRank = await this.getUserRank(userId);

    const above = await this.prisma.user.findMany({
      where: {
        totalPoints: { gt: userRank.totalPoints },
        isAnonymous: false,
      },
      select: {
        nickname: true,
        totalPoints: true,
      },
      orderBy: { totalPoints: 'asc' },
      take: limit,
    });

    const below = await this.prisma.user.findMany({
      where: {
        totalPoints: { lt: userRank.totalPoints },
        isAnonymous: false,
      },
      select: {
        nickname: true,
        totalPoints: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });

    return {
      ...userRank,
      above: above.reverse().map((user, index) => ({
        rank: userRank.rank - (index + 1),
        ...user,
      })),
      below: below.map((user, index) => ({
        rank: userRank.rank + (index + 1),
        ...user,
      })),
    };
  }
}