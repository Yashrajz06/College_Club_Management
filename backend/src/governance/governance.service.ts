import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  GovernanceProposalStatus,
} from '@prisma/client';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: InsightsService,
  ) {}

  async createProposal(data: {
    eventId: string;
    title: string;
    description: string;
    proposerId: string;
  }) {
    const event = await this.prisma.event.findFirst({
      where: { id: data.eventId },
      include: {
        club: {
          select: {
            id: true,
            presidentId: true,
            vpId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException(
        'Governance proposals can only be created for approved events.',
      );
    }

    const isOwner =
      event.club?.presidentId === data.proposerId ||
      event.club?.vpId === data.proposerId;
    if (!isOwner) {
      throw new ForbiddenException(
        'Only the club leadership can create governance proposals.',
      );
    }

    const proposal = await this.prisma.governanceProposal.create({
      data: {
        title: data.title,
        description: data.description,
        status: GovernanceProposalStatus.SUBMITTED,
        collegeId: this.insights.getCurrentCollegeIdOrThrow(),
        clubId: event.clubId,
        eventId: event.id,
        proposerId: data.proposerId,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'governance',
      action: 'proposal_submitted',
      entityId: proposal.id,
      payload: {
        eventId: proposal.eventId,
        clubId: proposal.clubId,
        status: proposal.status,
      },
    });

    return proposal;
  }

  async listEventProposals(eventId: string) {
    return this.prisma.governanceProposal.findMany({
      where: { eventId },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
