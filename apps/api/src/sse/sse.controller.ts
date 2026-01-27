import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { SseService } from './sse.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('api/sse')
export class SseController {
  constructor(
    private readonly sseService: SseService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  @Get('feed')
  feedSse(@Res() res: Response, @Query('userId') userId?: string): void {
    const connectionId = `feed_${Date.now()}_${Math.random()}`;
    
    this.connectionManager.addConnection(connectionId, 'feed', userId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date() })}\n\n`);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      this.connectionManager.updateActivity(connectionId);
    }, 30000);

    // Cleanup on connection close
    res.on('close', () => {
      clearInterval(heartbeat);
      this.connectionManager.removeConnection(connectionId);
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

    res.on('close', () => {
      clearInterval(heartbeat);
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

    res.on('close', () => {
      clearInterval(heartbeat);
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

    res.on('close', () => {
      clearInterval(heartbeat);
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