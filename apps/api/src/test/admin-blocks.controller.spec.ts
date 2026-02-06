import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AdminBlocksController } from '../admin/blocks/admin-blocks.controller';
import { AdminBlocksService } from '../admin/blocks/admin-blocks.service';
import { MasterGuard } from '../auth/master.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AdminBlocksController', () => {
  let controller: AdminBlocksController;
  let service: AdminBlocksService;

  const mockAdminBlocksService = {
    getBlocks: vi.fn(),
    getBlockById: vi.fn(),
    forceTransition: vi.fn(),
    regeneratePassword: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBlocksController],
      providers: [
        { provide: AdminBlocksService, useValue: mockAdminBlocksService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MasterGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminBlocksController>(AdminBlocksController);
    service = module.get<AdminBlocksService>(AdminBlocksService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBlocks', () => {
    it('should return paginated blocks', async () => {
      const mockResult = { page: 1, limit: 20, total: 1, blocks: [] };
      mockAdminBlocksService.getBlocks.mockResolvedValue(mockResult);

      const result = await controller.getBlocks('1', '20');
      expect(result).toEqual(mockResult);
      expect(service.getBlocks).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('getBlockById', () => {
    it('should return block detail', async () => {
      const mockBlock = { id: 1, status: 'ACTIVE' };
      mockAdminBlocksService.getBlockById.mockResolvedValue(mockBlock);

      const result = await controller.getBlockById('1');
      expect(result).toEqual(mockBlock);
    });
  });

  describe('forceTransition', () => {
    it('should call forceTransition with correct params', async () => {
      const dto = { targetStatus: 'ACTIVE', hint: 'test', reason: 'stuck' };
      const user = { sub: 'master-id', role: 'MASTER' } as any;
      mockAdminBlocksService.forceTransition.mockResolvedValue({ blockId: 1, newStatus: 'ACTIVE' });

      await controller.forceTransition('1', dto, user);
      expect(service.forceTransition).toHaveBeenCalledWith(
        BigInt(1), 'ACTIVE', 'master-id',
        { hint: 'test', password: undefined, reason: 'stuck' },
      );
    });
  });

  describe('Guard application', () => {
    it('should have MasterAuth guard applied (via decorator metadata)', () => {
      // Verify the controller class has guards applied
      const guards = Reflect.getMetadata('__guards__', AdminBlocksController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });
  });
});
