import { Module } from '@nestjs/common';
import { ConfigModule } from '../shared/config/config.module';
import { DatabaseModule } from '../shared/database/database.module';
import { BlocksModule } from '../blocks/blocks.module';
import { SseModule } from '../sse/sse.module';
import { CreateGenesisCommand } from './create-genesis.command';
import { PromoteMasterCommand } from './promote-master.command';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BlocksModule,
    SseModule,
  ],
  providers: [CreateGenesisCommand, PromoteMasterCommand],
})
export class CliModule {}
