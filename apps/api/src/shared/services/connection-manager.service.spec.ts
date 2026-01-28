import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionManagerService } from './connection-manager.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [ConnectionManagerService],
    }).compile();

    service = module.get<ConnectionManagerService>(ConnectionManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    // Cleanup after each test
    service['connections'].clear();
    service['connectionPool'].clear();
  });

  afterEach(async () => {
    // Cleanup intervals
    if (service['cleanupInterval']) {
      clearInterval(service['cleanupInterval']);
    }
    await service.onModuleDestroy();
  });

  describe('addConnection', () => {
    it('should add a new connection', () => {
      const connection = service.addConnection('test-1', 'feed', 'user1', 'TestUser');
      
      expect(connection.id).toBe('test-1');
      expect(connection.type).toBe('feed');
      expect(connection.userId).toBe('user1');
      expect(connection.nickname).toBe('TestUser');
      expect(connection.connectedAt).toBeInstanceOf(Date);
      expect(connection.lastActivity).toBeInstanceOf(Date);
    });

    it('should add connection without user info', () => {
      const connection = service.addConnection('test-2', 'presence');
      
      expect(connection.id).toBe('test-2');
      expect(connection.type).toBe('presence');
      expect(connection.userId).toBeUndefined();
      expect(connection.nickname).toBeUndefined();
    });
  });

  describe('getConnectionStats', () => {
    it('should return correct stats for connections', () => {
      service.addConnection('feed-1', 'feed', 'user1');
      service.addConnection('feed-2', 'feed', 'user2');
      service.addConnection('presence-1', 'presence');
      service.addConnection('rankings-1', 'rankings', 'user3');

      const stats = service.getConnectionStats();

      expect(stats.total).toBe(4);
      expect(stats.byType.feed).toBe(2);
      expect(stats.byType.presence).toBe(1);
      expect(stats.byType.rankings).toBe(1);
      expect(stats.byType.blocks).toBe(0);
      expect(stats.pool).toBeDefined();
    });

    it('should include pool statistics', () => {
      service.addConnection('test-1', 'feed', 'user1');
      
      const stats = service.getConnectionStats();
      const poolStats = stats.pool;
      
      expect(poolStats.totalConnections).toBeGreaterThanOrEqual(1);
      expect(poolStats.activeConnections).toBe(1);
      expect(poolStats.pooledConnections).toBeGreaterThanOrEqual(0);
      expect(poolStats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('removeConnection', () => {
    it('should remove connection and return it', () => {
      const connection = service.addConnection('test-1', 'feed', 'user1');
      const removed = service.removeConnection('test-1');

      expect(removed).toEqual(connection);
      expect(service.getConnection('test-1')).toBeUndefined();
    });

    it('return undefined for non-existent connection', () => {
      const removed = service.removeConnection('non-existent');
      expect(removed).toBeUndefined();
    });
  });

  describe('cleanupStaleConnections', () => {
    it('should remove old connections based on lastActivity', () => {
      // Add some connections
      service.addConnection('old-1', 'feed', 'user1');
      service.addConnection('old-2', 'presence', 'user2');

      // Manually set old lastActivity (6 minutes ago)
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      const oldConnection1 = service.getConnection('old-1');
      const oldConnection2 = service.getConnection('old-2');
      
      if (oldConnection1) oldConnection1.lastActivity = sixMinutesAgo;
      if (oldConnection2) oldConnection2.lastActivity = sixMinutesAgo;

      // Add a fresh connection
      service.addConnection('fresh-1', 'feed', 'user3');

      const cleanedCount = service.cleanupStaleConnections();

      expect(cleanedCount).toBe(2);
      expect(service.getConnection('old-1')).toBeUndefined();
      expect(service.getConnection('old-2')).toBeUndefined();
      expect(service.getConnection('fresh-1')).toBeDefined();
    });

    it('should pool removed connections', () => {
      const connection = service.addConnection('test-1', 'feed', 'user1');
      service.removeConnection('test-1');

      // Check if connection was pooled
      const pooledConnections = service['connectionPool'];
      expect(pooledConnections.has('test-1')).toBe(true);
      
      const pooled = pooledConnections.get('test-1');
      if (pooled) {
        expect(pooled.connection).toEqual(connection);
        expect(pooled.isActive).toBe(false);
        expect(pooled.lastUsed).toBeInstanceOf(Date);
      }
    });
  });

  describe('getUserConnections', () => {
    it('should return connections for specific user', () => {
      service.addConnection('conn-1', 'feed', 'user1');
      service.addConnection('conn-2', 'rankings', 'user1');
      service.addConnection('conn-3', 'feed', 'user2');

      const user1Connections = service.getUserConnections('user1');
      const user2Connections = service.getUserConnections('user2');

      expect(user1Connections).toHaveLength(2);
      expect(user2Connections).toHaveLength(1);
      expect(user1Connections.map(conn => conn.id)).toContain('conn-1');
      expect(user1Connections.map(conn => conn.id)).toContain('conn-2');
      expect(user2Connections[0].id).toBe('conn-3');
    });
  });

  describe('getConnectionsByType', () => {
    it('should return connections by type', () => {
      service.addConnection('feed-1', 'feed');
      service.addConnection('feed-2', 'feed');
      service.addConnection('presence-1', 'presence');
      service.addConnection('rankings-1', 'rankings');

      const feedConnections = service.getConnectionsByType('feed');
      const presenceConnections = service.getConnectionsByType('presence');

      expect(feedConnections).toHaveLength(2);
      expect(presenceConnections).toHaveLength(1);
      expect(feedConnections.every(conn => conn.type === 'feed')).toBe(true);
    });
  });
});