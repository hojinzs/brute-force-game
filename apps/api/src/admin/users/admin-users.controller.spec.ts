import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: AdminUsersService;

  const mockAdminUsersService = {
    listUsers: jest.fn(),
    getUserStats: jest.fn(),
    getUserById: jest.fn(),
    changeUserRole: jest.fn(),
    resetUserCp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: mockAdminUsersService,
        },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get<AdminUsersService>(AdminUsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = {
        users: [{ id: '1', nickname: 'test', role: 'USER' }],
        total: 1,
      };
      mockAdminUsersService.listUsers.mockResolvedValue(mockUsers);

      const result = await controller.listUsers();
      expect(result).toEqual(mockUsers);
      expect(service.listUsers).toHaveBeenCalled();
    });
  });

  describe('changeUserRole', () => {
    it('should prevent self role change', async () => {
      const currentUser = { sub: 'user-1', role: 'MASTER' };
      
      mockAdminUsersService.changeUserRole.mockRejectedValue(
        new BadRequestException('Cannot modify own role')
      );

      await expect(
        controller.changeUserRole('user-1', { role: 'USER' }, currentUser as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow changing other user role', async () => {
      const currentUser = { sub: 'master-1', role: 'MASTER' };
      const result = { id: 'user-2', role: 'MASTER' };
      
      mockAdminUsersService.changeUserRole.mockResolvedValue(result);

      const response = await controller.changeUserRole(
        'user-2',
        { role: 'MASTER' },
        currentUser as any
      );
      
      expect(response).toEqual(result);
      expect(service.changeUserRole).toHaveBeenCalledWith('user-2', 'MASTER', 'master-1');
    });
  });
});
