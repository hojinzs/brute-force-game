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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto } from './dto/block.dto';

@ApiTags('blocks')
@Controller('blocks')
@UseGuards(ThrottlerGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Public()
  @Get('current')
  @ApiOperation({ summary: 'Get current active block' })
  @ApiResponse({ status: 200, description: 'Current block retrieved successfully' })
  async getCurrentBlock() {
    return this.blocksService.getCurrentBlock();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get block by ID' })
  @ApiResponse({ status: 200, description: 'Block retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  async getBlockById(@Param('id') id: string) {
    return this.blocksService.getBlockById(BigInt(id));
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get block history' })
  @ApiResponse({ status: 200, description: 'Block history retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of blocks to return', type: Number })
  async getBlockHistory(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.blocksService.getBlockHistory(limitNum);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new block' })
  @ApiResponse({ status: 201, description: 'Block created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createBlock(
    @CurrentUser() user: JwtPayload,
    @Body() createBlockDto: CreateBlockDto,
  ) {
    return this.blocksService.createBlock(createBlockDto, user.sub);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
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

  @Public()
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a block' })
  @ApiResponse({ status: 200, description: 'Block processed successfully' })
  @ApiResponse({ status: 404, description: 'Block not found' })
  @ApiParam({ name: 'id', description: 'Block ID' })
  async processBlock(@Param('id') id: string) {
    return this.blocksService.updateBlock(BigInt(id), { status: 'PROCESSING' as any }, '');
  }
}