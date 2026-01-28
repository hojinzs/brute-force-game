import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from '../shared/services/ranking.service';
import { PrismaService } from '../shared/database/prisma.service';
import { SseService } from '../sse/sse.service';

describe('RankingService', () => {
  let rankingService: RankingService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [], // No SSE module needed for isolated testing
      providers: [
        RankingService,
        {
          provide: SseService,
          useValue: {
            emitRankingUpdate: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              count: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    rankingService = module.get<RankingService>(RankingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(rankingService).toBeDefined();
  });

  describe('getUserRank', () => {
    it('should return user rank and points', async () => {
      const userId = 'user1';
      const mockUser = { totalPoints: BigInt(1000) };
      const userCount = 5; // 5 users have more points

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(userCount);

      const result = await rankingService.getUserRank(userId);

      expect(result).toEqual({
        rank: 6, // userCount + 1
        totalPoints: BigInt(1000),
      });
    });

    it('should return rank 1 for top user', async () => {
      const userId = 'user1';
      const mockUser = { totalPoints: BigInt(5000) };
      const userCount = 0; // no users have more points

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(userCount);

      const result = await rankingService.getUserRank(userId);

      expect(result).toEqual({
        rank: 1,
        totalPoints: BigInt(5000),
      });
    });
  });

  describe('getTopRanking', () => {
    it('should return top users with rank', async () => {
      const limit = 10;
      const mockUsers = [
        { nickname: 'user1', totalPoints: BigInt(5000), country: 'KR' },
        { nickname: 'user2', totalPoints: BigInt(4000), country: 'US' },
        { nickname: 'user3', totalPoints: BigInt(3000), country: null },
      ];

      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue(mockUsers as any);

      const result = await rankingService.getTopRanking(limit);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        rank: 1,
        nickname: 'user1',
        totalPoints: BigInt(5000),
        country: 'KR',
      });
      expect(result[1]).toEqual({
        rank: 2,
        nickname: 'user2',
        totalPoints: BigInt(4000),
        country: 'US',
      });
      expect(result[2]).toEqual({
        rank: 3,
        nickname: 'user3',
        totalPoints: BigInt(3000),
        country: null,
      });

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: { isAnonymous: false },
        select: {
          nickname: true,
          totalPoints: true,
          country: true,
        },
        orderBy: { totalPoints: 'desc' },
        take: limit,
      });
    });
  });

  describe('updateUserPoints', () => {
    it('should update user points', async () => {
      const userId = 'user1';
      const points = BigInt(500);

      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      await rankingService.updateUserPoints(userId, points);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totalPoints: { increment: points } },
      });
    });
  });
});