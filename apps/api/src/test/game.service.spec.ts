import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../shared/database/prisma.service';
import { PasswordService } from '../shared/services/password.service';
import { CpService } from '../shared/services/cp.service';
import { RankingService } from '../shared/services/ranking.service';
import { ConfigService } from '@nestjs/config';

describe('GameService', () => {
  let service: GameService;
  let blocksService: BlocksService;
  let prismaService: PrismaService;
  let cpService: CpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: BlocksService,
          useValue: {
            markBlockAsSolved: jest.fn(),
            getCurrentBlock: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            block: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            attempt: {
              create: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
        {
          provide: CpService,
          useValue: {
            consumeCP: jest.fn(),
            getCurrentCP: jest.fn(),
          },
        },
        {
          provide: RankingService,
          useValue: {
            updateUserPoints: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    blocksService = module.get<BlocksService>(BlocksService);
    prismaService = module.get<PrismaService>(PrismaService);
    cpService = module.get<CpService>(CpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAnswer', () => {
    it('should call blocksService.markBlockAsSolved on correct answer', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        answerHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        answerPlaintext: 'test',
        accumulatedPoints: BigInt(100),
      };

      const mockAttempt = {
        id: 'attempt-1',
        similarity: 100,
        isFirstSubmission: true,
        user: { nickname: 'testuser' },
      };

      jest.spyOn(prismaService.block, 'findFirst').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.attempt, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.attempt, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.attempt, 'create').mockResolvedValue(mockAttempt as any);
      jest.spyOn(cpService, 'consumeCP').mockResolvedValue(true);
      jest.spyOn(cpService, 'getCurrentCP').mockResolvedValue(49);
      jest.spyOn(blocksService, 'markBlockAsSolved').mockResolvedValue({} as any);

      await service.checkAnswer('user-1', { answer: 'test', blockId: '1' });

      expect(blocksService.markBlockAsSolved).toHaveBeenCalledWith(
        BigInt(1),
        'user-1',
        'attempt-1'
      );
    });
  });

  describe('getCurrentBlock', () => {
    it('should throw NotFoundException (404) when no ACTIVE block', async () => {
      jest.spyOn(prismaService.block, 'findFirst').mockResolvedValue(null);

      await expect(service.getCurrentBlock()).rejects.toThrow(NotFoundException);
      await expect(service.getCurrentBlock()).rejects.toThrow('No active block found');
    });

    it('should return block when ACTIVE block exists', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        accumulatedPoints: BigInt(100),
        createdAt: new Date(),
        _count: { attempts: 5 },
      };

      jest.spyOn(prismaService.block, 'findFirst').mockResolvedValue(mockBlock as any);

      const result = await service.getCurrentBlock();

      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
    });
  });
});
