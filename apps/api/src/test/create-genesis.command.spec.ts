import { Test, TestingModule } from '@nestjs/testing';
import { CreateGenesisCommand } from '../cli/create-genesis.command';
import { BlocksService } from '../blocks/blocks.service';
import { BadRequestException } from '@nestjs/common';

describe('CreateGenesisCommand', () => {
  let command: CreateGenesisCommand;
  let blocksService: jest.Mocked<BlocksService>;

  beforeEach(async () => {
    const mockBlocksService = {
      createGenesisBlock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateGenesisCommand,
        {
          provide: BlocksService,
          useValue: mockBlocksService,
        },
      ],
    }).compile();

    command = module.get<CreateGenesisCommand>(CreateGenesisCommand);
    blocksService = module.get(BlocksService) as jest.Mocked<BlocksService>;
  });

  it('should create genesis block with valid password and hint', async () => {
    const mockBlock = {
      id: BigInt(1),
      status: 'ACTIVE' as const,
      seedHint: 'Test hint',
      difficultyConfig: { length: 7, charset: ['lowercase', 'alphanumeric'] },
      accumulatedPoints: BigInt(100),
      createdAt: new Date(),
    };

    blocksService.createGenesisBlock.mockResolvedValue(mockBlock);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await command.run([], { password: 'test123', hint: 'A test password' });

    expect(blocksService.createGenesisBlock).toHaveBeenCalledWith(
      'test123',
      'A test password',
      {
        length: 7,
        charset: expect.arrayContaining(['lowercase', 'alphanumeric']),
      },
    );
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should auto-detect difficultyConfig from password', async () => {
    const mockBlock = {
      id: BigInt(1),
      status: 'ACTIVE' as const,
      seedHint: 'Test hint',
      difficultyConfig: { length: 6, charset: ['lowercase', 'alphanumeric'] },
      accumulatedPoints: BigInt(100),
      createdAt: new Date(),
    };

    blocksService.createGenesisBlock.mockResolvedValue(mockBlock);

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await command.run([], { password: 'abc123', hint: 'Test' });

    expect(blocksService.createGenesisBlock).toHaveBeenCalledWith(
      'abc123',
      'Test',
      expect.objectContaining({
        length: 6,
        charset: expect.arrayContaining(['lowercase', 'alphanumeric']),
      }),
    );

    exitSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should fail if block already exists', async () => {
    blocksService.createGenesisBlock.mockRejectedValue(
      new BadRequestException('Block already exists. Genesis block can only be created once.'),
    );

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await command.run([], { password: 'test', hint: 'Test' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Block already exists'),
    );

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should require --password option', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await command.run([], { password: '', hint: 'Test' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --password is required');

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should require --hint option', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await command.run([], { password: 'test', hint: '' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: --hint is required');

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
