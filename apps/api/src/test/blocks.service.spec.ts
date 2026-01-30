import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../shared/database/prisma.service';
import { PasswordService } from '../shared/services/password.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseService } from '../sse/sse.service';

describe('BlocksService', () => {
  let service: BlocksService;
  let prismaService: PrismaService;
  let passwordService: PasswordService;
  let rankingService: RankingService;
  let sseService: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: PrismaService,
          useValue: {
            block: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
            generatePassword: jest.fn(),
            generateHint: jest.fn(),
            generateNextDifficulty: jest.fn(),
          },
        },
        {
          provide: RankingService,
          useValue: {
            updateUserPoints: jest.fn(),
          },
        },
        {
          provide: SseService,
          useValue: {
            emitBlockStatusChange: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    prismaService = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    rankingService = module.get<RankingService>(RankingService);
    sseService = module.get<SseService>(SseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markBlockAsSolved', () => {
    it('should create next block with WAITING_HINT for non-anonymous winner', async () => {
      const mockWinner = { id: 'user-1', isAnonymous: false };
      const mockCurrentBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
      };
      const mockNextBlock = {
        id: BigInt(2),
        status: 'WAITING_HINT',
        blockMasterId: 'user-1',
        previousBlockId: BigInt(1),
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockWinner),
          },
          block: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue(mockCurrentBlock),
            create: jest.fn().mockResolvedValue(mockNextBlock),
          },
        });
      });

      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);
      jest.spyOn(passwordService, 'generateNextDifficulty').mockReturnValue({ length: 5, charset: ['lowercase'] });

      await service.markBlockAsSolved(BigInt(1), 'user-1', 'attempt-1');

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(sseService.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SOLVED' })
      );
      expect(sseService.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WAITING_HINT' })
      );
    });

    it('should set blockMasterId to current winner', async () => {
      const mockWinner = { id: 'user-1', isAnonymous: false };
      const mockCurrentBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
      };

      let createdBlockData: any = null;

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockWinner),
          },
          block: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue(mockCurrentBlock),
            create: jest.fn().mockImplementation((data) => {
              createdBlockData = data.data;
              return Promise.resolve({ id: BigInt(2), ...data.data });
            }),
          },
        });
      });

      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);
      jest.spyOn(passwordService, 'generateNextDifficulty').mockReturnValue({ length: 5, charset: ['lowercase'] });

      await service.markBlockAsSolved(BigInt(1), 'user-1', 'attempt-1');

      expect(createdBlockData.blockMasterId).toBe('user-1');
    });

    it('should create WAITING_PASSWORD block with anonymous winner', async () => {
      const mockWinner = { id: 'user-anon', isAnonymous: true };
      const mockCurrentBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
      };

      let createdBlockData: any = null;

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockWinner),
          },
          block: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue(mockCurrentBlock),
            create: jest.fn().mockImplementation((data) => {
              createdBlockData = data.data;
              return Promise.resolve({ id: BigInt(2), ...data.data });
            }),
          },
        });
      });

      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);
      jest.spyOn(passwordService, 'generateNextDifficulty').mockReturnValue({ length: 5, charset: ['lowercase'] });
      jest.spyOn(passwordService, 'generateHint').mockReturnValue('System generated hint');

      await service.markBlockAsSolved(BigInt(1), 'user-anon', 'attempt-1');

      expect(createdBlockData.status).toBe('WAITING_PASSWORD');
      expect(createdBlockData.blockMasterId).toBeNull();
      expect(createdBlockData.seedHint).toBe('System generated hint');
    });

    it('should throw ConflictException if block already solved', async () => {
      const mockWinner = { id: 'user-1', isAnonymous: false };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockWinner),
          },
          block: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // No rows updated
          },
        });
      });

      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);

      await expect(
        service.markBlockAsSolved(BigInt(1), 'user-1', 'attempt-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitHint', () => {
    it('should transition WAITING_HINT to WAITING_PASSWORD', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'WAITING_HINT',
        blockMasterId: 'user-1',
      };

      const mockUpdatedBlock = {
        ...mockBlock,
        status: 'WAITING_PASSWORD',
        seedHint: 'test hint',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(mockUpdatedBlock as any);

      await service.submitHint(BigInt(1), 'user-1', 'test hint');

      expect(prismaService.block.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          seedHint: 'test hint',
          status: 'WAITING_PASSWORD',
        },
      });

      expect(sseService.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WAITING_PASSWORD' })
      );
    });

    it('should reject non-blockMaster', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'WAITING_HINT',
        blockMasterId: 'user-1',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);

      await expect(
        service.submitHint(BigInt(1), 'user-2', 'test hint')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if block not WAITING_HINT', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
        blockMasterId: 'user-1',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);

      await expect(
        service.submitHint(BigInt(1), 'user-1', 'test hint')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setPassword', () => {
    it('should transition WAITING_PASSWORD to ACTIVE', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'WAITING_PASSWORD',
      };

      const mockUpdatedBlock = {
        ...mockBlock,
        status: 'ACTIVE',
        answerHash: 'hash123',
        answerPlaintext: 'password',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(mockUpdatedBlock as any);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hash123');

      await service.setPassword(BigInt(1), 'password');

      expect(passwordService.hashPassword).toHaveBeenCalledWith('password');
      expect(prismaService.block.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          answerHash: 'hash123',
          answerPlaintext: 'password',
          status: 'ACTIVE',
        },
      });

      expect(sseService.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE' })
      );
    });

    it('should reject if block not WAITING_PASSWORD', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'ACTIVE',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);

      await expect(
        service.setPassword(BigInt(1), 'password')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setSystemHint', () => {
    it('should set hint without blockMaster validation', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'WAITING_HINT',
        blockMasterId: 'user-1',
      };

      const mockUpdatedBlock = {
        ...mockBlock,
        status: 'WAITING_PASSWORD',
        seedHint: 'system hint',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(mockUpdatedBlock as any);

      await service.setSystemHint(BigInt(1), 'system hint');

      expect(prismaService.block.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          seedHint: 'system hint',
          status: 'WAITING_PASSWORD',
        },
      });
    });
  });
});
