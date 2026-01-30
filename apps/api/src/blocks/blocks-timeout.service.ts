import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../shared/database/prisma.service';
import { BlocksService } from './blocks.service';
import { PasswordService } from '../shared/services/password.service';
import { AiPasswordService } from './ai-password.service';

@Injectable()
export class BlocksTimeoutService {
  private readonly logger = new Logger(BlocksTimeoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksService: BlocksService,
    private readonly passwordService: PasswordService,
    private readonly aiPasswordService: AiPasswordService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleTimeouts() {
    await this.handleHintTimeout();
    await this.handlePendingPasswordGeneration();
    await this.handlePasswordRetryFallback();
  }

  async handlePendingPasswordGeneration() {
    const pendingBlocks = await this.prisma.block.findMany({
      where: {
        status: 'WAITING_PASSWORD',
        passwordRetryCount: {
          lt: 5,
        },
      },
      select: {
        id: true,
      },
    });

    for (const block of pendingBlocks) {
      try {
        await this.aiPasswordService.attemptPasswordGeneration(block.id);
      } catch (error) {
        this.logger.error(
          `Error in AI password generation for block ${block.id}:`,
          error
        );
      }
    }
  }

  async handleHintTimeout() {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const timedOutBlocks = await this.prisma.block.findMany({
      where: {
        status: 'WAITING_HINT',
        waitingStartedAt: {
          lte: threeMinutesAgo,
        },
      },
      select: {
        id: true,
        difficultyConfig: true,
      },
    });

    for (const block of timedOutBlocks) {
      try {
        const defaultHint = this.passwordService.generateHint(
          block.difficultyConfig as any
        );
        await this.blocksService.setSystemHint(block.id, defaultHint);
        this.logger.log(`Set default hint for block ${block.id} after timeout`);
      } catch (error) {
        this.logger.error(
          `Failed to set default hint for block ${block.id}:`,
          error
        );
      }
    }
  }

  async handlePasswordRetryFallback() {
    const blocksAtRetryLimit = await this.prisma.block.findMany({
      where: {
        status: 'WAITING_PASSWORD',
        passwordRetryCount: {
          gte: 5,
        },
      },
      select: {
        id: true,
        difficultyConfig: true,
      },
    });

    for (const block of blocksAtRetryLimit) {
      try {
        const randomPassword = this.passwordService.generatePassword(
          block.difficultyConfig as any
        );
        await this.blocksService.setPassword(block.id, randomPassword);
        this.logger.log(
          `Set fallback password for block ${block.id} after 5 retries`
        );
      } catch (error) {
        this.logger.error(
          `Failed to set fallback password for block ${block.id}:`,
          error
        );
      }
    }
  }
}
