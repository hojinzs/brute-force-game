import { Test, TestingModule } from '@nestjs/testing';
import { SseModule } from '../sse/sse.module';
import { SseService } from './sse.service';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { SseRateLimitService } from '../shared/services/sse-rate-limit.service';
import { SseEventFilterService } from '../shared/services/sse-event-filter.service';
import { PresenceService } from '../shared/services/presence.service';
import { SseCleanupService } from '../shared/services/sse-cleanup.service';

describe('SSE Module Integration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [SseModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should load SSE module successfully', () => {
    expect(module).toBeDefined();
  });

  it('should have SSE service available', () => {
    const sseService = module.get<SseService>(SseService);
    expect(sseService).toBeDefined();
  });

  it('should have connection manager available', () => {
    const connectionManager = module.get<ConnectionManagerService>(ConnectionManagerService);
    expect(connectionManager).toBeDefined();
  });

  it('should have rate limiting service available', () => {
    const rateLimitService = module.get<SseRateLimitService>(SseRateLimitService);
    expect(rateLimitService).toBeDefined();
  });

  it('should have event filter service available', () => {
    const eventFilterService = module.get<SseEventFilterService>(SseEventFilterService);
    expect(eventFilterService).toBeDefined();
  });

  it('should have presence service available', () => {
    const presenceService = module.get<PresenceService>(PresenceService);
    expect(presenceService).toBeDefined();
  });

  it('should have cleanup service available', () => {
    const cleanupService = module.get<SseCleanupService>(SseCleanupService);
    expect(cleanupService).toBeDefined();
  });
});