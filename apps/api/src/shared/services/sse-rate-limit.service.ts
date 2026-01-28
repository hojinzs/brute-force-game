import { Injectable } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { interval, firstValueFrom } from 'rxjs';

export interface ConnectionRateInfo {
  ip: string;
  userId?: string;
  connectionCount: number;
  connectionTimestamps: Date[];
  lastConnectionTime: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
}

@Injectable()
export class SseRateLimitService {
  private connectionData = new Map<string, ConnectionRateInfo>();
  private readonly MAX_CONNECTIONS_PER_IP = 10;
  private readonly MAX_CONNECTIONS_PER_USER = 5;
  private readonly BLOCK_DURATION_MINUTES = 15;
  private readonly WINDOW_MINUTES = 1;
  private readonly CLEANUP_INTERVAL_MINUTES = 1;
  private cleanupInterval: any;

  constructor() {
    // Start background cleanup process
    this.startBackgroundCleanup();
  }

  checkConnectionLimit(ip: string, userId?: string): { allowed: boolean; reason?: string } {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.WINDOW_MINUTES * 60 * 1000);

    // Check IP-based limit using connection timestamps for accuracy
    const ipKey = `ip:${ip}`;
    const ipConnection = this.connectionData.get(ipKey);
    
    if (ipConnection) {
      const recentConnections = ipConnection.connectionTimestamps.filter(
        timestamp => timestamp > windowStart
      );
      
      if (recentConnections.length >= this.MAX_CONNECTIONS_PER_IP) {
        return { allowed: false, reason: 'Too many connections from IP' };
      }
    }

    // Check user-based limit
    if (userId) {
      const userKey = `user:${userId}`;
      const userConnection = this.connectionData.get(userKey);
      
      if (userConnection) {
        const recentConnections = userConnection.connectionTimestamps.filter(
          timestamp => timestamp > windowStart
        );
        
        if (recentConnections.length >= this.MAX_CONNECTIONS_PER_USER) {
          return { allowed: false, reason: 'Too many connections for user' };
        }
      }
    }

    return { allowed: true };
  }

  recordConnection(ip: string, userId?: string): void {
    const now = new Date();

    // Always record IP-based connection for IP limit enforcement
    const ipKey = `ip:${ip}`;
    const ipExisting = this.connectionData.get(ipKey);
    if (ipExisting) {
      ipExisting.connectionCount++;
      ipExisting.connectionTimestamps.push(now);
      ipExisting.lastConnectionTime = now;
    } else {
      this.connectionData.set(ipKey, {
        ip,
        userId: undefined, // IP entries don't have userId
        connectionCount: 1,
        connectionTimestamps: [now],
        lastConnectionTime: now,
        isBlocked: false,
      });
    }

    // Also record user-based connection if userId is provided
    if (userId) {
      const userKey = `user:${userId}`;
      const userExisting = this.connectionData.get(userKey);
      if (userExisting) {
        userExisting.connectionCount++;
        userExisting.connectionTimestamps.push(now);
        userExisting.lastConnectionTime = now;
      } else {
        this.connectionData.set(userKey, {
          ip,
          userId,
          connectionCount: 1,
          connectionTimestamps: [now],
          lastConnectionTime: now,
          isBlocked: false,
        });
      }
    }

    // Cleanup is now handled by background process
  }

  recordDisconnection(ip: string, userId?: string): void {
    // Always handle IP-based disconnection
    const ipKey = `ip:${ip}`;
    const ipConnection = this.connectionData.get(ipKey);
    
    if (ipConnection && ipConnection.connectionCount > 1) {
      ipConnection.connectionCount--;
    } else {
      this.connectionData.delete(ipKey);
    }

    // Also handle user-based disconnection if userId is provided
    if (userId) {
      const userKey = `user:${userId}`;
      const userConnection = this.connectionData.get(userKey);
      
      if (userConnection && userConnection.connectionCount > 1) {
        userConnection.connectionCount--;
      } else {
        this.connectionData.delete(userKey);
      }
    }
  }

  isBlocked(ip: string, userId?: string): boolean {
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const connection = this.connectionData.get(key);
    
    if (!connection || !connection.isBlocked) {
      return false;
    }

    // Check if block has expired
    if (connection.blockedUntil && connection.blockedUntil < new Date()) {
      connection.isBlocked = false;
      connection.blockedUntil = undefined;
      return false;
    }

    return true;
  }

  blockConnection(ip: string, reason: string, userId?: string): void {
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const connection = this.connectionData.get(key);
    
    if (connection) {
      connection.isBlocked = true;
      connection.blockedUntil = new Date(
        Date.now() + this.BLOCK_DURATION_MINUTES * 60 * 1000
      );
      
      console.warn(`🚫 SSE connection blocked: ${reason}`, {
        ip,
        userId,
        blockedUntil: connection.blockedUntil,
      });
    }
  }

  getRateStats() {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.WINDOW_MINUTES * 60 * 1000);

    const activeConnections = this.filterConnections(conn =>
      conn.lastConnectionTime > windowStart
    );

    const blockedConnections = activeConnections.filter(conn => conn.isBlocked);

    return {
      totalConnections: activeConnections.length,
      blockedConnections: blockedConnections.length,
      uniqueIPs: new Set(activeConnections.map(conn => conn.ip)).size,
      uniqueUsers: new Set(
        activeConnections
          .filter(conn => conn.userId)
          .map(conn => conn.userId)
      ).size,
      limits: {
        maxPerIP: this.MAX_CONNECTIONS_PER_IP,
        maxPerUser: this.MAX_CONNECTIONS_PER_USER,
        windowMinutes: this.WINDOW_MINUTES,
        blockDurationMinutes: this.BLOCK_DURATION_MINUTES,
      },
    };
  }

  private startBackgroundCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performAsyncCleanup();
    }, this.CLEANUP_INTERVAL_MINUTES * 60 * 1000);
  }

  private async performAsyncCleanup() {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes

    // Process cleanup asynchronously to prevent blocking
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        for (const [key, connection] of this.connectionData.entries()) {
          if (connection.lastConnectionTime < cutoffTime) {
            this.connectionData.delete(key);
          } else {
            // Clean old timestamps within the window
            connection.connectionTimestamps = connection.connectionTimestamps.filter(
              timestamp => timestamp > cutoffTime
            );
          }
        }
        resolve();
      });
    });
  }

  private cleanupOldConnections() {
    // Legacy method - now handled by background process
    this.performAsyncCleanup();
  }

  // Cleanup method for service shutdown
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private filterConnections(filterFn: (conn: ConnectionRateInfo) => boolean): ConnectionRateInfo[] {
    return Array.from(this.connectionData.values()).filter(filterFn);
  }
}