import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ClientInfo {
  socketId: string;
  userId?: string;
  nickname?: string;
  subscriptions: Set<string>;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/sse',
})
export class SseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SseGateway');
  private clients: Map<string, ClientInfo> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  afterInit(server: Server) {
    this.logger.log('SSE Gateway initialized');
    this.setupEventListeners();
  }

  handleConnection(client: Socket) {
    const clientInfo: ClientInfo = {
      socketId: client.id,
      subscriptions: new Set(),
      connectedAt: new Date(),
    };
    
    this.clients.set(client.id, clientInfo);
    this.logger.log(`Client connected: ${client.id} (${this.clients.size} total)`);
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.clients.get(client.id);
    if (clientInfo) {
      // Emit presence event if user was identified
      if (clientInfo.userId) {
        this.server.emit('presence', {
          userId: clientInfo.userId,
          nickname: clientInfo.nickname,
          action: 'leave',
          onlineCount: this.clients.size - 1,
        });
      }
      
      this.clients.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id} (${this.clients.size} total)`);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channels: string[]; userId?: string; nickname?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) return;

    // Update client info with user details
    if (data.userId) clientInfo.userId = data.userId;
    if (data.nickname) clientInfo.nickname = data.nickname;

    // Subscribe to channels
    data.channels.forEach(channel => {
      clientInfo.subscriptions.add(channel);
      client.join(channel);
    });

    // Join personal channel for user-specific events
    if (data.userId) {
      client.join(`user:${data.userId}`);
      
      // Emit presence event for new user
      this.server.emit('presence', {
        userId: data.userId,
        nickname: data.nickname,
        action: 'join',
        onlineCount: this.clients.size,
      });
    }

    this.logger.log(`Client ${client.id} subscribed to: ${data.channels.join(', ')}`);
    return { success: true, channels: data.channels };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channels: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.clients.get(client.id);
    if (!clientInfo) return;

    data.channels.forEach(channel => {
      clientInfo.subscriptions.delete(channel);
      client.leave(channel);
    });

    this.logger.log(`Client ${client.id} unsubscribed from: ${data.channels.join(', ')}`);
    return { success: true, channels: data.channels };
  }

  // Component-level broadcasting methods
  broadcastToFeed(event: string, data: any) {
    this.server.to('feed').emit(event, data);
  }

  broadcastToRankings(event: string, data: any) {
    this.server.to('rankings').emit(event, data);
  }

  broadcastToBlocks(event: string, data: any) {
    this.server.to('blocks').emit(event, data);
  }

  broadcastToPresence(event: string, data: any) {
    this.server.to('presence').emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.clients.size,
      connectionsByChannel: this.getChannelStats(),
    };
  }

  private getChannelStats() {
    const stats: Record<string, number> = {};
    this.clients.forEach(client => {
      client.subscriptions.forEach(channel => {
        stats[channel] = (stats[channel] || 0) + 1;
      });
    });
    return stats;
  }

  private setupEventListeners() {
    // Listen for SSE events from the service
    this.eventEmitter.on('sse.attempt', (data) => {
      this.broadcastToFeed('attempt', data);
    });

    this.eventEmitter.on('sse.block-status', (data) => {
      this.broadcastToBlocks('block-status', data);
    });

    this.eventEmitter.on('sse.ranking', (data) => {
      this.broadcastToRankings('ranking', data);
    });

    this.eventEmitter.on('sse.presence', (data) => {
      this.broadcastToPresence('presence', data);
    });
  }
}