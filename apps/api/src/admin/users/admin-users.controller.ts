import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { Auth } from '../../decorators/auth.decorator';
import { MasterOnly } from '../../decorators/master-only.decorator';
import { UpdateUserRoleDto } from './dto/admin-users.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/auth.service';

@ApiTags('admin-users')
@Controller('api/admin/users')
@Auth()
@MasterOnly()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get users list (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.max(1, parseInt(limit, 10)) : 20;
    return this.adminUsersService.listUsers({ page: pageNum, limit: limitNum, role, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user stats (admin)' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  async getStats() {
    return this.adminUsersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user detail (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUser(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update user role (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminUsersService.updateUserRole(id, dto, user.sub);
  }

  @Post(':id/reset-cp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user CP (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User CP reset successfully' })
  async resetCp(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.adminUsersService.resetCp(id, user.sub);
  }
}
