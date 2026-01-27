import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

  constructor(private readonly eventEmitter: EventEmitter2) {}

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
      this.eventEmitter.emit('connection.closed', connection);
    }
    return connection;
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
    };
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