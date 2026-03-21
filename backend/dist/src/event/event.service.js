"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const mail_service_1 = require("../mail/mail.service");
const client_1 = require("@prisma/client");
let EventService = class EventService {
    prisma;
    aiService;
    mailService;
    constructor(prisma, aiService, mailService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.mailService = mailService;
    }
    async createEvent(data) {
        return this.prisma.event.create({ data: { ...data, status: client_1.EventStatus.PENDING } });
    }
    async getPendingApprovals(coordinatorId) {
        return this.prisma.event.findMany({
            where: { status: client_1.EventStatus.PENDING, club: { coordinatorId } },
            include: { club: { select: { name: true } } },
        });
    }
    async approveEvent(eventId, remarks) {
        return this.prisma.event.update({ where: { id: eventId }, data: { status: client_1.EventStatus.APPROVED } });
    }
    async rejectEvent(eventId, remarks) {
        return this.prisma.event.update({ where: { id: eventId }, data: { status: client_1.EventStatus.REJECTED } });
    }
    async getPublishableEvents(userId) {
        return this.prisma.event.findMany({
            where: {
                status: client_1.EventStatus.APPROVED,
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
    async makeEventPublic(eventId, userId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { club: { select: { id: true, presidentId: true, vpId: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED) {
            throw new common_1.BadRequestException('Event must be approved before publishing');
        }
        const isOwner = event.club?.presidentId === userId || event.club?.vpId === userId;
        if (!isOwner)
            throw new common_1.ForbiddenException('Not authorized to publish this event');
        return this.prisma.event.update({
            where: { id: eventId },
            data: { isPublic: true },
        });
    }
    async concludeEvent(eventId) {
        const updated = await this.prisma.event.update({ where: { id: eventId }, data: { status: client_1.EventStatus.CONCLUDED } });
        this.aiService.generateGuestCertificates(eventId).catch(e => console.error('Certificate gen failed', e));
        return updated;
    }
    async getPublicEvents() {
        return this.prisma.event.findMany({
            where: { status: client_1.EventStatus.APPROVED, isPublic: true },
            include: {
                club: { select: { name: true, description: true } },
                registrations: { select: { id: true } },
            },
            orderBy: { date: 'asc' },
        });
    }
    async getEventById(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                club: { select: { name: true, description: true } },
                registrations: { select: { id: true } },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async registerForEvent(userId, eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { _count: { select: { registrations: true } } },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw new common_1.BadRequestException('Event is not approved');
        const existing = await this.prisma.registration.findUnique({
            where: { userId_eventId: { userId, eventId } },
        });
        if (existing)
            throw new common_1.BadRequestException('Already registered for this event');
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
    async registerGuest(eventId, guest) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                club: { select: { name: true } },
                _count: { select: { registrations: true } }
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED)
            throw new common_1.BadRequestException('Event is not open for registration');
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
        this.mailService.sendGuestRegistrationConfirmation({
            guestEmail: guest.email,
            guestName: guest.name,
            eventTitle: event.title,
            eventDate: event.date.toISOString(),
            eventVenue: event.venue,
            clubName: event.club?.name || 'Campus Club',
        }).catch(() => { });
        return registration;
    }
    async getEventRegistrations(eventId) {
        return this.prisma.registration.findMany({
            where: { eventId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, studentId: true } },
            },
            orderBy: [{ isWaitlisted: 'asc' }, { registeredAt: 'asc' }],
        });
    }
    async markAttendance(registrationId, attended) {
        return this.prisma.registration.update({
            where: { id: registrationId },
            data: { attended },
        });
    }
    async markAttendanceByQR(qrCode) {
        const registration = await this.prisma.registration.findUnique({
            where: { qrCode },
        });
        if (!registration)
            throw new common_1.NotFoundException('Invalid QR Code');
        return this.prisma.registration.update({
            where: { id: registration.id },
            data: { attended: true },
        });
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        mail_service_1.MailService])
], EventService);
//# sourceMappingURL=event.service.js.map