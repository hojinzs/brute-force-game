import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { BlocksService } from '../../blocks/blocks.service';
import { PasswordService } from '../../shared/services/password.service';
import { SseService } from '../../sse/sse.service';

@Injectable()
export class AdminBlocksService {
  private readonly logger = new Logger('AdminAction');

  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksService: BlocksService,
    private readonly passwordService: PasswordService,
    private readonly sseService: SseService,
  ) {}

  async getBlocks(page: number, limit: number) {
    const [total, blocks] = await this.prisma.$transaction([
      this.prisma.block.count(),
      this.prisma.block.findMany({
        select: {
          id: true,
          status: true,
          seedHint: true,
          difficultyConfig: true,
          answerPlaintext: true,
          answerHash: true,
          accumulatedPoints: true,
          winnerId: true,
          blockMasterId: true,
          waitingStartedAt: true,
          passwordRetryCount: true,
          previousBlockId: true,
          solvedAttemptId: true,
          createdAt: true,
          solvedAt: true,
          winner: { select: { id: true, nickname: true } },
          blockMaster: { select: { id: true, nickname: true } },
          _count: { select: { attempts: true } },
        },
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      page,
      limit,
      total,
      blocks: blocks.map((block) => ({
        id: Number(block.id),
        status: block.status,
        seedHint: block.seedHint,
        difficultyConfig: block.difficultyConfig,
        answerPlaintext: block.answerPlaintext,
        accumulatedPoints: Number(block.accumulatedPoints),
        winnerId: block.winnerId,
        winner: block.winner,
        blockMasterId: block.blockMasterId,
        blockMaster: block.blockMaster,
        waitingStartedAt: block.waitingStartedAt,
        passwordRetryCount: block.passwordRetryCount,
        previousBlockId: block.previousBlockId ? Number(block.previousBlockId) : null,
        createdAt: block.createdAt,
        solvedAt: block.solvedAt,
        attemptCount: block._count.attempts,
      })),
    };
  }

  async getBlockById(id: bigint) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        winner: { select: { id: true, nickname: true, email: true } },
        blockMaster: { select: { id: true, nickname: true, email: true } },
        _count: { select: { attempts: true } },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    return {
      id: Number(block.id),
      status: block.status,
      seedHint: block.seedHint,
      difficultyConfig: block.difficultyConfig,
      answerPlaintext: block.answerPlaintext,
      answerHash: block.answerHash,
      accumulatedPoints: Number(block.accumulatedPoints),
      winnerId: block.winnerId,
      winner: block.winner,
      blockMasterId: block.blockMasterId,
      blockMaster: block.blockMaster,
      waitingStartedAt: block.waitingStartedAt,
      passwordRetryCount: block.passwordRetryCount,
      previousBlockId: block.previousBlockId ? Number(block.previousBlockId) : null,
      solvedAttemptId: block.solvedAttemptId,
      createdAt: block.createdAt,
      solvedAt: block.solvedAt,
      attemptCount: block._count.attempts,
    };
  }

  async forceTransition(
    blockId: bigint,
    targetStatus: string,
    masterId: string,
    options: { hint?: string; password?: string; reason?: string },
  ) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    const previousStatus = block.status;

    if (targetStatus === 'ACTIVE' && block.status === 'WAITING_HINT') {
      if (!options.hint) {
        throw new BadRequestException('Hint is required when transitioning from WAITING_HINT to ACTIVE');
      }

      // Set hint first, then transition to WAITING_PASSWORD and immediately to ACTIVE
      // We need a password too
      if (!options.password) {
        // Just set the hint to move to WAITING_PASSWORD
        await this.blocksService.setSystemHint(blockId, options.hint);

        this.logAdminAction('FORCE_BLOCK_TRANSITION', masterId, {
          blockId: Number(blockId),
          previousStatus,
          newStatus: 'WAITING_PASSWORD',
          reason: options.reason,
        });

        return { blockId: Number(blockId), previousStatus, newStatus: 'WAITING_PASSWORD' };
      }

      // Set hint then password
      await this.prisma.block.update({
        where: { id: blockId },
        data: { seedHint: options.hint },
      });

      const answerHash = await this.passwordService.hashPassword(options.password);
      const updatedBlock = await this.prisma.block.update({
        where: { id: blockId },
        data: {
          answerHash,
          answerPlaintext: options.password,
          status: 'ACTIVE',
        },
      });

      this.sseService.emitBlockStatusChange({
        blockId: blockId.toString(),
        status: 'ACTIVE',
      });

      this.sseService.emitCurrentBlockUpdate({
        id: updatedBlock.id.toString(),
        status: updatedBlock.status,
        seedHint: updatedBlock.seedHint || '',
        difficultyConfig: updatedBlock.difficultyConfig,
        accumulatedPoints: updatedBlock.accumulatedPoints.toString(),
        attemptCount: 0,
        createdAt: updatedBlock.createdAt,
      });

      this.logAdminAction('FORCE_BLOCK_TRANSITION', masterId, {
        blockId: Number(blockId),
        previousStatus,
        newStatus: 'ACTIVE',
        reason: options.reason,
      });

      return { blockId: Number(blockId), previousStatus, newStatus: 'ACTIVE' };
    }

    if (targetStatus === 'ACTIVE' && block.status === 'WAITING_PASSWORD') {
      if (!options.password) {
        throw new BadRequestException('Password is required when transitioning from WAITING_PASSWORD to ACTIVE');
      }

      await this.blocksService.setPassword(blockId, options.password);

      this.logAdminAction('FORCE_BLOCK_TRANSITION', masterId, {
        blockId: Number(blockId),
        previousStatus,
        newStatus: 'ACTIVE',
        reason: options.reason,
      });

      return { blockId: Number(blockId), previousStatus, newStatus: 'ACTIVE' };
    }

    if (targetStatus === 'SOLVED') {
      if (block.status === 'SOLVED') {
        throw new BadRequestException('Block is already solved');
      }

      // Force solve: mark as solved without a winner, create next block
      const nextDifficulty = this.passwordService.generateNextDifficulty(
        block.difficultyConfig as any,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.block.update({
          where: { id: blockId },
          data: {
            status: 'SOLVED',
            solvedAt: new Date(),
          },
        });

        await tx.block.create({
          data: {
            status: 'WAITING_HINT',
            previousBlockId: blockId,
            difficultyConfig: nextDifficulty as any,
            accumulatedPoints: BigInt(100),
            waitingStartedAt: new Date(),
            passwordRetryCount: 0,
            seedHint: null,
          },
        });
      });

      this.sseService.emitBlockStatusChange({
        blockId: blockId.toString(),
        status: 'SOLVED',
        solvedAt: new Date(),
      });

      this.logAdminAction('FORCE_BLOCK_SOLVED', masterId, {
        blockId: Number(blockId),
        previousStatus,
        reason: options.reason || 'manual skip',
      });

      return { blockId: Number(blockId), previousStatus, newStatus: 'SOLVED' };
    }

    throw new BadRequestException(
      `Invalid transition: ${block.status} -> ${targetStatus}`,
    );
  }

  async regeneratePassword(blockId: bigint, masterId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'WAITING_PASSWORD') {
      throw new BadRequestException('Block is not in WAITING_PASSWORD status');
    }

    // Reset retry count and trigger re-generation
    await this.prisma.block.update({
      where: { id: blockId },
      data: { passwordRetryCount: 0 },
    });

    this.logAdminAction('REGENERATE_PASSWORD', masterId, {
      blockId: Number(blockId),
    });

    return { blockId: Number(blockId), message: 'Password regeneration triggered' };
  }

  private logAdminAction(action: string, actorId: string, details: Record<string, any>) {
    this.logger.log({
      type: 'ADMIN_ACTION',
      action,
      actorId,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}
