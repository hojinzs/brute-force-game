import { Test, TestingModule } from '@nestjs/testing';
import { AdminBlocksController } from './admin-blocks.controller';
import { AdminBlocksService } from './admin-blocks.service';

describe('AdminBlocksController', () => {
  let controller: AdminBlocksController;
  let service: AdminBlocksService;

  const mockAdminBlocksService = {
    listBlocks: jest.fn(),
    getBlockById: jest.fn(),
    forceTransition: jest.fn(),
    regeneratePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminBlocksController],
      providers: [
        {
          provide: AdminBlocksService,
          useValue: mockAdminBlocksService,
        },
      ],
    }).compile();

    controller = module.get<AdminBlocksController>(AdminBlocksController);
    service = module.get<AdminBlocksService>(AdminBlocksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listBlocks', () => {
    it('should return paginated blocks', async () => {
      const mockBlocks = {
        blocks: [{ id: '1', status: 'ACTIVE' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockAdminBlocksService.listBlocks.mockResolvedValue(mockBlocks);

      const result = await controller.listBlocks();
      expect(result).toEqual(mockBlocks);
      expect(service.listBlocks).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('getBlock', () => {
    it('should return block by id', async () => {
      const mockBlock = { id: '1', status: 'ACTIVE', answerPlaintext: 'secret' };
      mockAdminBlocksService.getBlockById.mockResolvedValue(mockBlock);

      const result = await controller.getBlock('1');
      expect(result).toEqual(mockBlock);
      expect(service.getBlockById).toHaveBeenCalledWith(BigInt(1));
    });
  });
});
