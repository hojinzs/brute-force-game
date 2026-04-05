import { Module } from '@nestjs/common';
import { AdminBlocksController } from './blocks/admin-blocks.controller';
import { AdminBlocksService } from './blocks/admin-blocks.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminSseController } from './admin-sse.controller';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { SseModule } from '../sse/sse.module';

@Module({
  imports: [AuthModule, BlocksModule, SseModule],
  controllers: [AdminBlocksController, AdminUsersController, AdminSseController],
  providers: [AdminBlocksService, AdminUsersService],
})
export class AdminModule {}
