import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AdminSseEvent } from './admin-events.controller';

@Injectable()
export class AdminEventsService {
  private readonly logger = new Logger(AdminEventsService.name);
  private recentEvents: AdminSseEvent[] = [];
  private readonly maxEvents = 100;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('block.statusChanged')
  handleBlockStatusChange(payload: any) {
    const event: AdminSseEvent = {
      type: 'block-status-change',
      data: payload,
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    this.logger.log(`Block status changed: ${JSON.stringify(payload)}`);
  }

  @OnEvent('user.registered')
  handleNewUser(payload: any) {
    const event: AdminSseEvent = {
      type: 'new-user',
      data: payload,
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    this.logger.log(`New user registered: ${payload.userId}`);
  }

  async getLatestEvents(): Promise<AdminSseEvent[]> {
    return this.recentEvents;
  }

  private addEvent(event: AdminSseEvent) {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents = this.recentEvents.slice(0, this.maxEvents);
    }
  }
}
