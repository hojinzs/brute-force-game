import { Test, TestingModule } from '@nestjs/testing';
import { BlocksTimeoutService } from '../blocks/blocks-timeout.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../shared/database/prisma.service';
import { PasswordService } from '../shared/services/password.service';
import { AiPasswordService } from '../blocks/ai-password.service';

describe('BlocksTimeoutService', () => {
  let service: BlocksTimeoutService;
  let blocksService: BlocksService;
  let prismaService: PrismaService;
  let passwordService: PasswordService;
  let aiPasswordService: AiPasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksTimeoutService,
        {
          provide: BlocksService,
          useValue: {
            setSystemHint: jest.fn(),
            setPassword: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            block: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: PasswordService,
          useValue: {
            generateHint: jest.fn(),
            generatePassword: jest.fn(),
            generateNextDifficulty: jest.fn(),
          },
        },
        {
          provide: AiPasswordService,
          useValue: {
            attemptPasswordGeneration: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlocksTimeoutService>(BlocksTimeoutService);
    blocksService = module.get<BlocksService>(BlocksService);
    prismaService = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    aiPasswordService = module.get<AiPasswordService>(AiPasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleHintTimeout', () => {
    it('should transition WAITING_HINT to WAITING_PASSWORD after 3 minutes', async () => {
      const mockBlock = {
        id: BigInt(1),
        difficultyConfig: { length: 4, charset: ['lowercase'] },
      };

      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([mockBlock] as any);
      jest.spyOn(passwordService, 'generateHint').mockReturnValue('System generated hint');
      jest.spyOn(blocksService, 'setSystemHint').mockResolvedValue(undefined);

      await service.handleHintTimeout();

      expect(prismaService.block.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING_HINT',
          waitingStartedAt: {
            lte: expect.any(Date),
          },
        },
        select: {
          id: true,
          difficultyConfig: true,
        },
      });

      expect(passwordService.generateHint).toHaveBeenCalledWith(mockBlock.difficultyConfig);
      expect(blocksService.setSystemHint).toHaveBeenCalledWith(BigInt(1), 'System generated hint');
    });

    it('should not process blocks within 3 minute window', async () => {
      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([]);

      await service.handleHintTimeout();

      expect(blocksService.setSystemHint).not.toHaveBeenCalled();
    });
  });

  describe('handlePasswordRetryFallback', () => {
    it('should transition WAITING_PASSWORD to ACTIVE after 5 retries', async () => {
      const mockBlock = {
        id: BigInt(1),
        difficultyConfig: { length: 4, charset: ['lowercase'] },
      };

      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([mockBlock] as any);
      jest.spyOn(passwordService, 'generatePassword').mockReturnValue('fallback123');
      jest.spyOn(blocksService, 'setPassword').mockResolvedValue(mockBlock as any);

      await service.handlePasswordRetryFallback();

      expect(prismaService.block.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING_PASSWORD',
          passwordRetryCount: {
            gte: 5,
          },
        },
        select: {
          id: true,
          difficultyConfig: true,
        },
      });

      expect(passwordService.generatePassword).toHaveBeenCalledWith(mockBlock.difficultyConfig);
      expect(blocksService.setPassword).toHaveBeenCalledWith(BigInt(1), 'fallback123');
    });

    it('should not process blocks with retry count < 5', async () => {
      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([]);

      await service.handlePasswordRetryFallback();

      expect(blocksService.setPassword).not.toHaveBeenCalled();
    });
  });

  describe('handlePendingPasswordGeneration', () => {
    it('should call AI service for WAITING_PASSWORD blocks', async () => {
      const mockBlock = {
        id: BigInt(1),
      };

      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([mockBlock] as any);
      jest.spyOn(aiPasswordService, 'attemptPasswordGeneration').mockResolvedValue(true);

      await service.handlePendingPasswordGeneration();

      expect(prismaService.block.findMany).toHaveBeenCalledWith({
        where: {
          status: 'WAITING_PASSWORD',
          passwordRetryCount: {
            lt: 5,
          },
        },
        select: {
          id: true,
        },
      });

      expect(aiPasswordService.attemptPasswordGeneration).toHaveBeenCalledWith(BigInt(1));
    });

    it('should handle AI generation failure gracefully', async () => {
      const mockBlock = {
        id: BigInt(1),
        status: 'WAITING_PASSWORD',
        passwordRetryCount: 2,
      };

      jest.spyOn(prismaService.block, 'findMany').mockResolvedValue([mockBlock] as any);
      jest.spyOn(aiPasswordService, 'attemptPasswordGeneration').mockResolvedValue(false);

      await expect(service.handlePendingPasswordGeneration()).resolves.not.toThrow();
    });
  });
});
