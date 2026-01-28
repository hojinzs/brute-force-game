import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { DatabaseModule } from '../shared/database/database.module';
import { CpService } from '../shared/services/cp.service';
import { PasswordService } from '../shared/services/password.service';
import { BlocksModule } from '../blocks/blocks.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [DatabaseModule, BlocksModule, SseModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, CpService, PasswordService],
  exports: [AttemptsService],
})
export class AttemptsModule {}