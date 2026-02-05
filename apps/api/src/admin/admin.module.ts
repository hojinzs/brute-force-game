import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../shared/database/database.module';
import { BlocksModule } from '../blocks/blocks.module';
import { UsersModule } from '../users/users.module';
import { SseModule } from '../sse/sse.module';
import { AdminBlocksController } from './blocks/admin-blocks.controller';
import { AdminBlocksService } from './blocks/admin-blocks.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [AuthModule, DatabaseModule, BlocksModule, UsersModule, SseModule],
  controllers: [AdminBlocksController, AdminUsersController],
  providers: [AdminBlocksService, AdminUsersService],
})
export class AdminModule {}
