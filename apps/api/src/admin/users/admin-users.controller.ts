import { Controller, Get, Put, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MasterAuth } from '../../decorators/auth.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/auth.service';
import { AdminUsersService } from './admin-users.service';

@ApiTags('Admin - Users')
@Controller('admin/users')
@MasterAuth()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get('stats')
  async getUserStats() {
    return this.adminUsersService.getUserStats();
  }

  @Get()
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminUsersService.getUsers(
      parseInt(page) || 1,
      Math.min(parseInt(limit) || 20, 100),
      search,
      role,
    );
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminUsersService.updateUserRole(id, body.role, user.sub);
  }

  @Post(':id/reset-cp')
  async resetUserCp(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminUsersService.resetUserCp(id, user.sub);
  }
}
