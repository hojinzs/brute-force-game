import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger('AdminAction');

  constructor(private readonly prisma: PrismaService) {}

  async getUsers(page: number, limit: number, search?: string, role?: string) {
    const where: any = {};

    if (search) {
      where.nickname = { contains: search, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          role: true,
          isAnonymous: true,
          cpCount: true,
          totalPoints: true,
          country: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { attempts: true, wonBlocks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      page,
      limit,
      total,
      users: users.map((user) => ({
        ...user,
        totalPoints: Number(user.totalPoints),
        attemptCount: user._count.attempts,
        wonBlockCount: user._count.wonBlocks,
        _count: undefined,
      })),
    };
  }

  async getUserStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalUsers, totalAnonymous, totalMasters, activeUsersLast24h, newUsersToday] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isAnonymous: true } }),
        this.prisma.user.count({ where: { role: 'MASTER' } }),
        this.prisma.user.count({ where: { updatedAt: { gte: oneDayAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      ]);

    return {
      totalUsers,
      totalAnonymous,
      totalRegistered: totalUsers - totalAnonymous,
      totalMasters,
      activeUsersLast24h,
      newUsersToday,
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { attempts: true, wonBlocks: true, sessions: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get recent attempt stats
    const recentAttempts = await this.prisma.attempt.count({
      where: {
        userId: id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const successfulAttempts = await this.prisma.attempt.count({
      where: { userId: id, similarity: 100 },
    });

    const { passwordHash, ...userData } = user;

    return {
      ...userData,
      totalPoints: Number(user.totalPoints),
      attemptCount: user._count.attempts,
      wonBlockCount: user._count.wonBlocks,
      activeSessions: user._count.sessions,
      recentAttempts7d: recentAttempts,
      successfulAttempts,
      successRate: user._count.attempts > 0
        ? ((successfulAttempts / user._count.attempts) * 100).toFixed(2)
        : '0',
      _count: undefined,
    };
  }

  async updateUserRole(targetUserId: string, newRole: string, actorId: string) {
    if (targetUserId === actorId) {
      throw new BadRequestException('Cannot modify own role');
    }

    if (newRole !== 'USER' && newRole !== 'MASTER') {
      throw new BadRequestException('Invalid role. Must be USER or MASTER');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as any },
    });

    // Invalidate all sessions for the target user (force re-login with new role in JWT)
    await this.prisma.session.deleteMany({
      where: { userId: targetUserId },
    });

    this.logAdminAction('CHANGE_USER_ROLE', actorId, {
      targetUserId,
      previousRole,
      newRole,
    });

    return {
      id: updated.id,
      nickname: updated.nickname,
      role: updated.role,
      previousRole,
      sessionsInvalidated: true,
    };
  }

  async resetUserCp(targetUserId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        cpCount: 50,
        lastCpRefillAt: new Date(),
      },
    });

    this.logAdminAction('RESET_USER_CP', actorId, {
      targetUserId,
      previousCp: user.cpCount,
      newCp: 50,
    });

    return {
      id: updated.id,
      nickname: updated.nickname,
      cpCount: updated.cpCount,
    };
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
