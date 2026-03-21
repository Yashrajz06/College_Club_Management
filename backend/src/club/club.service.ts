import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClubStatus, Role } from '@prisma/client';

@Injectable()
export class ClubService {
  constructor(private prisma: PrismaService) {}

  async createClubRequest(data: {
    name: string;
    description: string;
    category: string;
    presidentId: string;
    vpEmailOrId: string;
    coordinatorEmailOrId?: string;
  }) {
    // Check if club name exists
    const existing = await this.prisma.club.findUnique({ where: { name: data.name } });
    if (existing) throw new Error("Club name already exists");

    const vpUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.vpEmailOrId }, { studentId: data.vpEmailOrId }] },
    });
    if (!vpUser) throw new NotFoundException('Vice President not found');

    let coordinatorId: string | undefined;
    if (!data.coordinatorEmailOrId) {
      throw new BadRequestException('coordinatorEmailOrId is required');
    }

    const coordinatorUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.coordinatorEmailOrId }, { studentId: data.coordinatorEmailOrId }] },
    });
    if (!coordinatorUser) throw new NotFoundException('Faculty Coordinator not found');
    coordinatorId = coordinatorUser.id;

    return this.prisma.club.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        status: ClubStatus.PENDING,
        presidentId: data.presidentId,
        vpId: vpUser.id,
        coordinatorId,
      }
    });
  }

  async getPendingRequests() {
    return this.prisma.club.findMany({
      where: { status: ClubStatus.PENDING },
      include: { president: { select: { name: true, email: true } }, coordinator: { select: { name: true } } }
    });
  }

  async approveClub(clubId: string) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    const updated = await this.prisma.club.update({
      where: { id: clubId },
      data: { status: ClubStatus.ACTIVE }
    });

    if (!club.presidentId || !club.vpId || !club.coordinatorId) {
      throw new BadRequestException('Club missing compulsory positions (PRESIDENT/VP/COORDINATOR)');
    }

    // Auto-assign President role + membership
    await this.prisma.user.update({
      where: { id: club.presidentId },
      data: { role: Role.PRESIDENT }
    });
    const presMember = await this.prisma.clubMember.findFirst({
      where: { userId: club.presidentId, clubId: clubId },
    });
    if (!presMember) {
      await this.prisma.clubMember.create({
        data: { userId: club.presidentId, clubId: clubId, customRole: 'President' },
      });
    } else {
      await this.prisma.clubMember.update({
        where: { id: presMember.id },
        data: { customRole: 'President' },
      });
    }

    // Auto-assign VP role + membership
    await this.prisma.user.update({
      where: { id: club.vpId },
      data: { role: Role.VP }
    });
    const vpMember = await this.prisma.clubMember.findFirst({
      where: { userId: club.vpId, clubId: clubId },
    });
    if (!vpMember) {
      await this.prisma.clubMember.create({
        data: { userId: club.vpId, clubId: clubId, customRole: 'VP' },
      });
    } else {
      await this.prisma.clubMember.update({
        where: { id: vpMember.id },
        data: { customRole: 'VP' },
      });
    }

    // Ensure coordinator role is set
    await this.prisma.user.update({
      where: { id: club.coordinatorId },
      data: { role: Role.COORDINATOR }
    });

    return updated;
  }

  async rejectClub(clubId: string) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: { status: ClubStatus.INACTIVE }
    });
  }

  async getActiveClubs() {
    return this.prisma.club.findMany({
      where: { status: ClubStatus.ACTIVE },
      include: { president: { select: { name: true } } }
    });
  }

  async getGlobalStats() {
    const [clubCount, memberCount, eventCount, totalBudget] = await Promise.all([
      this.prisma.club.count({ where: { status: ClubStatus.ACTIVE } }),
      this.prisma.user.count({ where: { NOT: { role: Role.GUEST } } }),
      this.prisma.event.count({ where: { status: 'APPROVED' } }),
      this.prisma.event.aggregate({ _sum: { budget: true } }),
    ]);

    return {
      clubCount,
      memberCount,
      eventCount,
      totalBudget: totalBudget._sum.budget || 0,
    };
  }

  async getAllClubsWithStats() {
    return this.prisma.club.findMany({
      include: {
        _count: { select: { members: true, events: true } },
        president: { select: { name: true, email: true } },
      },
    });
  }

  async getMyClub(userId: string) {
    return this.prisma.club.findFirst({
      where: { OR: [{ presidentId: userId }, { vpId: userId }] },
      select: { id: true, name: true },
    });
  }

  async sendInvitation(clubId: string, emailOrId: string, customRole?: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: emailOrId }, { studentId: emailOrId }] },
    });
    if (!user) throw new NotFoundException('Student not found');

    return this.prisma.invitation.create({
      data: {
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
    });
  }

  async respondToInvitation(invitationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED') {
    const invite = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invite || invite.userId !== userId) throw new Error('Invitation not found or unauthorized');

    if (status === 'ACCEPTED') {
      await this.prisma.clubMember.create({
        data: {
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
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
