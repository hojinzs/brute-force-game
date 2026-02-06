import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MasterAuth } from '../../decorators/auth.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/auth.service';
import { AdminBlocksService } from './admin-blocks.service';

class ForceTransitionDto {
  targetStatus: string;
  hint?: string;
  password?: string;
  reason?: string;
}

@ApiTags('Admin - Blocks')
@Controller('admin/blocks')
@MasterAuth()
export class AdminBlocksController {
  constructor(private readonly adminBlocksService: AdminBlocksService) {}

  @Get()
  async getBlocks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminBlocksService.getBlocks(
      parseInt(page) || 1,
      Math.min(parseInt(limit) || 20, 100),
    );
  }

  @Get(':id')
  async getBlockById(@Param('id') id: string) {
    return this.adminBlocksService.getBlockById(BigInt(id));
  }

  @Post(':id/force-transition')
  async forceTransition(
    @Param('id') id: string,
    @Body() dto: ForceTransitionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminBlocksService.forceTransition(
      BigInt(id),
      dto.targetStatus,
      user.sub,
      { hint: dto.hint, password: dto.password, reason: dto.reason },
    );
  }

  @Post(':id/regenerate-password')
  async regeneratePassword(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminBlocksService.regeneratePassword(BigInt(id), user.sub);
  }
}
