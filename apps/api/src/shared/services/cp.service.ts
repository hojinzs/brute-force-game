import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CpService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentCP(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { cpCount: true, lastCpRefillAt: true, isAnonymous: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const maxCP = user.isAnonymous ? 5 : 50;
    const minutesPassed = this.getMinutesPassed(user.lastCpRefillAt);
    const cpToRefill = Math.min(minutesPassed, maxCP - user.cpCount);

    if (cpToRefill > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          cpCount: user.cpCount + cpToRefill,
          lastCpRefillAt: new Date(),
        },
      });
      return user.cpCount + cpToRefill;
    }

    return user.cpCount;
  }

  async consumeCP(userId: string): Promise<boolean> {
    const currentCP = await this.getCurrentCP(userId);
    
    if (currentCP < 1) {
      return false;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { cpCount: { decrement: 1 } },
    });

    return true;
  }

  async refundCP(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { cpCount: { increment: 1 } },
    });
  }

  async getMaxCP(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAnonymous: true },
    });

    return user?.isAnonymous ? 5 : 50;
  }

  private getMinutesPassed(lastRefill: Date): number {
    const now = new Date();
    const diffInMs = now.getTime() - lastRefill.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  }
}