import { Controller, Get } from '@nestjs/common';
import { ConnectionManagerService } from '../shared/services/connection-manager.service';
import { SseRateLimitService } from '../shared/services/sse-rate-limit.service';
import { SseCleanupService } from '../shared/services/sse-cleanup.service';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('api/sse/admin')
export class SseAdminController {
  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly rateLimitService: SseRateLimitService,
    private readonly cleanupService: SseCleanupService,
  ) {}

  @Get('dashboard')
  getAdminDashboard() {
    const connectionStats = this.connectionManager.getConnectionStats();
    const rateLimitStats = this.rateLimitService.getRateStats();
    const cleanupStats = this.cleanupService.getCleanupStats();

    return {
      timestamp: new Date(),
      overview: {
        totalConnections: connectionStats.total,
        blockedConnections: rateLimitStats.blockedConnections,
        uptime: process.uptime(),
      },
      connections: {
        byType: connectionStats.byType,
        total: connectionStats.total,
        growth: this.calculateGrowthRate(),
      },
      rateLimit: {
        ...rateLimitStats,
        status: rateLimitStats.blockedConnections > 0 ? 'active' : 'normal',
      },
      cleanup: cleanupStats,
      alerts: this.generateAlerts(connectionStats, rateLimitStats),
    };
  }

  @Get('stream')
  getAdminDashboardStream(): Observable<any> {
    return interval(5000).pipe(
      map(() => this.getAdminDashboard()),
    );
  }

  @Get('health')
  getSystemHealth() {
    const connectionStats = this.connectionManager.getConnectionStats();
    const rateLimitStats = this.rateLimitService.getRateStats();

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {
        connections: connectionStats.total < 1000 ? 'healthy' : 'warning',
        rateLimiting: rateLimitStats.blockedConnections < connectionStats.total * 0.1 ? 'healthy' : 'warning',
        memory: this.checkMemoryUsage(),
        uptime: process.uptime() > 60 ? 'healthy' : 'starting',
      },
      metrics: {
        activeConnections: connectionStats.total,
        blockedConnections: rateLimitStats.blockedConnections,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };

    // Overall status is the worst check
    const checkStatuses = Object.values(health.checks);
    if (checkStatuses.includes('critical')) health.status = 'critical';
    else if (checkStatuses.includes('warning')) health.status = 'warning';

    return health;
  }

  @Get('top-clients')
  getTopClients() {
    const connections = this.connectionManager.getAllConnections();
    const connectionsByUser = new Map<string, number>();
    const connectionsByType = this.connectionManager.getConnectionStats().byType;

    // Count connections per user
    connections.forEach(conn => {
      if (conn.userId) {
        connectionsByUser.set(
          conn.userId,
          (connectionsByUser.get(conn.userId) || 0) + 1
        );
      }
    });

    // Get top users by connection count
    const topUsers = Array.from(connectionsByUser.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      timestamp: new Date(),
      topUsers,
      connectionsByType,
      totalUsers: connectionsByUser.size,
    };
  }

  private calculateGrowthRate(): number {
    // Simple mock growth rate calculation
    // In real implementation, this would compare with historical data
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private checkMemoryUsage(): string {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    const usagePercent = (usedMemory / totalMemory) * 100;

    if (usagePercent > 90) return 'critical';
    if (usagePercent > 80) return 'warning';
    return 'healthy';
  }

  private generateAlerts(connectionStats: any, rateLimitStats: any): Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
  }> {
    const alerts: Array<{
      level: 'info' | 'warning' | 'critical';
      message: string;
      timestamp: Date;
    }> = [];
    const now = new Date();

    // Connection count alerts
    if (connectionStats.total > 500) {
      alerts.push({
        level: 'critical',
        message: `High connection count: ${connectionStats.total}`,
        timestamp: now,
      });
    } else if (connectionStats.total > 200) {
      alerts.push({
        level: 'warning',
        message: `Elevated connection count: ${connectionStats.total}`,
        timestamp: now,
      });
    }

    // Rate limiting alerts
    if (rateLimitStats.blockedConnections > 50) {
      alerts.push({
        level: 'critical',
        message: `High blocked connections: ${rateLimitStats.blockedConnections}`,
        timestamp: now,
      });
    }

    // Memory alerts
    const memoryStatus = this.checkMemoryUsage();
    if (memoryStatus === 'critical') {
      alerts.push({
        level: 'critical',
        message: 'Critical memory usage detected',
        timestamp: now,
      });
    }

    return alerts;
  }
}