import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { PasswordService } from '../../shared/services/password.service';
import { SseService } from '../../sse/sse.service';
import { ForceTransitionDto } from './dto/admin-blocks.dto';

@Injectable()
export class AdminBlocksService {
  private readonly logger = new Logger('AdminAudit');

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sseService: SseService,
  ) {}

  async listBlocks({ page, limit }: { page: number; limit: number }) {
    const [total, blocks] = await this.prisma.$transaction([
      this.prisma.block.count(),
      this.prisma.block.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          seedHint: true,
          answerPlaintext: true,
          answerHash: true,
          accumulatedPoints: true,
          createdAt: true,
          solvedAt: true,
          waitingStartedAt: true,
          winner: {
            select: {
              id: true,
              nickname: true,
              isAnonymous: true,
            },
          },
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      blocks: blocks.map((block) => ({
        ...block,
        id: Number(block.id),
        accumulatedPoints: Number(block.accumulatedPoints),
      })),
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
        blockMaster: {
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

    return {
      ...block,
      id: Number(block.id),
      previousBlockId: block.previousBlockId ? Number(block.previousBlockId) : null,
      accumulatedPoints: Number(block.accumulatedPoints),
      attemptCount: block._count.attempts,
    };
  }

  async forceTransition(blockId: bigint, dto: ForceTransitionDto, actorId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        status: true,
        difficultyConfig: true,
        blockMasterId: true,
        seedHint: true,
        accumulatedPoints: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (dto.targetStatus === 'ACTIVE') {
      return this.forceActivate(block, dto, actorId);
    }

    if (dto.targetStatus === 'SOLVED') {
      return this.forceSolve(blockId, block, dto.reason, actorId);
    }

    throw new BadRequestException('Unsupported target status');
  }

  async regeneratePassword(blockId: bigint, actorId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        status: true,
        difficultyConfig: true,
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.status !== 'WAITING_PASSWORD') {
      throw new BadRequestException('Block is not waiting for password');
    }

    const password = this.passwordService.generatePassword(block.difficultyConfig as any);
    const answerHash = await this.passwordService.hashPassword(password);

    const updated = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        answerHash,
        answerPlaintext: password,
        passwordRetryCount: { increment: 1 },
      },
      select: {
        id: true,
        status: true,
        seedHint: true,
        difficultyConfig: true,
        accumulatedPoints: true,
        createdAt: true,
      },
    });

    this.logger.log({
      type: 'ADMIN_ACTION',
      action: 'REGENERATE_PASSWORD',
      actorId,
      targetBlockId: blockId.toString(),
      timestamp: new Date().toISOString(),
    });

    return {
      ...updated,
      id: Number(updated.id),
      accumulatedPoints: Number(updated.accumulatedPoints),
    };
  }

  private async forceActivate(
    block: {
      id: bigint;
      status: string;
      difficultyConfig: unknown;
      blockMasterId: string | null;
      seedHint: string | null;
      accumulatedPoints: bigint;
    },
    dto: ForceTransitionDto,
    actorId: string,
  ) {
    if (block.status === 'WAITING_HINT') {
      if (!dto.hint) {
        throw new BadRequestException('Hint is required for WAITING_HINT transition');
      }

      const password = dto.password
        ? dto.password
        : this.passwordService.generatePassword(block.difficultyConfig as any);
      const answerHash = await this.passwordService.hashPassword(password);

      const updated = await this.prisma.block.update({
        where: { id: block.id },
        data: {
          seedHint: dto.hint,
          answerHash,
          answerPlaintext: password,
          status: 'ACTIVE',
          waitingStartedAt: null,
        },
      });

      this.emitActiveUpdate(updated);
      this.logAction('FORCE_TRANSITION', actorId, block.id, block.status, 'ACTIVE', dto.reason);

      return { id: Number(updated.id), status: updated.status };
    }

    if (block.status === 'WAITING_PASSWORD') {
      if (!dto.password) {
        throw new BadRequestException('Password is required for WAITING_PASSWORD transition');
      }

      const answerHash = await this.passwordService.hashPassword(dto.password);
      const updated = await this.prisma.block.update({
        where: { id: block.id },
        data: {
          answerHash,
          answerPlaintext: dto.password,
          status: 'ACTIVE',
          waitingStartedAt: null,
        },
      });

      this.emitActiveUpdate(updated);
      this.logAction('FORCE_TRANSITION', actorId, block.id, block.status, 'ACTIVE', dto.reason);

      return { id: Number(updated.id), status: updated.status };
    }

    throw new BadRequestException('Block is not in a waiting state');
  }

  private async forceSolve(
    blockId: bigint,
    block: {
      status: string;
      difficultyConfig: unknown;
    },
    reason: string,
    actorId: string,
  ) {
    if (block.status === 'SOLVED') {
      throw new BadRequestException('Block is already solved');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.block.update({
        where: { id: blockId },
        data: {
          status: 'SOLVED',
          winnerId: null,
          solvedAttemptId: null,
          solvedAt: new Date(),
        },
      });

      const nextDifficulty = this.passwordService.generateNextDifficulty(
        block.difficultyConfig as any,
      );

      const nextBlock = await tx.block.create({
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

      this.sseService.emitBlockStatusChange({
        blockId: blockId.toString(),
        status: 'SOLVED',
        solvedAt: new Date(),
      });

      this.sseService.emitBlockStatusChange({
        blockId: nextBlock.id.toString(),
        status: 'WAITING_HINT',
        waitingStartedAt: nextBlock.waitingStartedAt || undefined,
      });

      this.logAction('FORCE_SOLVE', actorId, blockId, block.status, 'SOLVED', reason);

      return {
        solvedBlockId: Number(updated.id),
        nextBlockId: Number(nextBlock.id),
      };
    });
  }

  private emitActiveUpdate(block: { id: bigint; status: string }) {
    this.sseService.emitBlockStatusChange({
      blockId: block.id.toString(),
      status: 'ACTIVE',
    });
  }

  private logAction(
    action: string,
    actorId: string,
    targetBlockId: bigint,
    previousStatus: string,
    newStatus: string,
    reason: string,
  ) {
    this.logger.log({
      type: 'ADMIN_ACTION',
      action,
      actorId,
      targetBlockId: targetBlockId.toString(),
      previousStatus,
      newStatus,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}
