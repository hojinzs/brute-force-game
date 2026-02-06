import { Controller, Get, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable, interval, map, switchMap } from 'rxjs';
import { Auth } from '../../decorators/auth.decorator';
import { MasterOnly } from '../../decorators/master-only.decorator';
import { AdminEventsService } from './admin-events.service';

export interface AdminSseEvent {
  type: 'block-status-change' | 'new-user' | 'heartbeat';
  data: any;
  timestamp: string;
}

@ApiTags('admin-events')
@Controller('api/admin/events')
@Auth()
@MasterOnly()
export class AdminEventsController {
  constructor(private readonly adminEventsService: AdminEventsService) {}

  @Get()
  @Sse()
  @ApiOperation({ summary: 'Subscribe to admin events (SSE)' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - MASTER role required' })
  streamEvents(): Observable<MessageEvent> {
    return interval(30000).pipe(
      switchMap(() => this.adminEventsService.getLatestEvents()),
      map((events) => ({ data: events })),
    ) as Observable<MessageEvent>;
  }
}
