import { Test, TestingModule } from '@nestjs/testing';
import { CpService } from '../shared/services/cp.service';
import { PrismaService } from '../shared/database/prisma.service';

describe('CpService', () => {
  let cpService: CpService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    cpService = module.get<CpService>(CpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(cpService).toBeDefined();
  });

  describe('getCurrentCP', () => {
    it('should return current CP without refill for recent user', async () => {
      const userId = 'user1';
      const mockUser = {
        cpCount: 25,
        lastCpRefillAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isAnonymous: false,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await cpService.getCurrentCP(userId);

      expect(result).toBe(25);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should refill CP for user who waited long enough', async () => {
      const userId = 'user1';
      const mockUser = {
        cpCount: 30,
        lastCpRefillAt: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
        isAnonymous: false,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await cpService.getCurrentCP(userId);

      expect(result).toBe(40); // 30 + 10 (max 50)
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          cpCount: 40,
          lastCpRefillAt: expect.any(Date),
        },
      });
    });

    it('should cap at max CP for authenticated users', async () => {
      const userId = 'user1';
      const mockUser = {
        cpCount: 45,
        lastCpRefillAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        isAnonymous: false,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await cpService.getCurrentCP(userId);

      expect(result).toBe(50); // Max for authenticated users
    });

    it('should cap at max CP for anonymous users', async () => {
      const userId = 'user1';
      const mockUser = {
        cpCount: 2,
        lastCpRefillAt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
        isAnonymous: true,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await cpService.getCurrentCP(userId);

      expect(result).toBe(5); // Max for anonymous users
    });
  });

  describe('consumeCP', () => {
    it('should consume CP when user has enough', async () => {
      const userId = 'user1';
      
      jest.spyOn(cpService, 'getCurrentCP').mockResolvedValue(30);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await cpService.consumeCP(userId);

      expect(result).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { cpCount: { decrement: 1 } },
      });
    });

    it('should fail when user has insufficient CP', async () => {
      const userId = 'user1';
      
      jest.spyOn(cpService, 'getCurrentCP').mockResolvedValue(0);

      const result = await cpService.consumeCP(userId);

      expect(result).toBe(false);
    });
  });

  describe('refundCP', () => {
    it('should refund CP to user', async () => {
      const userId = 'user1';
      
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      await cpService.refundCP(userId);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { cpCount: { increment: 1 } },
      });
    });
  });
});