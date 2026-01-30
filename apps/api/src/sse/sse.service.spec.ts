import { Test, TestingModule } from '@nestjs/testing';
import { SseService } from './sse.service';
import { SseGateway } from './gateway/sse.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SseService', () => {
  let service: SseService;
  let gateway: SseGateway;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockGateway = {
      broadcastToFeed: jest.fn(),
      broadcastToRankings: jest.fn(),
      broadcastToBlocks: jest.fn(),
      broadcastToPresence: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseService,
        {
          provide: SseGateway,
          useValue: mockGateway,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SseService>(SseService);
    gateway = module.get<SseGateway>(SseGateway);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitNewAttempt', () => {
    it('should emit attempt event via event emitter', () => {
      const attemptEvent = {
        blockId: '123',
        userId: 'user1',
        nickname: 'testuser',
        inputValue: 'test',
        similarity: 85.5,
        isFirstSubmission: true,
        createdAt: new Date(),
      };

      service.emitNewAttempt(attemptEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.attempt', {
        type: 'attempt',
        data: attemptEvent,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('emitBlockStatusChange', () => {
    it('should emit block status event via event emitter', () => {
      const blockEvent = {
        blockId: '123',
        status: 'SOLVED' as const,
        winnerId: 'user1',
        winnerNickname: 'testuser',
        solvedAt: new Date(),
      };

      service.emitBlockStatusChange(blockEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.block-status', {
        type: 'block-status',
        data: blockEvent,
        timestamp: expect.any(Date),
      });
    });

    it('should emit WAITING_HINT status with blockMasterId', () => {
      const blockEvent = {
        blockId: '456',
        status: 'WAITING_HINT' as const,
        blockMasterId: 'user1',
        waitingStartedAt: new Date(),
      };

      service.emitBlockStatusChange(blockEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.block-status', {
        type: 'block-status',
        data: blockEvent,
        timestamp: expect.any(Date),
      });
    });

    it('should emit WAITING_PASSWORD status', () => {
      const blockEvent = {
        blockId: '789',
        status: 'WAITING_PASSWORD' as const,
        blockMasterId: 'user1',
        waitingStartedAt: new Date(),
      };

      service.emitBlockStatusChange(blockEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.block-status', {
        type: 'block-status',
        data: blockEvent,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('emitRankingUpdate', () => {
    it('should emit ranking event via event emitter', () => {
      const rankingEvent = {
        userId: 'user1',
        nickname: 'testuser',
        rank: 1,
        points: 1000,
        change: 100,
      };

      service.emitRankingUpdate(rankingEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.ranking', {
        type: 'ranking',
        data: rankingEvent,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('emitPresenceUpdate', () => {
    it('should emit presence event via event emitter', () => {
      const presenceEvent = {
        userId: 'user1',
        nickname: 'testuser',
        action: 'join' as const,
        onlineCount: 10,
      };

      service.emitPresenceUpdate(presenceEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('sse.presence', {
        type: 'presence',
        data: presenceEvent,
        timestamp: expect.any(Date),
      });
    });
  });
});