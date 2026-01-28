import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface PooledConnection {
  connection: ConnectionInfo;
  lastUsed: Date;
  isActive: boolean;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  pooledConnections: number;
  memoryUsage: number;
}

export interface ConnectionInfo {
  id: string;
  type: 'feed' | 'rankings' | 'blocks' | 'presence';
  userId?: string;
  nickname?: string;
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class ConnectionManagerService {
  private connections = new Map<string, ConnectionInfo>();
  private connectionPool = new Map<string, PooledConnection>();
  private readonly MAX_POOL_SIZE = 1000;
  private readonly POOL_TTL_MINUTES = 10;
  private cleanupInterval: any;

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Start background pool cleanup
    this.startPoolCleanup();
  }

  addConnection(id: string, type: ConnectionInfo['type'], userId?: string, nickname?: string) {
    const connection: ConnectionInfo = {
      id,
      type,
      userId,
      nickname,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(id, connection);

    // Emit connection event
    this.eventEmitter.emit('connection.established', connection);

    return connection;
  }

  removeConnection(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      this.connections.delete(id);
      this.poolConnection(connection);
      this.eventEmitter.emit('connection.closed', connection);
    }
    return connection;
  }

  private poolConnection(connection: ConnectionInfo) {
    // Only pool if we haven't reached max capacity
    if (this.connectionPool.size < this.MAX_POOL_SIZE) {
      const pooledConnection: PooledConnection = {
        connection,
        lastUsed: new Date(),
        isActive: false,
      };
      this.connectionPool.set(connection.id, pooledConnection);
    }
  }

  private startPoolCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupPool();
    }, this.POOL_TTL_MINUTES * 60 * 1000);
  }

  private cleanupPool() {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.POOL_TTL_MINUTES * 60 * 1000);

    for (const [id, pooled] of this.connectionPool.entries()) {
      if (pooled.lastUsed < cutoffTime) {
        this.connectionPool.delete(id);
      }
    }
  }

  updateActivity(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  getConnection(id: string) {
    return this.connections.get(id);
  }

  getConnectionsByType(type: ConnectionInfo['type']) {
    return Array.from(this.connections.values()).filter(conn => conn.type === type);
  }

  getUserConnections(userId: string) {
    return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
  }

  getAllConnections() {
    return Array.from(this.connections.values());
  }

  getConnectionStats() {
    const byType = {
      feed: 0,
      rankings: 0,
      blocks: 0,
      presence: 0,
    };

    this.connections.forEach(conn => {
      byType[conn.type]++;
    });

    return {
      total: this.connections.size,
      byType,
      pool: this.getPoolStats(),
    };
  }

  getPoolStats(): ConnectionPoolStats {
    const activePooled = Array.from(this.connectionPool.values()).filter(p => p.isActive).length;
    
    return {
      totalConnections: this.connections.size + this.connectionPool.size,
      activeConnections: this.connections.size,
      pooledConnections: this.connectionPool.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    const connectionSize = 200; // Estimated bytes per connection
    const pooledSize = 150; // Slightly smaller for pooled connections
    
    return (this.connections.size * connectionSize) + (this.connectionPool.size * pooledSize);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.connectionPool.clear();
  }

  // Cleanup stale connections (older than 5 minutes with no activity)
  cleanupStaleConnections() {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    const staleConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      const timeSinceActivity = now.getTime() - connection.lastActivity.getTime();
      if (timeSinceActivity > staleThreshold) {
        staleConnections.push(id);
      }
    });

    staleConnections.forEach(id => this.removeConnection(id));

    return staleConnections.length;
  }
}