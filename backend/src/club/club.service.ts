import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  ClubStatus,
  CollegeContractType,
  Prisma,
  Role,
} from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AlgorandService } from '../finance/algorand.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly algorand: AlgorandService,
    private readonly insights: InsightsService,
  ) {}

  async createClubRequest(data: {
    name: string;
    description: string;
    category: string;
    presidentId: string;
    vpEmailOrId: string;
    coordinatorEmailOrId: string;
  }) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const existing = await this.prisma.club.findFirst({
      where: { name: data.name },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Club name already exists');
    }

    const [president, vpUser, coordinatorUser] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: data.presidentId },
      }),
      this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.vpEmailOrId },
            { studentId: data.vpEmailOrId },
          ],
        },
      }),
      this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.coordinatorEmailOrId },
            { studentId: data.coordinatorEmailOrId },
          ],
        },
      }),
    ]);

    if (!president) throw new NotFoundException('President not found');
    if (!vpUser) throw new NotFoundException('Vice President not found');
    if (!coordinatorUser) {
      throw new NotFoundException('Faculty Coordinator not found');
    }

    const club = await this.prisma.club.create({
      data: {
        collegeId,
        name: data.name,
        description: data.description,
        category: data.category,
        status: ClubStatus.PENDING,
        presidentId: data.presidentId,
        vpId: vpUser.id,
        coordinatorId: coordinatorUser.id,
      },
      include: {
        president: { select: { id: true, name: true, email: true } },
        vp: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'club',
      action: 'created',
      entityId: club.id,
      payload: {
        status: club.status,
        presidentId: club.presidentId,
        vpId: club.vpId,
        coordinatorId: club.coordinatorId,
      },
    });

    return club;
  }

  async getPendingRequests() {
    return this.prisma.club.findMany({
      where: { status: ClubStatus.PENDING },
      include: {
        president: { select: { name: true, email: true } },
        coordinator: { select: { name: true, email: true } },
        vp: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveClub(clubId: string, remarks?: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      include: {
        president: {
          select: { id: true, walletAddress: true },
        },
      },
    });
    if (!club) throw new NotFoundException('Club not found');
    if (!club.presidentId || !club.vpId || !club.coordinatorId) {
      throw new BadRequestException(
        'Club missing compulsory positions (PRESIDENT/VP/COORDINATOR)',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const approvedClub = await tx.club.update({
        where: { id: clubId },
        data: {
          status: ClubStatus.ACTIVE,
          approvalRemarks: remarks,
          approvedAt: new Date(),
          rejectedAt: null,
        },
      });

      await tx.user.update({
        where: { id: club.presidentId! },
        data: { role: Role.PRESIDENT },
      });
      await tx.user.update({
        where: { id: club.vpId! },
        data: { role: Role.VP },
      });
      await tx.user.update({
        where: { id: club.coordinatorId! },
        data: { role: Role.COORDINATOR },
      });

      await this.ensureMembership(tx, clubId, club.presidentId!, 'President');
      await this.ensureMembership(tx, clubId, club.vpId!, 'Vice President');

      return approvedClub;
    });

    await this.algorand.triggerLifecycleAction({
      action: BlockchainActionType.MINT,
      contractType: CollegeContractType.ENTRY_TOKEN,
      entityId: updated.id,
      walletAddress: club.president?.walletAddress,
      metadata: {
        reason: 'club_approval',
        clubId: updated.id,
        userId: club.presidentId,
        targetWalletAddress: club.president?.walletAddress,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'club',
      action: 'approved',
      entityId: updated.id,
      payload: {
        approvedAt: updated.approvedAt,
        presidentId: club.presidentId,
      },
    });

    return updated;
  }

  async rejectClub(clubId: string, remarks?: string) {
    const club = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        status: ClubStatus.INACTIVE,
        approvalRemarks: remarks,
        rejectedAt: new Date(),
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'club',
      action: 'rejected',
      entityId: club.id,
      payload: {
        remarks,
      },
    });

    return club;
  }

  async getActiveClubs() {
    return this.prisma.club.findMany({
      where: { status: ClubStatus.ACTIVE },
      include: {
        president: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getClubById(clubId: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      include: {
        president: { select: { id: true, name: true, email: true } },
        vp: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
        _count: {
          select: { members: true, events: true, sponsors: true, tasks: true },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club;
  }

  async updateClub(
    clubId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      coordinatorEmailOrId?: string;
      vpEmailOrId?: string;
    },
  ) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      include: {
        president: { select: { id: true } },
      },
    });
    if (!club) throw new NotFoundException('Club not found');

    const requester = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    const isOwner = club.presidentId === userId || club.vpId === userId;
    const isAdmin = requester?.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to update this club');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;

    if (data.coordinatorEmailOrId) {
      const coordinator = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.coordinatorEmailOrId },
            { studentId: data.coordinatorEmailOrId },
          ],
        },
      });
      if (!coordinator) {
        throw new NotFoundException('Faculty Coordinator not found');
      }
      updateData.coordinatorId = coordinator.id;
    }

    if (data.vpEmailOrId) {
      const vp = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.vpEmailOrId },
            { studentId: data.vpEmailOrId },
          ],
        },
      });
      if (!vp) {
        throw new NotFoundException('Vice President not found');
      }
      updateData.vpId = vp.id;
    }

    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: updateData,
    });

    await this.insights.recordSyncEvent({
      entityType: 'club',
      action: 'updated',
      entityId: updated.id,
      payload: updateData,
    });

    return updated;
  }

  async deleteClub(clubId: string, userId: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      select: {
        id: true,
        presidentId: true,
        vpId: true,
      },
    });
    if (!club) throw new NotFoundException('Club not found');

    const requester = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { role: true },
    });
    const isOwner = club.presidentId === userId || club.vpId === userId;
    const isAdmin = requester?.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to archive this club');
    }

    const archived = await this.prisma.club.update({
      where: { id: clubId },
      data: { status: ClubStatus.INACTIVE },
    });

    await this.insights.recordSyncEvent({
      entityType: 'club',
      action: 'archived',
      entityId: archived.id,
    });

    return archived;
  }

  async getGlobalStats() {
    return this.insights.getDashboardStats();
  }

  async getAllClubsWithStats() {
    return this.prisma.club.findMany({
      include: {
        _count: { select: { members: true, events: true } },
        president: { select: { name: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getMyClub(userId: string) {
    return this.prisma.club.findFirst({
      where: { OR: [{ presidentId: userId }, { vpId: userId }] },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        presidentId: true,
        vpId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendInvitation(clubId: string, senderId: string, emailOrId: string, customRole?: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      select: {
        presidentId: true,
        vpId: true,
      },
    });
    if (!club) throw new NotFoundException('Club not found');

    const isOwner = club.presidentId === senderId || club.vpId === senderId;
    if (!isOwner) {
      throw new ForbiddenException('Not authorized to invite members to this club');
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: emailOrId }, { studentId: emailOrId }] },
    });
    if (!user) throw new NotFoundException('Student not found');

    return this.prisma.invitation.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        clubId,
        userId: user.id,
        customRole,
      },
    });
  }

  async getInvitationsForUser(userId: string) {
    return this.prisma.invitation.findMany({
      where: { userId, status: 'PENDING' },
      include: { club: { select: { name: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToInvitation(invitationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED') {
    const invite = await this.prisma.invitation.findFirst({
      where: { id: invitationId },
    });
    if (!invite || invite.userId !== userId) {
      throw new NotFoundException('Invitation not found or unauthorized');
    }

    if (status === 'ACCEPTED') {
      await this.prisma.clubMember.create({
        data: {
          collegeId: this.getCurrentCollegeIdOrThrow(),
          userId: invite.userId,
          clubId: invite.clubId,
          customRole: invite.customRole,
        },
      });
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status },
    });
  }

  async getMembers(clubId: string) {
    return this.prisma.clubMember.findMany({
      where: { clubId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  private async ensureMembership(
    tx: Prisma.TransactionClient,
    clubId: string,
    userId: string,
    customRole: string,
  ) {
    const existing = await tx.clubMember.findFirst({
      where: { userId, clubId },
    });

    if (!existing) {
      await tx.clubMember.create({
        data: {
          collegeId: this.getCurrentCollegeIdOrThrow(),
          userId,
          clubId,
          customRole,
        },
      });
      return;
    }

    await tx.clubMember.update({
      where: { id: existing.id },
      data: { customRole },
    });
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new BadRequestException('College context not available');
    }
    return collegeId;
  }
}
