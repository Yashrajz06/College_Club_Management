import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SponsorStatus } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AiService } from '../ai/ai.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SponsorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly aiService: AiService,
    private readonly insights: InsightsService,
  ) {}

  async addSponsor(data: {
    name: string;
    organization: string;
    email?: string;
    phone?: string;
    clubId: string;
    requesterId: string;
  }) {
    await this.assertClubOwnership(data.clubId, data.requesterId);

    const sponsor = await this.prisma.sponsor.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        name: data.name,
        organization: data.organization,
        email: data.email,
        phone: data.phone,
        clubId: data.clubId,
        status: SponsorStatus.PROSPECT,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'sponsor',
      action: 'created',
      entityId: sponsor.id,
      payload: {
        clubId: sponsor.clubId,
      },
    });

    return sponsor;
  }

  async updateStatus(
    sponsorId: string,
    status: SponsorStatus,
    requesterId: string,
  ) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id: sponsorId },
      select: {
        id: true,
        clubId: true,
      },
    });
    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    await this.assertClubOwnership(sponsor.clubId, requesterId);

    const updated = await this.prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        status,
        lastContactedAt:
          status === SponsorStatus.CONTACTED ? new Date() : undefined,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'sponsor',
      action: 'status_updated',
      entityId: updated.id,
      payload: {
        status: updated.status,
      },
    });

    return updated;
  }

  async generateOutreachDraft(
    sponsorId: string,
    eventId: string,
    requesterId: string,
  ) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id: sponsorId },
      select: { id: true, clubId: true },
    });
    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    await this.assertClubOwnership(sponsor.clubId, requesterId);

    const draft = await this.aiService.draftSponsorMessage(eventId, sponsorId);
    await this.prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        outreachDraft: draft.message,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'sponsor',
      action: 'outreach_drafted',
      entityId: sponsorId,
      payload: {
        eventId,
      },
    });

    return draft;
  }

  async getSponsorsForClub(clubId: string) {
    return this.prisma.sponsor.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: { select: { amount: true, date: true } },
      },
    });
  }

  async deleteSponsor(sponsorId: string, requesterId: string) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id: sponsorId },
      select: {
        id: true,
        clubId: true,
      },
    });
    if (!sponsor) throw new NotFoundException('Sponsor not found');
    await this.assertClubOwnership(sponsor.clubId, requesterId);

    const deleted = await this.prisma.sponsor.delete({
      where: { id: sponsorId },
    });

    await this.insights.recordSyncEvent({
      entityType: 'sponsor',
      action: 'deleted',
      entityId: deleted.id,
    });

    return deleted;
  }

  private async assertClubOwnership(clubId: string, requesterId: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      select: {
        presidentId: true,
        vpId: true,
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    if (club.presidentId !== requesterId && club.vpId !== requesterId) {
      throw new ForbiddenException(
        'Not authorized to manage sponsors for this club',
      );
    }
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new NotFoundException('College context not available');
    }
    return collegeId;
  }
}
