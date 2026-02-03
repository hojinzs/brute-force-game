import { Module } from '@nestjs/common';
import { SseGateway } from './gateway/sse.gateway';
import { SseService } from './sse.service';
import { SseController } from './sse.controller';
import { SseAdminController } from './sse-admin.controller';
import { PresenceService } from '../shared/services/presence.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { SseCleanupService } from '../shared/services/sse-cleanup.service';
import { SseEventFilterService } from '../shared/services/sse-event-filter.service';
import { SseRateLimitService } from '../shared/services/sse-rate-limit.service';

@Module({
  providers: [
    SseGateway, 
    SseService, 
    PresenceService, 
    ConnectionManagerService,
    SseCleanupService,
    SseEventFilterService,
    SseRateLimitService,
  ],
  controllers: [SseController, SseAdminController],
  exports: [
    SseService, 
    PresenceService, 
    ConnectionManagerService,
    SseCleanupService,
    SseEventFilterService,
    SseRateLimitService,
  ],
})
export class SseModule {}