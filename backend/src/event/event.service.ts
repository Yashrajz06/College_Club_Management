import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private mailService: MailService,
  ) {}

  async createEvent(data: {
    title: string; description: string; date: Date; venue: string;
    capacity: number; budget?: number; clubId: string; isPublic: boolean;
  }) {
    return this.prisma.event.create({ data: { ...data, status: EventStatus.PENDING } });
  }

  async getPendingApprovals(coordinatorId: string) {
    return this.prisma.event.findMany({
      where: { status: EventStatus.PENDING, club: { coordinatorId } },
      include: { club: { select: { name: true } } },
    });
  }

  async approveEvent(eventId: string, remarks?: string) {
    return this.prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.APPROVED } });
  }

  async rejectEvent(eventId: string, remarks?: string) {
    return this.prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.REJECTED } });
  }

  async getPublishableEvents(userId: string) {
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.APPROVED,
        isPublic: false,
        club: {
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
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { club: { select: { id: true, presidentId: true, vpId: true } } },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException('Event must be approved before publishing');
    }

    const isOwner = event.club?.presidentId === userId || event.club?.vpId === userId;
    if (!isOwner) throw new ForbiddenException('Not authorized to publish this event');

    return this.prisma.event.update({
      where: { id: eventId },
      data: { isPublic: true },
    });
  }

  async concludeEvent(eventId: string) {
    const updated = await this.prisma.event.update({ where: { id: eventId }, data: { status: EventStatus.CONCLUDED } });
    
    // Proactively trigger AI certificates for guests
    this.aiService.generateGuestCertificates(eventId).catch(e => console.error('Certificate gen failed', e));

    return updated;
  }

  async getPublicEvents() {
    return this.prisma.event.findMany({
      where: { status: EventStatus.APPROVED, isPublic: true },
      include: {
        club: { select: { name: true, description: true } },
        registrations: { select: { id: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getEventById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: { select: { name: true, description: true } },
        registrations: { select: { id: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async registerForEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.APPROVED) throw new BadRequestException('Event is not approved');

    const existing = await this.prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) throw new BadRequestException('Already registered for this event');

    const isWaitlisted = event._count.registrations >= event.capacity;
    return this.prisma.registration.create({
      data: {
        userId,
        eventId,
        isWaitlisted,
        qrCode: `CC-${eventId.slice(0, 4)}-${userId.slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      }
    });
  }

  async registerGuest(eventId: string, guest: {
    name: string; email: string; phone: string; institution?: string;
  }) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: { select: { name: true } },
        _count: { select: { registrations: true } }
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.APPROVED) throw new BadRequestException('Event is not open for registration');

    // For guest: find or create a guest user
    let guestUser = await this.prisma.user.findUnique({ where: { email: guest.email } });
    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          name: guest.name,
          email: guest.email,
          passwordHash: 'GUEST_NO_LOGIN',
          role: 'GUEST',
        },
      });
    }

    const isWaitlisted = event._count.registrations >= event.capacity;
    const registration = await this.prisma.registration.create({
      data: {
        userId: guestUser.id,
        eventId,
        isWaitlisted,
        qrCode: `CCG-${eventId.slice(0, 4)}-${guestUser.id.slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      },
    });

    // Non-fatal: confirmation email should not break registration.
    this.mailService.sendGuestRegistrationConfirmation({
      guestEmail: guest.email,
      guestName: guest.name,
      eventTitle: event.title,
      eventDate: event.date.toISOString(),
      eventVenue: event.venue,
      clubName: event.club?.name || 'Campus Club',
    }).catch(() => {});

    return registration;
  }

  async getEventRegistrations(eventId: string) {
    return this.prisma.registration.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, studentId: true } },
      },
      orderBy: [{ isWaitlisted: 'asc' }, { registeredAt: 'asc' }],
    });
  }

  async markAttendance(registrationId: string, attended: boolean) {
    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { attended },
    });
  }

  async markAttendanceByQR(qrCode: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { qrCode },
    });
    if (!registration) throw new NotFoundException('Invalid QR Code');
    
    return this.prisma.registration.update({
      where: { id: registration.id },
      data: { attended: true },
    });
  }
}
