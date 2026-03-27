import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  CollegeContractType,
  EventStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AiService } from '../ai/ai.service';
import { AlgorandService } from '../finance/algorand.service';
import { InsightsService } from '../insights/insights.service';
import { MailService } from '../mail/mail.service';
import { NotificationGateway } from '../notification/notification/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { TokenActionType } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly aiService: AiService,
    private readonly mailService: MailService,
    private readonly algorand: AlgorandService,
    private readonly insights: InsightsService,
    private readonly notifications: NotificationGateway,
    private readonly tokenService: TokenService,
  ) {}

  async createEvent(data: {
    title: string;
    description: string;
    category?: string;
    date: Date;
    venue: string;
    capacity: number;
    budget?: number;
    clubId: string;
    isPublic: boolean;
    requesterId: string;
  }) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const club = await this.prisma.club.findFirst({
      where: { id: data.clubId, collegeId },
      select: {
        id: true,
        presidentId: true,
        vpId: true,
      },
    });
    if (!club) throw new NotFoundException('Club not found');

    const isOwner =
      club.presidentId === data.requesterId || club.vpId === data.requesterId;
    if (!isOwner) {
      throw new ForbiddenException('Not authorized to create events for this club');
    }

    const event = await this.prisma.event.create({
      data: {
        collegeId,
        title: data.title,
        description: data.description,
        category: data.category,
        date: data.date,
        venue: data.venue,
        capacity: data.capacity,
        budget: data.budget ?? 0,
        clubId: data.clubId,
        isPublic: data.isPublic,
        status: EventStatus.PENDING,
      },
    });

    const treasuryPlaceholder = await this.algorand.triggerLifecycleAction({
      action: BlockchainActionType.TREASURY_LOG,
      contractType: CollegeContractType.TREASURY,
      entityId: event.id,
      metadata: {
        kind: 'event_treasury_placeholder',
        eventId: event.id,
        clubId: event.clubId,
        creatorId: data.requesterId,
      },
    });

    const setupDeadline = new Date(data.date);
    setupDeadline.setDate(setupDeadline.getDate() - 1);

    await this.prisma.task.create({
      data: {
        collegeId,
        title: `Configure PoP attendance for ${event.title}`,
        description:
          'Prepare QR, attendee list, and proof-of-participation attendance workflow before the event.',
        deadline: setupDeadline,
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        clubId: event.clubId,
        eventId: event.id,
        assigneeId: data.requesterId,
      },
    });

    const updated = await this.prisma.event.update({
      where: { id: event.id },
      data: {
        treasuryPlaceholderTxId: treasuryPlaceholder.txId,
      },
      include: {
        club: { select: { name: true } },
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'created',
      entityId: updated.id,
      payload: {
        status: updated.status,
        clubId: updated.clubId,
        treasuryPlaceholderTxId: updated.treasuryPlaceholderTxId,
      },
    });

    const coordinator = await this.prisma.club.findFirst({
      where: { id: updated.clubId, collegeId },
      select: { coordinatorId: true },
    });
    if (coordinator?.coordinatorId) {
      this.notifications.sendNotificationToUser(coordinator.coordinatorId, {
        title: 'Event Approval Needed',
        message: `${updated.title} is waiting for your review.`,
        type: 'info',
      });
    }

    return updated;
  }

  async updateEvent(
    eventId: string,
    requesterId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      date?: Date;
      venue?: string;
      capacity?: number;
      budget?: number;
      isPublic?: boolean;
    },
  ) {
    const event = await this.getManagedEvent(eventId, requesterId);

    if (event.status === EventStatus.CONCLUDED) {
      throw new BadRequestException('Concluded events cannot be edited');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.venue !== undefined ? { venue: data.venue } : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.budget !== undefined ? { budget: data.budget } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
        status:
          event.status === EventStatus.REJECTED ? EventStatus.PENDING : undefined,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'updated',
      entityId: updated.id,
      payload: data,
    });

    return updated;
  }

  async deleteEvent(eventId: string, requesterId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.getManagedEvent(eventId, requesterId);

    const [registrationCount, transactionCount] = await Promise.all([
      this.prisma.registration.count({ where: { eventId, collegeId } }),
      this.prisma.transaction.count({ where: { eventId, collegeId } }),
    ]);

    if (registrationCount > 0 || transactionCount > 0) {
      throw new BadRequestException(
        'Cannot delete an event that already has registrations or transactions.',
      );
    }

    await this.prisma.task.deleteMany({
      where: { eventId },
    });

    const deleted = await this.prisma.event.delete({
      where: { id: eventId },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'deleted',
      entityId: deleted.id,
    });

    return deleted;
  }

  async getPendingApprovals(coordinatorId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.event.findMany({
      where: {
        collegeId,
        status: EventStatus.PENDING,
        club: { coordinatorId, collegeId },
      },
      include: { club: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveEvent(eventId: string, coordinatorId: string, remarks?: string) {
    await this.getCoordinatorApprovalEventOrThrow(eventId, coordinatorId);
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.APPROVED,
        approvalRemarks: remarks,
        approvedAt: new Date(),
        rejectedAt: null,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'approved',
      entityId: event.id,
      payload: {
        approvedAt: event.approvedAt,
      },
    });

    const club = await this.prisma.club.findFirst({
      where: { id: event.clubId, collegeId: this.getCurrentCollegeIdOrThrow() },
      select: { presidentId: true, vpId: true },
    });
    [club?.presidentId, club?.vpId].forEach((recipientId) => {
      if (!recipientId) return;
      this.notifications.sendNotificationToUser(recipientId, {
        title: 'Event Approved',
        message: `${event.title} is approved and ready to publish.`,
        type: 'success',
      });
    });

    return event;
  }

  async rejectEvent(eventId: string, coordinatorId: string, remarks?: string) {
    await this.getCoordinatorApprovalEventOrThrow(eventId, coordinatorId);
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.REJECTED,
        approvalRemarks: remarks,
        rejectedAt: new Date(),
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'rejected',
      entityId: event.id,
      payload: {
        remarks,
      },
    });

    const club = await this.prisma.club.findFirst({
      where: { id: event.clubId, collegeId: this.getCurrentCollegeIdOrThrow() },
      select: { presidentId: true, vpId: true },
    });
    [club?.presidentId, club?.vpId].forEach((recipientId) => {
      if (!recipientId) return;
      this.notifications.sendNotificationToUser(recipientId, {
        title: 'Event Needs Changes',
        message: `${event.title} was not approved.${remarks ? ` ${remarks}` : ''}`,
        type: 'warning',
      });
    });

    return event;
  }

  async getPublishableEvents(userId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.event.findMany({
      where: {
        collegeId,
        status: EventStatus.APPROVED,
        isPublic: false,
        club: {
          collegeId,
          OR: [{ presidentId: userId }, { vpId: userId }],
        },
      },
      include: {
        club: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async makeEventPublic(eventId: string, userId: string) {
    const event = await this.getManagedEvent(eventId, userId);
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('Event must be approved before publishing');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { isPublic: true },
    });

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'published',
      entityId: updated.id,
    });

    this.notifications.sendGlobalNotification({
      title: 'New Public Event',
      message: `${updated.title} is now open for public registration.`,
    });

    return updated;
  }

  async concludeEvent(eventId: string, requesterId: string) {
    await this.getManagedEvent(eventId, requesterId);
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.CONCLUDED },
    });

    this.aiService
      .generateGuestCertificates(eventId)
      .catch((error) => console.error('Certificate gen failed', error));

    await this.insights.recordSyncEvent({
      entityType: 'event',
      action: 'concluded',
      entityId: updated.id,
    });

    return updated;
  }

  async getPublicEvents() {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.event.findMany({
      where: { collegeId, status: EventStatus.APPROVED, isPublic: true },
      include: {
        club: { select: { name: true, description: true } },
        registrations: { select: { id: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getEventById(eventId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, collegeId },
      include: {
        club: { select: { id: true, name: true, description: true } },
        registrations: {
          select: {
            id: true,
            userId: true,
            certificateUrl: true,
            qrCode: true,
          },
        },
        proposals: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getClubEvents(clubId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.event.findMany({
      where: { clubId, collegeId },
      include: {
        club: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getRegistrationsForUser(userId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.registration.findMany({
      where: { userId, collegeId },
      include: {
        event: {
          select: { id: true, title: true, date: true, venue: true, capacity: true },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async registerForEvent(userId: string, eventId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, collegeId },
      include: {
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('Event is not approved');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) throw new BadRequestException('Already registered for this event');

    const user = await this.prisma.user.findFirst({
      where: { id: userId, collegeId },
      select: {
        id: true,
        walletAddress: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const isWaitlisted = event._count.registrations >= event.capacity;
    const registration = await this.prisma.registration.create({
      data: {
        collegeId,
        userId,
        eventId,
        isWaitlisted,
        qrCode: `CC-${eventId.slice(0, 4)}-${userId.slice(0, 4)}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
      },
    });

    await this.tokenService.mintEntryToken({
      userId,
      actionType: TokenActionType.REGISTER,
      walletAddress: user.walletAddress ?? undefined,
      eventId,
      metadata: {
        reason: 'event_registration',
        registrationId: registration.id,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'registration',
      action: isWaitlisted ? 'waitlisted' : 'registered',
      entityId: registration.id,
      payload: {
        eventId,
        userId,
      },
    });

    return registration;
  }

  async registerGuest(
    eventId: string,
    guest: {
      name: string;
      email: string;
      phone: string;
      institution?: string;
    },
  ) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, collegeId },
      include: {
        club: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('Event is not open for registration');
    }

    let guestUser = await this.prisma.user.findFirst({
      where: { email: guest.email, collegeId },
    });
    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          collegeId: event.collegeId,
          name: guest.name,
          email: guest.email,
          passwordHash: 'GUEST_NO_LOGIN',
          role: Role.GUEST,
        },
      });
    }

    const isWaitlisted = event._count.registrations >= event.capacity;
    const registration = await this.prisma.registration.create({
      data: {
        collegeId: event.collegeId,
        userId: guestUser.id,
        eventId,
        isWaitlisted,
        guestPhone: guest.phone,
        guestInstitution: guest.institution,
        qrCode: `CCG-${eventId.slice(0, 4)}-${guestUser.id
          .slice(0, 4)
          .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    });

    this.mailService
      .sendGuestRegistrationConfirmation({
        guestEmail: guest.email,
        guestName: guest.name,
        eventTitle: event.title,
        eventDate: event.date.toISOString(),
        eventVenue: event.venue,
        clubName: event.club?.name || 'Campus Club',
      })
      .catch(() => undefined);

    await this.insights.recordSyncEvent({
      entityType: 'registration',
      action: isWaitlisted ? 'guest_waitlisted' : 'guest_registered',
      entityId: registration.id,
      payload: {
        eventId,
        email: guest.email,
      },
    });

    return registration;
  }

  async getEventRegistrations(eventId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.registration.findMany({
      where: { eventId, collegeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentId: true,
            walletAddress: true,
          },
        },
      },
      orderBy: [{ isWaitlisted: 'asc' }, { registeredAt: 'asc' }],
    });
  }

  async markAttendance(registrationId: string, attended: boolean) {
    await this.findRegistrationOrThrow(registrationId);
    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { attended },
    });
  }

  async markAttendanceByQR(qrCode: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const registration = await this.prisma.registration.findFirst({
      where: { qrCode, collegeId },
    });
    if (!registration) throw new NotFoundException('Invalid QR Code');

    return this.prisma.registration.update({
      where: { id: registration.id },
      data: { attended: true },
    });
  }

  private async getManagedEvent(eventId: string, requesterId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, collegeId },
      include: {
        club: { select: { presidentId: true, vpId: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    const requester = await this.prisma.user.findFirst({
      where: { id: requesterId, collegeId },
      select: { role: true },
    });
    const isOwner =
      event.club?.presidentId === requesterId || event.club?.vpId === requesterId;
    const isAdmin = requester?.role === Role.ADMIN;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not authorized to manage this event');
    }

    return event;
  }

  private async findEventOrThrow(eventId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, collegeId },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private async findRegistrationOrThrow(registrationId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, collegeId },
      select: { id: true },
    });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    return registration;
  }

  private async getCoordinatorApprovalEventOrThrow(
    eventId: string,
    coordinatorId: string,
  ) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        collegeId,
        club: { is: { coordinatorId, collegeId } },
      },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException(
        'Event not found or not assigned to this coordinator',
      );
    }
    return event;
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new BadRequestException('College context not available');
    }
    return collegeId;
  }
}
