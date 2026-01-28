import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { DatabaseModule } from '../shared/database/database.module';
import { PasswordService } from '../shared/services/password.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [DatabaseModule, SseModule],
  controllers: [BlocksController],
  providers: [BlocksService, PasswordService, RankingService],
  exports: [BlocksService],
})
export class BlocksModule {}