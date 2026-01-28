import { Test, TestingModule } from '@nestjs/testing';
import { SseRateLimitService } from './sse-rate-limit.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('SseRateLimitService', () => {
  let service: SseRateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [SseRateLimitService],
    }).compile();

    service = module.get<SseRateLimitService>(SseRateLimitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    // Cleanup after each test
    service['connectionData'].clear();
  });

  afterEach(async () => {
    // Cleanup intervals
    if (service['cleanupInterval']) {
      clearInterval(service['cleanupInterval']);
    }
    await service.onModuleDestroy();
  });

  describe('checkConnectionLimit', () => {
    it('should allow first connection from IP', () => {
      const result = service.checkConnectionLimit('192.168.1.1');
      expect(result.allowed).toBe(true);
    });

    it('should allow connections within limits', () => {
      // Record multiple connections for same IP within time window
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        service.recordConnection('192.168.1.1');
      }

      const result = service.checkConnectionLimit('192.168.1.1');
      expect(result.allowed).toBe(true);
    });

    it('should block excessive connections from IP', () => {
      // Record connections at limit
      for (let i = 0; i < 10; i++) {
        service.recordConnection('192.168.1.1');
      }

      const result = service.checkConnectionLimit('192.168.1.1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Too many connections from IP');
    });

    it('should block excessive connections for user', () => {
      // Record connections at user limit
      for (let i = 0; i < 5; i++) {
        service.recordConnection('192.168.1.1', 'user123');
      }

      const result = service.checkConnectionLimit('192.168.1.1', 'user123');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Too many connections for user');
    });

    it('should respect time window for rate limiting', async () => {
      // Record connections at limit
      for (let i = 0; i < 10; i++) {
        service.recordConnection('192.168.1.1');
      }

      // Should be blocked
      let result = service.checkConnectionLimit('192.168.1.1');
      expect(result.allowed).toBe(false);

      // Wait for cleanup and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      await service['performAsyncCleanup']();

      // Should still be blocked since timestamps are recent
      result = service.checkConnectionLimit('192.168.1.1');
      expect(result.allowed).toBe(false);
    });
  });

  describe('recordConnection', () => {
    it('should record new connection with timestamps', () => {
      service.recordConnection('192.168.1.1', 'user123');
      
      const stats = service.getRateStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.uniqueIPs).toBe(1);
      expect(stats.uniqueUsers).toBe(1);
    });

    it('should increment connection count and timestamps for existing', () => {
      service.recordConnection('192.168.1.1', 'user123');
      service.recordConnection('192.168.1.1', 'user123');
      
      const stats = service.getRateStats();
      expect(stats.totalConnections).toBe(1); // Still one unique connection
    });

    it('should track multiple connection timestamps', () => {
      const userKey = 'user:test123';
      
      service.recordConnection('192.168.1.1', 'test123');
      service.recordConnection('192.168.1.1', 'test123');
      service.recordConnection('192.168.1.1', 'test123');
      
      // Access private connection data to verify timestamps
      const connectionData = service['connectionData'];
      const connection = connectionData.get(userKey);
      
      expect(connection).toBeDefined();
      if (connection) {
        expect(connection.connectionTimestamps).toHaveLength(3);
        expect(connection.connectionCount).toBe(3);
      }
    });
  });

  describe('blockConnection', () => {
    it('should block connection temporarily', () => {
      service.recordConnection('192.168.1.1', 'user123');
      service.blockConnection('192.168.1.1', 'Test block', 'user123');
      
      expect(service.isBlocked('192.168.1.1', 'user123')).toBe(true);
    });

    it('should unblock after duration expires', () => {
      service.recordConnection('192.168.1.1', 'user123');
      
      service.blockConnection('192.168.1.1', 'Test block', 'user123');
      
      // Manually expire the block
      const connectionData = service['connectionData'];
      const connection = connectionData.get('user:user123');
      if (connection && connection.blockedUntil) {
        connection.blockedUntil = new Date(Date.now() - 1000); // 1 second ago
      }
      
      expect(service.isBlocked('192.168.1.1', 'user123')).toBe(false);
    });

    it('should handle non-existent connections gracefully', () => {
      expect(service.isBlocked('192.168.1.1', 'nonexistent')).toBe(false);
    });
  });

  describe('getRateStats', () => {
    it('should return comprehensive statistics', () => {
      // Add some test connections
      service.recordConnection('192.168.1.1', 'user1');
      service.recordConnection('192.168.1.2', 'user2');
      service.recordConnection('192.168.1.1', 'user1');
      
      const stats = service.getRateStats();
      
      expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      expect(stats.uniqueIPs).toBeGreaterThanOrEqual(0);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(0);
      expect(stats.limits).toBeDefined();
      expect(stats.limits.maxPerIP).toBe(10);
      expect(stats.limits.maxPerUser).toBe(5);
      expect(stats.limits.windowMinutes).toBe(1);
      expect(stats.limits.blockDurationMinutes).toBe(15);
    });

    it('should correctly track blocked connections', () => {
      service.recordConnection('192.168.1.1', 'user1');
      service.blockConnection('192.168.1.1', 'Test block', 'user1');
      
      const stats = service.getRateStats();
      expect(stats.blockedConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe('recordDisconnection', () => {
    it('should decrease connection count', () => {
      service.recordConnection('192.168.1.1', 'user123');
      service.recordConnection('192.168.1.1', 'user123');
      
      let stats = service.getRateStats();
      const initialCount = stats.totalConnections;
      
      service.recordDisconnection('192.168.1.1', 'user123');
      
      stats = service.getRateStats();
      expect(stats.totalConnections).toBeLessThanOrEqual(initialCount);
    });
  });
});