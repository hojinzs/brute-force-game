import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminUsersController } from '../admin/users/admin-users.controller';
import { AdminUsersService } from '../admin/users/admin-users.service';
import { MasterGuard } from '../auth/master.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: AdminUsersService;

  const mockAdminUsersService = {
    getUsers: vi.fn(),
    getUserStats: vi.fn(),
    getUserById: vi.fn(),
    updateUserRole: vi.fn(),
    resetUserCp: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        { provide: AdminUsersService, useValue: mockAdminUsersService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MasterGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateUserRole', () => {
    it('should update role for different user', async () => {
      const user = { sub: 'master-1', role: 'MASTER' } as any;
      mockAdminUsersService.updateUserRole.mockResolvedValue({
        id: 'target-1', nickname: 'target', role: 'MASTER', previousRole: 'USER',
      });

      const result = await controller.updateUserRole('target-1', { role: 'MASTER' }, user);
      expect(service.updateUserRole).toHaveBeenCalledWith('target-1', 'MASTER', 'master-1');
      expect(result.role).toBe('MASTER');
    });

    it('should reject self-role-change via service', async () => {
      const user = { sub: 'master-1', role: 'MASTER' } as any;
      mockAdminUsersService.updateUserRole.mockRejectedValue(
        new BadRequestException('Cannot modify own role'),
      );

      await expect(
        controller.updateUserRole('master-1', { role: 'USER' }, user),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserStats', () => {
    it('should return aggregate user stats', async () => {
      const mockStats = {
        totalUsers: 100, totalAnonymous: 30, totalRegistered: 70,
        totalMasters: 2, activeUsersLast24h: 45, newUsersToday: 5,
      };
      mockAdminUsersService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getUserStats();
      expect(result).toEqual(mockStats);
    });
  });

  describe('resetUserCp', () => {
    it('should reset CP for target user', async () => {
      const user = { sub: 'master-1', role: 'MASTER' } as any;
      mockAdminUsersService.resetUserCp.mockResolvedValue({
        id: 'target-1', nickname: 'target', cpCount: 50,
      });

      const result = await controller.resetUserCp('target-1', user);
      expect(result.cpCount).toBe(50);
    });
  });

  describe('Guard application', () => {
    it('should have MasterAuth guard applied', () => {
      const guards = Reflect.getMetadata('__guards__', AdminUsersController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });
  });
});
