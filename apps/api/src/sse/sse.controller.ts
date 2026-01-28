import { Controller, Get, Param, Res, Query, Req, ForbiddenException, Headers } from '@nestjs/common';
import type { Response, Request } from 'express';
import { SseService } from './sse.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { SseRateLimitService } from '../shared/services/sse-rate-limit.service';
import { SseEventFilterService } from '../shared/services/sse-event-filter.service';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('api/sse')
export class SseController {
  constructor(
    private readonly sseService: SseService,
    private readonly connectionManager: ConnectionManagerService,
    private readonly rateLimitService: SseRateLimitService,
    private readonly eventFilterService: SseEventFilterService,
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
    
    // Check rate limits
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

    const connectionId = `feed_${Date.now()}_${Math.random()}`;
    this.connectionManager.addConnection(connectionId, 'feed', userId);
    this.rateLimitService.recordConnection(ip, userId);

    // Create user filter asynchronously
    const filter = await this.eventFilterService.createUserFilter(userId, {
      anonymous: anonymous === 'true',
      includeSelf: includeSelf !== 'false',
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date() })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Setup event listeners for this connection
    const eventListeners: Array<{ event: string; handler: (data: any) => void }> = [
      {
        event: 'sse.attempt',
        handler: (data) => {
          if (filter.shouldIncludeEvent(data)) {
            res.write(`event: attempt\ndata: ${JSON.stringify(data)}\n\n`);
          }
        },
      },
      {
        event: 'sse.presence',
        handler: (data) => {
          if (filter.shouldIncludeEvent(data)) {
            res.write(`event: presence\ndata: ${JSON.stringify(data)}\n\n`);
          }
        },
      },
    ];

    // Register event listeners
    eventListeners.forEach(({ event, handler }) => {
      this.eventEmitter.on(event, handler);
    });

    res.on('close', () => {
      clearInterval(heartbeat);
      
      // Unregister event listeners
      eventListeners.forEach(({ event, handler }) => {
        this.eventEmitter.off(event, handler);
      });
      
      this.connectionManager.removeConnection(connectionId);
      this.rateLimitService.recordDisconnection(ip, userId);
    });
  }

  @Get('rankings')
  rankingsSse(@Res() res: Response, @Query('userId') userId?: string): void {
    const connectionId = `rankings_${Date.now()}_${Math.random()}`;
    
    this.connectionManager.addConnection(connectionId, 'rankings', userId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date() })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Setup event listener for ranking updates
    const rankingHandler = (data: any) => {
      res.write(`event: ranking\ndata: ${JSON.stringify(data)}\n\n`);
    };
    this.eventEmitter.on('sse.ranking', rankingHandler);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.eventEmitter.off('sse.ranking', rankingHandler);
      this.connectionManager.removeConnection(connectionId);
    });
  }

  @Get('blocks')
  blocksSse(@Res() res: Response, @Query('userId') userId?: string): void {
    const connectionId = `blocks_${Date.now()}_${Math.random()}`;
    
    this.connectionManager.addConnection(connectionId, 'blocks', userId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date() })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Setup event listener for block status updates
    const blockStatusHandler = (data: any) => {
      res.write(`event: block-status\ndata: ${JSON.stringify(data)}\n\n`);
    };
    this.eventEmitter.on('sse.block-status', blockStatusHandler);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.eventEmitter.off('sse.block-status', blockStatusHandler);
      this.connectionManager.removeConnection(connectionId);
    });
  }

  @Get('presence')
  presenceSse(@Res() res: Response, @Query('userId') userId?: string): void {
    const connectionId = `presence_${Date.now()}_${Math.random()}`;
    
    this.connectionManager.addConnection(connectionId, 'presence', userId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date() })}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Setup event listener for presence updates
    const presenceHandler = (data: any) => {
      res.write(`event: presence\ndata: ${JSON.stringify(data)}\n\n`);
    };
    this.eventEmitter.on('sse.presence', presenceHandler);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.eventEmitter.off('sse.presence', presenceHandler);
      this.connectionManager.removeConnection(connectionId);
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