import { Controller, Get, Param, Res, Query, Req, ForbiddenException, Headers } from '@nestjs/common';
import type { Response, Request } from 'express';
import { SseService } from './sse.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { SseRateLimitService } from '../shared/services/sse-rate-limit.service';
import { SseEventFilterService } from '../shared/services/sse-event-filter.service';
import { PresenceService } from '../shared/services/presence.service';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { setupSseConnection, createEventHandler, getSseHeaders, generateConnectionId, writeConnectedEvent, writeSseEvent } from '../shared/utils/sse.util';

@Controller('api/sse')
export class SseController {
  constructor(
    private readonly sseService: SseService,
    private readonly connectionManager: ConnectionManagerService,
    private readonly rateLimitService: SseRateLimitService,
    private readonly eventFilterService: SseEventFilterService,
    private readonly presenceService: PresenceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('feed')
  async feedSse(
    @Res() res: Response, 
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('anonymous') anonymous?: string,
    @Query('includeSelf') includeSelf?: string,
  ): Promise<void> {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check rate limits (feed-specific logic, kept in controller)
    const rateCheck = this.rateLimitService.checkConnectionLimit(ip, userId);
    if (!rateCheck.allowed) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: rateCheck.reason }));
      return;
    }

    // Check if blocked
    if (this.rateLimitService.isBlocked(ip, userId)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Connection blocked' }));
      return;
    }

    // Validate CORS before creating connection
    const headers = getSseHeaders(req.headers.origin);
    if (!headers) {
      res.status(403).send('Forbidden');
      return;
    }

    // Setup connection
    const connectionId = generateConnectionId('feed');
    this.connectionManager.addConnection(connectionId, 'feed', userId);
    this.rateLimitService.recordConnection(ip, userId);

    // Create user filter asynchronously
    const filter = await this.eventFilterService.createUserFilter(userId, {
      anonymous: anonymous === 'true',
      includeSelf: includeSelf !== 'false',
    });

    // Write headers and connected event
    res.writeHead(200, headers);
    writeConnectedEvent(res, connectionId);

    // Setup heartbeat
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Setup event listeners with filter
    const attemptSubscription = createEventHandler(res, 'attempt', this.eventEmitter, (data) => filter.shouldIncludeEvent(data));
    const presenceSubscription = createEventHandler(res, 'presence', this.eventEmitter, (data) => filter.shouldIncludeEvent(data));

    res.on('close', () => {
      clearInterval(heartbeat);
      attemptSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
      this.connectionManager.removeConnection(connectionId);
      this.rateLimitService.recordDisconnection(ip, userId);
    });
  }

  @Get('rankings')
  rankingsSse(@Res() res: Response, @Req() req: Request, @Query('userId') userId?: string): void {
    const connection = setupSseConnection(res, req, { type: 'rankings' }, this.connectionManager, userId);
    if (!connection) return;

    const subscription = createEventHandler(res, 'ranking', this.eventEmitter);

    res.on('close', () => {
      connection.cleanup();
      subscription.unsubscribe();
    });
  }

  @Get('blocks')
  blocksSse(@Res() res: Response, @Req() req: Request, @Query('userId') userId?: string): void {
    const connection = setupSseConnection(res, req, { type: 'blocks' }, this.connectionManager, userId);
    if (!connection) return;

    const subscription = createEventHandler(res, 'block-status', this.eventEmitter);

    res.on('close', () => {
      connection.cleanup();
      subscription.unsubscribe();
    });
  }

  @Get('presence')
  presenceSse(@Res() res: Response, @Req() req: Request, @Query('userId') userId?: string, @Query('nickname') nickname?: string): void {
    const connection = setupSseConnection(res, req, { type: 'presence' }, this.connectionManager, userId);
    if (!connection) return;

    // Track user presence when they connect
    if (userId && nickname) {
      this.presenceService.userJoined(userId, nickname);
    }

    // Send initial online count immediately after connection
    const initialOnlineCount = this.presenceService.getOnlineUsersCount();
    writeSseEvent(res, 'presence', {
      type: 'presence',
      data: {
        action: 'initial',
        onlineCount: initialOnlineCount,
      },
      timestamp: new Date(),
    });

    const subscription = createEventHandler(res, 'presence', this.eventEmitter);

    res.on('close', () => {
      // Untrack user presence when they disconnect
      if (userId) {
        this.presenceService.userLeft(userId);
      }
      connection.cleanup();
      subscription.unsubscribe();
    });
  }

  @Get('top-attempts')
  topAttemptsSse(@Res() res: Response, @Req() req: Request, @Query('blockId') blockId?: string): void {
    const connection = setupSseConnection(res, req, { type: 'feed' }, this.connectionManager);
    if (!connection) return;

    const subscription = createEventHandler(res, 'top-attempts', this.eventEmitter);

    res.on('close', () => {
      connection.cleanup();
      subscription.unsubscribe();
    });
  }

  @Get('current-block')
  currentBlockSse(@Res() res: Response, @Req() req: Request): void {
    const connection = setupSseConnection(res, req, { type: 'blocks' }, this.connectionManager);
    if (!connection) return;

    const subscription = createEventHandler(res, 'current-block', this.eventEmitter);

    res.on('close', () => {
      connection.cleanup();
      subscription.unsubscribe();
    });
  }

  @Get('stats')
  getConnectionStats(): Observable<any> {
    return interval(5000).pipe(
      map(() => ({
        timestamp: new Date(),
        ...this.connectionManager.getConnectionStats(),
      })),
    );
  }

  @Get('health')
  getHealthCheck() {
    const stats = this.connectionManager.getConnectionStats();
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      sse: {
        activeConnections: stats.total,
        connectionsByType: stats.byType,
        uptime: process.uptime(),
      },
    };
  }
}