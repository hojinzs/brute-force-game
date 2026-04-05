import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminBlocksService } from '../admin/blocks/admin-blocks.service';
import { PrismaService } from '../shared/database/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { PasswordService } from '../shared/services/password.service';
import { SseService } from '../sse/sse.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AdminBlocksService - Force Transition', () => {
  let service: AdminBlocksService;

  const mockPrisma = {
    block: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockBlocksService = {
    setSystemHint: vi.fn(),
    setPassword: vi.fn(),
  };

  const mockPasswordService = {
    hashPassword: vi.fn(),
    generateNextDifficulty: vi.fn(),
  };

  const mockSseService = {
    emitBlockStatusChange: vi.fn(),
    emitCurrentBlockUpdate: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBlocksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BlocksService, useValue: mockBlocksService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: SseService, useValue: mockSseService },
      ],
    }).compile();

    service = module.get<AdminBlocksService>(AdminBlocksService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('forceTransition', () => {
    it('should transition WAITING_HINT to WAITING_PASSWORD with hint only', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'WAITING_HINT',
      });

      const result = await service.forceTransition(
        BigInt(1), 'ACTIVE', 'master-1',
        { hint: 'forced hint' },
      );

      expect(mockBlocksService.setSystemHint).toHaveBeenCalledWith(BigInt(1), 'forced hint');
      expect(result.newStatus).toBe('WAITING_PASSWORD');
    });

    it('should transition WAITING_HINT to ACTIVE with hint and password', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'WAITING_HINT',
      });
      mockPasswordService.hashPassword.mockResolvedValue('hashed');
      mockPrisma.block.update.mockResolvedValue({
        id: BigInt(1), status: 'ACTIVE', seedHint: 'hint',
        difficultyConfig: {}, accumulatedPoints: BigInt(100), createdAt: new Date(),
      });

      const result = await service.forceTransition(
        BigInt(1), 'ACTIVE', 'master-1',
        { hint: 'forced hint', password: 'pass123' },
      );

      expect(result.newStatus).toBe('ACTIVE');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('pass123');
    });

    it('should transition WAITING_PASSWORD to ACTIVE with password', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'WAITING_PASSWORD',
      });

      const result = await service.forceTransition(
        BigInt(1), 'ACTIVE', 'master-1',
        { password: 'pass123' },
      );

      expect(mockBlocksService.setPassword).toHaveBeenCalledWith(BigInt(1), 'pass123');
      expect(result.newStatus).toBe('ACTIVE');
    });

    it('should reject WAITING_PASSWORD to ACTIVE without password', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'WAITING_PASSWORD',
      });

      await expect(
        service.forceTransition(BigInt(1), 'ACTIVE', 'master-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should force SOLVED and create next block', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'ACTIVE', difficultyConfig: { length: 4, charset: ['lowercase'] },
      });
      mockPasswordService.generateNextDifficulty.mockReturnValue({
        length: 5, charset: ['lowercase'],
      });
      mockPrisma.$transaction.mockImplementation((fn) => fn(mockPrisma));
      mockPrisma.block.update.mockResolvedValue({});
      mockPrisma.block.create.mockResolvedValue({ id: BigInt(2) });

      const result = await service.forceTransition(
        BigInt(1), 'SOLVED', 'master-1',
        { reason: 'stuck block' },
      );

      expect(result.newStatus).toBe('SOLVED');
    });

    it('should reject already SOLVED block', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'SOLVED',
      });

      await expect(
        service.forceTransition(BigInt(1), 'SOLVED', 'master-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transition', async () => {
      mockPrisma.block.findUnique.mockResolvedValue({
        id: BigInt(1), status: 'ACTIVE',
      });

      await expect(
        service.forceTransition(BigInt(1), 'ACTIVE', 'master-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent block', async () => {
      mockPrisma.block.findUnique.mockResolvedValue(null);

      await expect(
        service.forceTransition(BigInt(999), 'ACTIVE', 'master-1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
