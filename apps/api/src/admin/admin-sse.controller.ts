import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MasterAuth } from '../decorators/auth.decorator';
import { SseEventData } from '../sse/sse.service';

@ApiTags('Admin - SSE')
@Controller('admin/events')
@MasterAuth()
export class AdminSseController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Get()
  async adminEvents(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Admin SSE connected' })}\n\n`);

    // Listen to block status changes
    const blockStatusHandler = (data: SseEventData) => {
      res.write(`event: block-status\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Listen to new user registrations
    const userRegisteredHandler = (data: any) => {
      res.write(`event: user-registered\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Listen to presence updates
    const presenceHandler = (data: SseEventData) => {
      res.write(`event: presence\ndata: ${JSON.stringify(data)}\n\n`);
    };

    this.eventEmitter.on('sse.block-status', blockStatusHandler);
    this.eventEmitter.on('user.registered', userRegisteredHandler);
    this.eventEmitter.on('sse.presence', presenceHandler);

    // Heartbeat
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      this.eventEmitter.off('sse.block-status', blockStatusHandler);
      this.eventEmitter.off('user.registered', userRegisteredHandler);
      this.eventEmitter.off('sse.presence', presenceHandler);
    });
  }
}
