import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminBlocksService } from './admin-blocks.service';
import { Auth } from '../../decorators/auth.decorator';
import { MasterOnly } from '../../decorators/master-only.decorator';
import { ForceTransitionDto } from './dto/admin-blocks.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/auth.service';

@ApiTags('admin-blocks')
@Controller('api/admin/blocks')
@Auth()
@MasterOnly()
export class AdminBlocksController {
  constructor(private readonly adminBlocksService: AdminBlocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blocks (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Blocks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listBlocks(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.max(1, parseInt(limit, 10)) : 20;
    return this.adminBlocksService.listBlocks({ page: pageNum, limit: limitNum });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get block detail (admin)' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  @ApiResponse({ status: 200, description: 'Block retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async getBlock(@Param('id') id: string) {
    return this.adminBlocksService.getBlockById(BigInt(id));
  }

  @Post(':id/force-transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force block status transition (admin)' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  @ApiResponse({ status: 200, description: 'Block transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async forceTransition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ForceTransitionDto,
  ) {
    return this.adminBlocksService.forceTransition(BigInt(id), dto, user.sub);
  }

  @Post(':id/regenerate-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate block password (admin)' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  @ApiResponse({ status: 200, description: 'Password regenerated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async regeneratePassword(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.adminBlocksService.regeneratePassword(BigInt(id), user.sub);
  }
}
