import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BlocksModule } from './blocks/blocks.module';
import { AttemptsModule } from './attempts/attempts.module';
import { GameModule } from './game/game.module';
import { SseModule } from './sse/sse.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    BlocksModule,
    AttemptsModule,
    GameModule,
    SseModule,
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute (general)
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ThrottlerGuard,
  ],
})
export class AppModule {}
