import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminBlocksService } from './admin-blocks.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { PasswordService } from '../../shared/services/password.service';
import { SseService } from '../../sse/sse.service';
import { ForceTransitionDto } from './dto/admin-blocks.dto';

jest.mock('../../shared/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AdminBlocksService', () => {
  let service: AdminBlocksService;
  let prismaMock: {
    block: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let passwordServiceMock: {
    generatePassword: jest.Mock;
    hashPassword: jest.Mock;
    generateNextDifficulty: jest.Mock;
  };
  let sseServiceMock: {
    emitBlockStatusChange: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      block: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    passwordServiceMock = {
      generatePassword: jest.fn(),
      hashPassword: jest.fn(),
      generateNextDifficulty: jest.fn(),
    };

    sseServiceMock = {
      emitBlockStatusChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBlocksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PasswordService, useValue: passwordServiceMock },
        { provide: SseService, useValue: sseServiceMock },
      ],
    }).compile();

    service = module.get<AdminBlocksService>(AdminBlocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listBlocks', () => {
    it('should map bigint fields to numbers', async () => {
      const blocks = [
        {
          id: BigInt(10),
          status: 'ACTIVE',
          seedHint: null,
          answerPlaintext: 'plain',
          answerHash: 'hash',
          accumulatedPoints: BigInt(250),
          createdAt: new Date(),
          solvedAt: null,
          waitingStartedAt: null,
          winner: null,
        },
      ];

      prismaMock.$transaction.mockResolvedValue([1, blocks]);

      const result = await service.listBlocks({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.blocks[0].id).toBe(10);
      expect(result.blocks[0].accumulatedPoints).toBe(250);
    });
  });

  describe('getBlockById', () => {
    it('should throw NotFoundException when block missing', async () => {
      prismaMock.block.findUnique.mockResolvedValue(null);

      await expect(service.getBlockById(BigInt(1))).rejects.toThrow(NotFoundException);
    });

    it('should map bigint fields and attempt count', async () => {
      const block = {
        id: BigInt(5),
        previousBlockId: BigInt(4),
        accumulatedPoints: BigInt(120),
        _count: { attempts: 3 },
      };

      prismaMock.block.findUnique.mockResolvedValue(block);

      const result = await service.getBlockById(BigInt(5));

      expect(result.id).toBe(5);
      expect(result.previousBlockId).toBe(4);
      expect(result.accumulatedPoints).toBe(120);
      expect(result.attemptCount).toBe(3);
    });
  });

  describe('forceTransition', () => {
    it('should throw NotFoundException for missing block', async () => {
      prismaMock.block.findUnique.mockResolvedValue(null);

      const dto = { targetStatus: 'ACTIVE', reason: 'test', hint: 'hint' } as ForceTransitionDto;

      await expect(service.forceTransition(BigInt(1), dto, 'actor-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should require hint for WAITING_HINT transition', async () => {
      prismaMock.block.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'WAITING_HINT',
        difficultyConfig: { length: 4 },
        blockMasterId: null,
        seedHint: null,
        accumulatedPoints: BigInt(100),
      });

      const dto = { targetStatus: 'ACTIVE', reason: 'test' } as ForceTransitionDto;

      await expect(service.forceTransition(BigInt(1), dto, 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should transition WAITING_HINT to ACTIVE and emit update', async () => {
      const block = {
        id: BigInt(2),
        status: 'WAITING_HINT',
        difficultyConfig: { length: 4 },
        blockMasterId: null,
        seedHint: null,
        accumulatedPoints: BigInt(100),
      };

      prismaMock.block.findUnique.mockResolvedValue(block);
      passwordServiceMock.generatePassword.mockReturnValue('generated');
      passwordServiceMock.hashPassword.mockResolvedValue('hash');
      prismaMock.block.update.mockResolvedValue({ id: BigInt(2), status: 'ACTIVE' });

      const dto = {
        targetStatus: 'ACTIVE',
        hint: 'system hint',
        reason: 'test',
      } as ForceTransitionDto;

      const result = await service.forceTransition(BigInt(2), dto, 'actor-1');

      expect(passwordServiceMock.generatePassword).toHaveBeenCalledWith(block.difficultyConfig);
      expect(prismaMock.block.update).toHaveBeenCalledWith({
        where: { id: block.id },
        data: {
          seedHint: 'system hint',
          answerHash: 'hash',
          answerPlaintext: 'generated',
          status: 'ACTIVE',
          waitingStartedAt: null,
        },
      });
      expect(sseServiceMock.emitBlockStatusChange).toHaveBeenCalledWith({
        blockId: '2',
        status: 'ACTIVE',
      });
      expect(result).toEqual({ id: 2, status: 'ACTIVE' });
    });

    it('should force solve and create next block', async () => {
      const blockId = BigInt(3);
      const dto = { targetStatus: 'SOLVED', reason: 'manual' } as ForceTransitionDto;

      prismaMock.block.findUnique.mockResolvedValue({
        id: blockId,
        status: 'ACTIVE',
        difficultyConfig: { length: 4 },
        blockMasterId: null,
        seedHint: null,
        accumulatedPoints: BigInt(100),
      });

      const updatedBlock = { id: blockId };
      const nextBlock = { id: BigInt(4), waitingStartedAt: new Date() };

      prismaMock.$transaction.mockImplementation(
        async (callback: (tx: { block: { update: jest.Mock; create: jest.Mock } }) => Promise<unknown>) =>
          callback({
            block: {
              update: jest.fn().mockResolvedValue(updatedBlock),
              create: jest.fn().mockResolvedValue(nextBlock),
            },
          }),
      );

      passwordServiceMock.generateNextDifficulty.mockReturnValue({ length: 5 });

      const result = await service.forceTransition(blockId, dto, 'actor-1');

      expect(passwordServiceMock.generateNextDifficulty).toHaveBeenCalledWith({ length: 4 });
      expect(sseServiceMock.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SOLVED' }),
      );
      expect(sseServiceMock.emitBlockStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WAITING_HINT' }),
      );
      expect(result).toEqual({ solvedBlockId: 3, nextBlockId: 4 });
    });
  });

  describe('regeneratePassword', () => {
    it('should throw NotFoundException for missing block', async () => {
      prismaMock.block.findUnique.mockResolvedValue(null);

      await expect(service.regeneratePassword(BigInt(1), 'actor-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when block not waiting for password', async () => {
      prismaMock.block.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'ACTIVE',
        difficultyConfig: { length: 4 },
      });

      await expect(service.regeneratePassword(BigInt(1), 'actor-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should regenerate password and return mapped fields', async () => {
      prismaMock.block.findUnique.mockResolvedValue({
        id: BigInt(1),
        status: 'WAITING_PASSWORD',
        difficultyConfig: { length: 4 },
      });

      passwordServiceMock.generatePassword.mockReturnValue('new-password');
      passwordServiceMock.hashPassword.mockResolvedValue('hash');

      prismaMock.block.update.mockResolvedValue({
        id: BigInt(1),
        status: 'WAITING_PASSWORD',
        seedHint: 'hint',
        difficultyConfig: { length: 4 },
        accumulatedPoints: BigInt(200),
        createdAt: new Date(),
      });

      const result = await service.regeneratePassword(BigInt(1), 'actor-1');

      expect(passwordServiceMock.generatePassword).toHaveBeenCalledWith({ length: 4 });
      expect(passwordServiceMock.hashPassword).toHaveBeenCalledWith('new-password');
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          accumulatedPoints: 200,
        }),
      );
    });
  });
});
