import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClubStatus, EventStatus, Prisma, SponsorStatus } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AlgorandService } from '../finance/algorand.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

type SyncEntityType =
  | 'club'
  | 'event'
  | 'registration'
  | 'sponsor'
  | 'governance'
  | 'poster'
  | 'treasury';

type DashboardClub = {
  id: string;
  status: ClubStatus | string;
  category?: string | null;
  prizePoolBalance?: number | null;
};

type DashboardUser = {
  id: string;
  role: string;
};

type DashboardEvent = {
  id: string;
  status: EventStatus | string;
  budget?: number | null;
  date?: string | Date | null;
  clubId: string;
};

type DashboardSponsor = {
  id: string;
  status: SponsorStatus | string;
};

type DashboardRegistration = {
  id: string;
  attended?: boolean | null;
  isWaitlisted?: boolean | null;
  eventId: string;
};

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly cls: ClsService,
    private readonly algorand: AlgorandService,
  ) {}

  getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new InternalServerErrorException(
        'College context is required for insights operations.',
      );
    }

    return collegeId;
  }

  async recordSyncEvent(input: {
    entityType: SyncEntityType;
    action: string;
    entityId: string;
    payload?: Record<string, unknown>;
  }) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const eventPayload = {
      collegeId,
      entityType: input.entityType,
      action: input.action,
      entityId: input.entityId,
      payload: input.payload ?? {},
      createdAt: new Date().toISOString(),
    };

    // Persist to local AnalyticsEvent table
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          collegeId,
          entityType: input.entityType,
          action: input.action,
          entityId: input.entityId,
          payload: (input.payload as any) ?? undefined,
        },
      });
    } catch (error) {
      this.logger.debug(
        `Local analytics persist skipped for ${input.entityType}:${input.entityId} (${String(error)})`,
      );
    }

    try {
      const client = this.supabase.getClient();
      await Promise.allSettled([
        client.from('analytics_events').insert(eventPayload),
        client.from('ai_context_feed').insert(eventPayload),
      ]);
    } catch (error) {
      this.logger.debug(
        `Supabase sync skipped for ${input.entityType}:${input.entityId} (${String(
          error,
        )})`,
      );
    }

    this.logger.log(
      `[Insights] ${input.entityType}:${input.entityId} ${input.action} for college ${collegeId}`,
    );
  }

  async getDashboardStats() {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const tokenMetrics = await this.getTokenDistributionMetrics(collegeId);

    const supabaseStats = await this.getDashboardStatsFromSupabase(collegeId);
    if (supabaseStats) {
      return { ...supabaseStats, tokenMetrics };
    }

    const prismaStats = await this.getDashboardStatsFromPrisma(collegeId);
    return { ...prismaStats, tokenMetrics };
  }

  async getAssistantContext() {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const tokenMetrics = await this.getTokenDistributionMetrics(collegeId);

    const supabaseContext = await this.getAssistantContextFromSupabase(collegeId);
    if (supabaseContext) {
      return { ...supabaseContext, tokenMetrics };
    }

    const prismaContext = await this.getAssistantContextFromPrisma(collegeId);
    return { ...prismaContext, tokenMetrics };
  }

  async getTokenDistributionMetrics(collegeId: string) {
    const actionCounts = await this.prisma.entryToken.groupBy({
      by: ['actionType'],
      _count: { id: true },
      where: { collegeId },
    });

    const totalTokens = actionCounts.reduce((acc, curr) => acc + (curr._count?.id ?? 0), 0);

    const distributionByAction = actionCounts.map((val) => ({
      action: val.actionType,
      count: val._count?.id ?? 0,
    }));

    // Top token holders
    const topHoldersRaw = await this.prisma.entryToken.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: { collegeId },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topHolders = await Promise.all(
      topHoldersRaw.map(async (h) => {
        const user = await this.prisma.user.findFirst({
          where: { id: h.userId },
          select: { name: true, walletAddress: true },
        });
        return {
          userId: h.userId,
          name: user?.name ?? 'Unknown',
          walletAddress: user?.walletAddress,
          count: h._count?.id ?? 0,
        };
      })
    );

    return {
      totalActiveTokens: totalTokens,
      distributionByAction,
      topHolders,
    };
  }

  private async getDashboardStatsFromSupabase(collegeId: string) {
    try {
      const [clubsRes, usersRes, eventsRes, sponsorsRes, registrationsRes] =
        await Promise.all([
          this.supabase.queryScoped(
            'Club',
            collegeId,
            'id,status,category,prizePoolBalance',
          ),
          this.supabase.queryScoped('User', collegeId, 'id,role'),
          this.supabase.queryScoped('Event', collegeId, 'id,status,budget,date,clubId'),
          this.supabase.queryScoped('Sponsor', collegeId, 'id,status'),
          this.supabase.queryScoped(
            'Registration',
            collegeId,
            'id,attended,isWaitlisted,eventId',
          ),
        ]);

      if (
        clubsRes.error ||
        usersRes.error ||
        eventsRes.error ||
        sponsorsRes.error ||
        registrationsRes.error
      ) {
        return null;
      }

      const clubs = this.asRows<DashboardClub>(clubsRes.data);
      const users = this.asRows<DashboardUser>(usersRes.data);
      const events = this.asRows<DashboardEvent>(eventsRes.data);
      const sponsors = this.asRows<DashboardSponsor>(sponsorsRes.data);
      const registrations = this.asRows<DashboardRegistration>(
        registrationsRes.data,
      );

      return this.buildDashboardStats({
        clubs,
        users,
        events,
        sponsors,
        registrations,
      });
    } catch {
      return null;
    }
  }

  private async getDashboardStatsFromPrisma(collegeId: string) {
    const [clubs, users, events, sponsors, registrations] = await Promise.all([
      this.prisma.club.findMany({
        where: { collegeId },
        select: {
          id: true,
          status: true,
          category: true,
          prizePoolBalance: true,
        },
      }),
      this.prisma.user.findMany({
        where: { collegeId },
        select: { id: true, role: true },
      }),
      this.prisma.event.findMany({
        where: { collegeId },
        select: {
          id: true,
          status: true,
          budget: true,
          date: true,
          clubId: true,
        },
      }),
      this.prisma.sponsor.findMany({
        where: { collegeId },
        select: { id: true, status: true },
      }),
      this.prisma.registration.findMany({
        where: { collegeId },
        select: {
          id: true,
          attended: true,
          isWaitlisted: true,
          eventId: true,
        },
      }),
    ]);

    return this.buildDashboardStats({
      clubs,
      users,
      events,
      sponsors,
      registrations,
    });
  }

  private buildDashboardStats(data: {
    clubs: DashboardClub[];
    users: DashboardUser[];
    events: DashboardEvent[];
    sponsors: DashboardSponsor[];
    registrations: DashboardRegistration[];
  }) {
    const activeClubs = data.clubs.filter((club) => club.status === ClubStatus.ACTIVE);
    const approvedEvents = data.events.filter(
      (event) => event.status === EventStatus.APPROVED,
    );
    const pendingClubs = data.clubs.filter((club) => club.status === ClubStatus.PENDING);
    const pendingEvents = data.events.filter(
      (event) => event.status === EventStatus.PENDING,
    );
    const attendedCount = data.registrations.filter((registration) => registration.attended).length;
    const mostActiveClubMap = new Map<string, number>();

    for (const event of approvedEvents) {
      mostActiveClubMap.set(
        event.clubId,
        (mostActiveClubMap.get(event.clubId) ?? 0) + 1,
      );
    }

    const mostActiveClubs = Array.from(mostActiveClubMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clubId, approvedEventCount]) => ({ clubId, approvedEventCount }));

    return {
      clubCount: activeClubs.length,
      memberCount: data.users.filter((user) => user.role !== 'GUEST').length,
      eventCount: approvedEvents.length,
      totalBudget: approvedEvents.reduce(
        (sum, event) => sum + Number(event.budget ?? 0),
        0,
      ),
      pendingClubCount: pendingClubs.length,
      pendingEventCount: pendingEvents.length,
      sponsorCount: data.sponsors.length,
      confirmedSponsorCount: data.sponsors.filter(
        (sponsor) => sponsor.status === SponsorStatus.CONFIRMED,
      ).length,
      upcomingEventCount: approvedEvents.filter((event) => {
        if (!event.date) return false;
        return new Date(event.date) > new Date();
      }).length,
      participationRate:
        data.registrations.length > 0
          ? Number(((attendedCount / data.registrations.length) * 100).toFixed(1))
          : 0,
      mostActiveClubs,
      treasuryTrackedClubs: data.clubs.filter(
        (club) => Number(club.prizePoolBalance ?? 0) > 0,
      ).length,
    };
  }

  private async getAssistantContextFromSupabase(collegeId: string) {
    try {
      const [clubsRes, eventsRes, sponsorsRes, analyticsRes] = await Promise.all([
        this.supabase.queryScoped(
          'Club',
          collegeId,
          'id,name,category,status,prizePoolBalance',
        ),
        this.supabase.queryScoped(
          'Event',
          collegeId,
          'id,title,status,date,venue,clubId,posterImageUrl',
        ),
        this.supabase.queryScoped(
          'Sponsor',
          collegeId,
          'id,name,organization,status,lastContactedAt',
        ),
        this.supabase
          .getClient()
          .from('analytics_events')
          .select('entityType,action,entityId,createdAt')
          .eq('collegeId', collegeId)
          .order('createdAt', { ascending: false })
          .limit(10),
      ]);

      if (clubsRes.error || eventsRes.error || sponsorsRes.error) {
        return null;
      }

      const blockchain = await this.algorand.getCollegeScopedIndexerTransactions(10);

      return {
        source: 'supabase',
        generatedAt: new Date().toISOString(),
        dashboard: await this.getDashboardStats(),
        clubs: clubsRes.data ?? [],
        recentEvents: (eventsRes.data ?? []).slice(0, 10),
        sponsors: sponsorsRes.data ?? [],
        recentAnalytics: analyticsRes.data ?? [],
        blockchain,
      };
    } catch {
      return null;
    }
  }

  private async getAssistantContextFromPrisma(collegeId: string) {
    const [clubs, events, sponsors, treasury] = await Promise.all([
      this.prisma.club.findMany({
        where: { collegeId },
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          prizePoolBalance: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.event.findMany({
        where: { collegeId },
        select: {
          id: true,
          title: true,
          status: true,
          date: true,
          venue: true,
          clubId: true,
          posterImageUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.sponsor.findMany({
        where: { collegeId },
        select: {
          id: true,
          name: true,
          organization: true,
          status: true,
          lastContactedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.treasurySpendRequest.findMany({
        where: { collegeId },
        select: {
          id: true,
          title: true,
          amount: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const blockchain = await this.algorand.getCollegeScopedIndexerTransactions(10);

    return {
      source: 'prisma',
      generatedAt: new Date().toISOString(),
      dashboard: await this.getDashboardStats(),
      clubs,
      recentEvents: events,
      sponsors,
      treasuryContext: treasury,
      recentAnalytics: [],
      blockchain,
    };
  }

  private asRows<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }
}
