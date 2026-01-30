import { Module, forwardRef } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { BlocksTimeoutService } from './blocks-timeout.service';
import { AiPasswordService } from './ai-password.service';
import { DatabaseModule } from '../shared/database/database.module';
import { PasswordService } from '../shared/services/password.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [DatabaseModule, SseModule],
  controllers: [BlocksController],
  providers: [
    BlocksService,
    BlocksTimeoutService,
    AiPasswordService,
    PasswordService,
    RankingService,
  ],
  exports: [BlocksService],
})
export class BlocksModule {}