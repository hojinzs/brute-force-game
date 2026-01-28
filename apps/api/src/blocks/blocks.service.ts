import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/database/prisma.service';
import { PasswordService } from '../shared/services/password.service';
import { RankingService } from '../shared/services/ranking.service';
import { SseService } from '../sse/sse.service';
import { CreateBlockDto, UpdateBlockDto } from './dto/block.dto';
import { DifficultyConfig } from '../shared/utils/types';

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly rankingService: RankingService,
    private readonly sseService: SseService,
  ) {}

  async createBlock(createBlockDto: CreateBlockDto, userId?: string) {
    // Get the last block to determine difficulty
    const lastBlock = await this.prisma.block.findFirst({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        difficultyConfig: true,
        status: true,
        winnerId: true,
      },
    });

    // Check if user can create a new block (must be winner of previous block or genesis block)
    if (lastBlock && lastBlock.status === 'ACTIVE') {
      throw new BadRequestException('Current block is still active');
    }

    if (lastBlock && lastBlock.status === 'SOLVED' && lastBlock.winnerId !== userId) {
      throw new ForbiddenException('Only the winner of the previous block can create a new block');
    }

    // Generate difficulty
    let difficulty: DifficultyConfig;
    if (createBlockDto.charset && createBlockDto.length) {
      difficulty = {
        length: createBlockDto.length,
        charset: createBlockDto.charset,
      };
    } else {
      difficulty = this.passwordService.generateNextDifficulty(
        lastBlock?.difficultyConfig as any,
      );
    }

    // Generate password and hash
    const password = this.passwordService.generatePassword(difficulty);
    const answerHash = await this.passwordService.hashPassword(password);
    const hint = createBlockDto.seedHint || this.passwordService.generateHint(difficulty);

    // Create block
    const block = await this.prisma.block.create({
      data: {
        status: 'ACTIVE',
        seedHint: hint,
        difficultyConfig: difficulty as any,
        answerHash,
        answerPlaintext: password, // Store plaintext for admin purposes
        previousBlockId: lastBlock?.id,
        accumulatedPoints: BigInt(100), // Starting prize pool
      },
    });

    // Emit block status change event for new block
    this.sseService.emitBlockStatusChange({
      blockId: block.id.toString(),
      status: 'ACTIVE',
    });

    return {
      id: block.id,
      status: block.status,
      seedHint: block.seedHint,
      difficultyConfig: block.difficultyConfig,
      accumulatedPoints: block.accumulatedPoints,
      previousBlockId: block.previousBlockId,
      createdAt: block.createdAt,
    };
  }

  async getCurrentBlock() {
    const block = await this.prisma.block.findFirst({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        status: true,
        seedHint: true,
        difficultyConfig: true,
        accumulatedPoints: true,
        previousBlockId: true,
        createdAt: true,
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('No active block found');
    }

    return {
      ...block,
      attemptCount: block._count.attempts,
    };
  }

  async getBlockById(id: bigint) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        winner: {
          select: {
            id: true,
            nickname: true,
            isAnonymous: true,
          },
        },
        previousBlock: {
          select: {
            id: true,
            status: true,
            seedHint: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    // Don't expose answer plaintext
    const { answerPlaintext, ...blockData } = block;

    return {
      ...blockData,
      attemptCount: block._count.attempts,
    };
  }

  async getBlockHistory(limit: number = 10) {
    const blocks = await this.prisma.block.findMany({
      where: { status: 'SOLVED' },
      include: {
        winner: {
          select: {
            id: true,
            nickname: true,
            isAnonymous: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { solvedAt: 'desc' },
      take: limit,
    });

    return blocks.map(block => ({
      id: block.id,
      status: block.status,
      seedHint: block.seedHint,
      difficultyConfig: block.difficultyConfig,
      accumulatedPoints: block.accumulatedPoints,
      winner: block.winner,
      solvedAt: block.solvedAt,
      attemptCount: block._count.attempts,
    }));
  }

  async updateBlock(id: bigint, updateBlockDto: UpdateBlockDto, userId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot update a non-active block');
    }

    // Only allow status updates for processing/solved states
    const updateData: any = {};
    if (updateBlockDto.status) {
      updateData.status = updateBlockDto.status;
    }

    const updatedBlock = await this.prisma.block.update({
      where: { id },
      data: updateData,
    });

    return updatedBlock;
  }

  async markBlockAsSolved(blockId: bigint, winnerId: string, solvedAttemptId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: {
        winner: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'ACTIVE') {
      throw new BadRequestException('Block is not active');
    }

    // Update block with winner info
    const updatedBlock = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        status: 'SOLVED',
        winnerId,
        solvedAttemptId,
        solvedAt: new Date(),
      },
      include: {
        winner: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Award points to winner
    await this.rankingService.updateUserPoints(winnerId, block.accumulatedPoints);

    // Emit block status change event
    this.sseService.emitBlockStatusChange({
      blockId: blockId.toString(),
      status: 'SOLVED',
      winnerId,
      winnerNickname: updatedBlock.winner?.nickname,
      solvedAt: updatedBlock.solvedAt || new Date(),
    });

    return updatedBlock;
  }

  async incrementBlockPoints(blockId: bigint, points: bigint = BigInt(10)) {
    await this.prisma.block.update({
      where: { id: blockId },
      data: {
        accumulatedPoints: {
          increment: points,
        },
      },
    });
  }
}