import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { DatabaseModule } from '../shared/database/database.module';
import { PasswordService } from '../shared/services/password.service';
import { CpService } from '../shared/services/cp.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [DatabaseModule, SseModule],
  controllers: [GameController],
  providers: [GameService, PasswordService, CpService, RankingService],
  exports: [GameService],
})
export class GameModule {}