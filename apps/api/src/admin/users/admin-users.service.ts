import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateUserRoleDto } from './dto/admin-users.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger('AdminAudit');

  constructor(private readonly prisma: PrismaService) {}

  async listUsers({
    page,
    limit,
    role,
    search,
  }: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
  }) {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          nickname: true,
          email: true,
          role: true,
          totalPoints: true,
          cpCount: true,
          createdAt: true,
          isAnonymous: true,
        },
      }),
    ]);

    return {
      page,
      limit,
      total,
      users: users.map((user) => ({
        ...user,
        totalPoints: user.totalPoints.toString(),
      })),
    };
  }

  async getStats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [total, anonymous, masters, active24h] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAnonymous: true } }),
      this.prisma.user.count({ where: { role: 'MASTER' } }),
      this.prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: { gte: since },
            },
          },
        },
      }),
    ]);

    return {
      total,
      anonymous,
      masters,
      active24h,
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        totalPoints: true,
        cpCount: true,
        isAnonymous: true,
        createdAt: true,
        _count: {
          select: { attempts: true },
        },
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, blockId: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      totalPoints: user.totalPoints.toString(),
      attemptCount: user._count.attempts,
      lastAttempt: user.attempts[0] || null,
    };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto, actorId: string) {
    if (userId === actorId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === dto.role) {
      throw new BadRequestException('Role is already set');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
      },
    });

    await this.prisma.session.deleteMany({ where: { userId } });

    this.logger.log({
      type: 'ADMIN_ACTION',
      action: 'UPDATE_USER_ROLE',
      actorId,
      targetUserId: userId,
      previousRole: user.role,
      newRole: dto.role,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async resetCp(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        cpCount: 50,
        lastCpRefillAt: new Date(),
      },
      select: {
        id: true,
        cpCount: true,
      },
    });

    this.logger.log({
      type: 'ADMIN_ACTION',
      action: 'RESET_CP',
      actorId,
      targetUserId: userId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
