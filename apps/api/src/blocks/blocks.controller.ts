import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Auth } from '../decorators/auth.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto/block.dto';

@ApiTags('blocks')
@Controller('blocks')
@UseGuards(ThrottlerGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current active block' })
  @ApiResponse({ status: 200, description: 'Current block retrieved successfully' })
  async getCurrentBlock() {
    return this.blocksService.getCurrentBlock();
  }

  @Get()
  @ApiOperation({ summary: 'Get block history' })
  @ApiResponse({ status: 200, description: 'Block history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of blocks per page', type: Number })
  async getBlockHistory(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.max(1, parseInt(limit, 10)) : 20;
    return this.blocksService.getBlockHistory({ page: pageNum, limit: limitNum });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get block by ID' })
  @ApiResponse({ status: 200, description: 'Block retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  async getBlockById(@Param('id') id: string) {
    return this.blocksService.getBlockById(BigInt(id));
  }

  @Put(':id')
  @Auth()
  @ApiOperation({ summary: 'Update a block' })
  @ApiResponse({ status: 200, description: 'Block updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  async updateBlock(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    return this.blocksService.updateBlock(BigInt(id), updateBlockDto, user.sub);
  }

  @Post(':id/hint')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit hint for block as blockMaster' })
  @ApiResponse({ status: 200, description: 'Hint submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the block master' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  async submitHint(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { hint: string },
  ) {
    return this.blocksService.submitHint(BigInt(id), user.sub, body.hint);
  }

}
