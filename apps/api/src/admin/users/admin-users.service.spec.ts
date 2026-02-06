import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateUserRoleDto } from './dto/admin-users.dto';

jest.mock('../../shared/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    session: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      session: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminUsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateUserRole', () => {
    const dto = { role: 'MASTER' } as UpdateUserRoleDto;

    it('should prevent self role change', async () => {
      await expect(service.updateUserRole('user-1', dto, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when user missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUserRole('user-1', dto, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when role unchanged', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'MASTER' });

      await expect(service.updateUserRole('user-1', dto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update role and invalidate sessions', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
      prismaMock.user.update.mockResolvedValue({
        id: 'user-1',
        nickname: 'user',
        email: 'user@example.com',
        role: 'MASTER',
      });
      prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.updateUserRole('user-1', dto, 'admin-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: dto.role },
        select: {
          id: true,
          nickname: true,
          email: true,
          role: true,
        },
      });
      expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(result).toEqual({
        id: 'user-1',
        nickname: 'user',
        email: 'user@example.com',
        role: 'MASTER',
      });
    });
  });

  describe('resetCp', () => {
    it('should throw NotFoundException when user missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.resetCp('user-1', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should reset cp and return updated values', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prismaMock.user.update.mockResolvedValue({ id: 'user-1', cpCount: 50 });

      const result = await service.resetCp('user-1', 'admin-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          cpCount: 50,
          lastCpRefillAt: expect.any(Date),
        },
        select: {
          id: true,
          cpCount: true,
        },
      });
      expect(result).toEqual({ id: 'user-1', cpCount: 50 });
    });
  });
});
