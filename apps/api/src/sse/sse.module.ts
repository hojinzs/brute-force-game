import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SseGateway } from './gateway/sse.gateway';
import { SseService } from './sse.service';
import { SseController } from './sse.controller';
import { PresenceService } from '../shared/services/presence.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [SseGateway, SseService, PresenceService, ConnectionManagerService],
  controllers: [SseController],
  exports: [SseService, PresenceService, ConnectionManagerService],
})
export class SseModule {}