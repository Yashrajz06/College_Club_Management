import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from '../insights/insights.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: InsightsService,
  ) {}

  /**
   * Full dashboard payload: stats + token metrics + monthly event trends + attendance rate trend.
   */
  async getDashboard() {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const baseStats = await this.insights.getDashboardStats();
    const tokenMetrics = await this.insights.getTokenDistributionMetrics(collegeId);

    // Monthly event trend
    const events = await this.prisma.event.findMany({
      where: { collegeId },
      select: { date: true, status: true },
    });

    const monthlyEvents: Record<string, { total: number; approved: number; concluded: number }> = {};
    for (const ev of events) {
      const month = new Date(ev.date).toISOString().slice(0, 7);
      if (!monthlyEvents[month]) monthlyEvents[month] = { total: 0, approved: 0, concluded: 0 };
      monthlyEvents[month].total++;
      if (ev.status === 'APPROVED') monthlyEvents[month].approved++;
      if (ev.status === 'CONCLUDED') monthlyEvents[month].concluded++;
    }

    const monthlyEventTrend = Object.entries(monthlyEvents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Attendance rate per event
    const recentEvents = await this.prisma.event.findMany({
      where: { collegeId, status: { in: ['APPROVED', 'CONCLUDED'] } },
      select: { id: true, title: true, date: true },
      orderBy: { date: 'desc' },
      take: 12,
    });

    const attendanceRateTrend = await Promise.all(
      recentEvents.reverse().map(async (ev) => {
        const regs = await this.prisma.registration.findMany({
          where: { eventId: ev.id, collegeId },
          select: { attended: true },
        });
        const total = regs.length;
        const attended = regs.filter((r) => r.attended).length;
        return {
          event: ev.title,
          date: ev.date.toISOString().slice(0, 10),
          rate: total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0,
          total,
          attended,
        };
      }),
    );

    // Recent analytics events from local store
    const recentActivity = await this.prisma.analyticsEvent.findMany({
      where: { collegeId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      ...baseStats,
      tokenMetrics,
      monthlyEventTrend,
      attendanceRateTrend,
      recentActivity,
    };
  }

  /**
   * Leaderboard: top users ranked by total EntryToken count.
   */
  async getLeaderboard(limit = 20) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    const holdersRaw = await this.prisma.entryToken.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { collegeId },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const leaderboard = await Promise.all(
      holdersRaw.map(async (h, index) => {
        const user = await this.prisma.user.findFirst({
          where: { id: h.userId },
          select: { name: true, walletAddress: true, role: true, department: true },
        });

        // Per-action breakdown
        const actionBreakdown = await this.prisma.entryToken.groupBy({
          by: ['actionType'],
          _count: { id: true },
          where: { userId: h.userId, collegeId },
        });

        return {
          rank: index + 1,
          userId: h.userId,
          name: user?.name ?? 'Unknown',
          walletAddress: user?.walletAddress,
          role: user?.role,
          department: user?.department,
          totalTokens: h._count?.id ?? 0,
          breakdown: actionBreakdown.map((a) => ({
            action: a.actionType,
            count: a._count?.id ?? 0,
          })),
        };
      }),
    );

    return { collegeId, leaderboard };
  }

  /**
   * Analytics event timeline (local Prisma store).
   */
  async getTimeline(limit = 50) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    const events = await this.prisma.analyticsEvent.findMany({
      where: { collegeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { collegeId, events };
  }
}
