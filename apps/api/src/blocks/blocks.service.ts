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
    return await this.prisma.$transaction(async (tx) => {
      const winner = await tx.user.findUnique({
        where: { id: winnerId },
        select: { id: true, isAnonymous: true, nickname: true },
      });

      if (!winner) {
        throw new NotFoundException('Winner not found');
      }

      const updated = await tx.block.updateMany({
        where: { id: blockId, status: 'ACTIVE' },
        data: {
          status: 'SOLVED',
          winnerId,
          solvedAttemptId,
          solvedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Block already solved or not active');
      }

      const currentBlock = await tx.block.findUnique({
        where: { id: blockId },
        select: {
          id: true,
          difficultyConfig: true,
          accumulatedPoints: true,
        },
      });

      if (!currentBlock) {
        throw new NotFoundException('Block not found after update');
      }

      await this.rankingService.updateUserPoints(winnerId, currentBlock.accumulatedPoints);

      const nextDifficulty = this.passwordService.generateNextDifficulty(
        currentBlock.difficultyConfig as any
      );

      const nextBlock = await tx.block.create({
        data: {
          status: 'WAITING_HINT',
          blockMasterId: winnerId,
          previousBlockId: blockId,
          difficultyConfig: nextDifficulty as any,
          accumulatedPoints: BigInt(100),
          waitingStartedAt: new Date(),
          passwordRetryCount: 0,
          seedHint: null,
        },
      });

      this.sseService.emitBlockStatusChange({
        blockId: blockId.toString(),
        status: 'SOLVED',
        winnerId,
        winnerNickname: winner.nickname,
        solvedAt: new Date(),
      });

      this.sseService.emitBlockStatusChange({
        blockId: nextBlock.id.toString(),
        status: 'WAITING_HINT',
        blockMasterId: winnerId,
        waitingStartedAt: new Date(),
      });

      return { solvedBlock: currentBlock, nextBlock, winner };
    });
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

  async submitHint(blockId: bigint, userId: string, hint: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        status: true,
        blockMasterId: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'WAITING_HINT') {
      throw new BadRequestException('Block is not waiting for hint');
    }

    if (block.blockMasterId !== userId) {
      throw new ForbiddenException('Only the block master can submit hint');
    }

    const updatedBlock = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        seedHint: hint,
        status: 'WAITING_PASSWORD',
      },
    });

    this.sseService.emitBlockStatusChange({
      blockId: blockId.toString(),
      status: 'WAITING_PASSWORD',
      blockMasterId: block.blockMasterId,
    });

    return updatedBlock;
  }

  async setSystemHint(blockId: bigint, hint: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'WAITING_HINT') {
      throw new BadRequestException('Block is not waiting for hint');
    }

    const updatedBlock = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        seedHint: hint,
        status: 'WAITING_PASSWORD',
      },
    });

    this.sseService.emitBlockStatusChange({
      blockId: blockId.toString(),
      status: 'WAITING_PASSWORD',
    });

    return updatedBlock;
  }

  async setPassword(blockId: bigint, password: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'WAITING_PASSWORD') {
      throw new BadRequestException('Block is not waiting for password');
    }

    const answerHash = await this.passwordService.hashPassword(password);

    const updatedBlock = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        answerHash,
        answerPlaintext: password,
        status: 'ACTIVE',
      },
    });

    this.sseService.emitBlockStatusChange({
      blockId: blockId.toString(),
      status: 'ACTIVE',
    });

    return updatedBlock;
  }
}