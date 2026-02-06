import { Module, forwardRef } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { BlocksTimeoutService } from './blocks-timeout.service';
import { AiPasswordService } from './ai-password.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../shared/database/database.module';
import { PasswordService } from '../shared/services/password.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    SseModule,
    ThrottlerModule.forRoot([{
      ttl: 1000, // 1 second
      limit: 2, // 2 requests per second
    }]),
  ],
  controllers: [BlocksController],
  providers: [
    BlocksService,
    BlocksTimeoutService,
    AiPasswordService,
    PasswordService,
    RankingService,
  ],
  exports: [BlocksService, PasswordService],
})
export class BlocksModule {}