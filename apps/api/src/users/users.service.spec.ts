import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../shared/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CpService } from '../shared/services/cp.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let cpService: CpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            session: {
              create: jest.fn(),
              deleteMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            generateTokens: jest.fn(),
            validateUser: jest.fn(),
          },
        },
        {
          provide: CpService,
          useValue: {
            getCurrentCP: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    cpService = module.get<CpService>(CpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upgradeAnonymousUser', () => {
    const mockDto = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'TestUser',
    };

    it('should successfully upgrade anonymous user', async () => {
      const userId = 'user-anon';
      const mockAnonymousUser = {
        id: userId,
        email: null,
        nickname: 'Anonymous#123',
        isAnonymous: true,
        cpCount: 5,
      };
      const mockUpdatedUser = {
        id: userId,
        email: mockDto.email,
        nickname: mockDto.nickname,
        isAnonymous: false,
        cpCount: 50,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAnonymousUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockUpdatedUser as any);
      jest.spyOn(prismaService.session, 'deleteMany').mockResolvedValue({ count: 1 } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.upgradeAnonymousUser(userId, mockDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockDto.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: mockDto.email,
          passwordHash: 'hashedPassword',
          nickname: mockDto.nickname,
          isAnonymous: false,
          cpCount: 50,
        },
      });
      expect(prismaService.session.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = 'non-existent';

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow(NotFoundException);
      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if user is not anonymous', async () => {
      const userId = 'user-regular';
      const mockRegularUser = {
        id: userId,
        email: 'existing@example.com',
        nickname: 'RegularUser',
        isAnonymous: false,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockRegularUser as any);

      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow(BadRequestException);
      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow('User is not anonymous');
    });

    it('should throw ConflictException if email already exists', async () => {
      const userId = 'user-anon';
      const mockAnonymousUser = {
        id: userId,
        isAnonymous: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAnonymousUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'update').mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow(ConflictException);
      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow('email already exists');
    });

    it('should throw ConflictException if nickname already exists', async () => {
      const userId = 'user-anon';
      const mockAnonymousUser = {
        id: userId,
        isAnonymous: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAnonymousUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'update').mockRejectedValue({
        code: 'P2002',
        meta: { target: ['nickname'] },
      });

      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow(ConflictException);
      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow('nickname already exists');
    });

    it('should rethrow unknown errors', async () => {
      const userId = 'user-anon';
      const mockAnonymousUser = {
        id: userId,
        isAnonymous: true,
      };
      const unknownError = new Error('Database connection failed');

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAnonymousUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(prismaService.user, 'update').mockRejectedValue(unknownError);

      await expect(service.upgradeAnonymousUser(userId, mockDto)).rejects.toThrow('Database connection failed');
    });

    it('should set cpCount to 50 after upgrade', async () => {
      const userId = 'user-anon';
      const mockAnonymousUser = {
        id: userId,
        isAnonymous: true,
        cpCount: 5,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAnonymousUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prismaService.session, 'deleteMany').mockResolvedValue({ count: 0 } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.upgradeAnonymousUser(userId, mockDto);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cpCount: 50,
          }),
        })
      );
    });
  });
});
