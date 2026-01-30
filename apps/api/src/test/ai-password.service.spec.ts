import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiPasswordService } from '../blocks/ai-password.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../shared/database/prisma.service';

global.fetch = jest.fn();

describe('AiPasswordService', () => {
  let service: AiPasswordService;
  let blocksService: BlocksService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiPasswordService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            block: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: BlocksService,
          useValue: {
            setPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiPasswordService>(AiPasswordService);
    blocksService = module.get<BlocksService>(BlocksService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    (global.fetch as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('attemptPasswordGeneration', () => {
    it('should call OpenAI API with correct prompt', async () => {
      const mockBlock = {
        id: BigInt(1),
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        passwordRetryCount: 0,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'test',
              },
            },
          ],
        }),
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      jest.spyOn(blocksService, 'setPassword').mockResolvedValue(undefined);

      await service.attemptPasswordGeneration(BigInt(1));

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
          body: expect.stringContaining('test hint'),
        })
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages[0].content).toContain('test hint');
      expect(body.messages[0].content).toContain('Exact length: 4');
    });

    it('should validate password length and charset', async () => {
      const mockBlock = {
        id: BigInt(1),
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        passwordRetryCount: 0,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'TOOLONG',
              },
            },
          ],
        }),
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(undefined);

      const result = await service.attemptPasswordGeneration(BigInt(1));

      expect(result).toBe(false);
      expect(prismaService.block.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          passwordRetryCount: {
            increment: 1,
          },
        },
      });
      expect(blocksService.setPassword).not.toHaveBeenCalled();
    });

    it('should increment retryCount on failure', async () => {
      const mockBlock = {
        id: BigInt(1),
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        passwordRetryCount: 2,
      };

      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error',
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(undefined);

      const result = await service.attemptPasswordGeneration(BigInt(1));

      expect(result).toBe(false);
      expect(prismaService.block.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          passwordRetryCount: {
            increment: 1,
          },
        },
      });
    });

    it('should call setPassword on success', async () => {
      const mockBlock = {
        id: BigInt(1),
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        passwordRetryCount: 0,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'test',
              },
            },
          ],
        }),
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      jest.spyOn(blocksService, 'setPassword').mockResolvedValue(undefined);

      const result = await service.attemptPasswordGeneration(BigInt(1));

      expect(result).toBe(true);
      expect(blocksService.setPassword).toHaveBeenCalledWith(BigInt(1), 'test');
      expect(prismaService.block.update).not.toHaveBeenCalled();
    });

    it('should return false if block not found', async () => {
      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(null);

      const result = await service.attemptPasswordGeneration(BigInt(999));

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate charset correctly', async () => {
      const mockBlock = {
        id: BigInt(1),
        seedHint: 'test hint',
        difficultyConfig: { length: 4, charset: ['lowercase'] },
        passwordRetryCount: 0,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'TEST',
              },
            },
          ],
        }),
      };

      jest.spyOn(prismaService.block, 'findUnique').mockResolvedValue(mockBlock as any);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      jest.spyOn(prismaService.block, 'update').mockResolvedValue(undefined);

      const result = await service.attemptPasswordGeneration(BigInt(1));

      expect(result).toBe(false);
      expect(prismaService.block.update).toHaveBeenCalled();
    });
  });
});
