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
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
const ai_service_1 = require("../ai/ai.service");
const algorand_service_1 = require("../finance/algorand.service");
const insights_service_1 = require("../insights/insights.service");
const mail_service_1 = require("../mail/mail.service");
const notification_gateway_1 = require("../notification/notification/notification.gateway");
const prisma_service_1 = require("../prisma/prisma.service");
const token_service_1 = require("../token/token.service");
const client_2 = require("@prisma/client");
let EventService = class EventService {
    prisma;
    cls;
    aiService;
    mailService;
    algorand;
    insights;
    notifications;
    tokenService;
    constructor(prisma, cls, aiService, mailService, algorand, insights, notifications, tokenService) {
        this.prisma = prisma;
        this.cls = cls;
        this.aiService = aiService;
        this.mailService = mailService;
        this.algorand = algorand;
        this.insights = insights;
        this.notifications = notifications;
        this.tokenService = tokenService;
    }
    async createEvent(data) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: data.clubId, collegeId },
            select: {
                id: true,
                presidentId: true,
                vpId: true,
            },
        });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        const isOwner = club.presidentId === data.requesterId || club.vpId === data.requesterId;
        if (!isOwner) {
            throw new common_1.ForbiddenException('Not authorized to create events for this club');
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
                status: client_1.EventStatus.PENDING,
            },
        });
        const treasuryPlaceholder = await this.algorand.triggerLifecycleAction({
            action: client_1.BlockchainActionType.TREASURY_LOG,
            contractType: client_1.CollegeContractType.TREASURY,
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
                description: 'Prepare QR, attendee list, and proof-of-participation attendance workflow before the event.',
                deadline: setupDeadline,
                priority: client_1.TaskPriority.HIGH,
                status: client_1.TaskStatus.TODO,
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
    async updateEvent(eventId, requesterId, data) {
        const event = await this.getManagedEvent(eventId, requesterId);
        if (event.status === client_1.EventStatus.CONCLUDED) {
            throw new common_1.BadRequestException('Concluded events cannot be edited');
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
                status: event.status === client_1.EventStatus.REJECTED ? client_1.EventStatus.PENDING : undefined,
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
    async deleteEvent(eventId, requesterId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const event = await this.getManagedEvent(eventId, requesterId);
        const [registrationCount, transactionCount] = await Promise.all([
            this.prisma.registration.count({ where: { eventId, collegeId } }),
            this.prisma.transaction.count({ where: { eventId, collegeId } }),
        ]);
        if (registrationCount > 0 || transactionCount > 0) {
            throw new common_1.BadRequestException('Cannot delete an event that already has registrations or transactions.');
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
    async getPendingApprovals(coordinatorId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.event.findMany({
            where: {
                collegeId,
                status: client_1.EventStatus.PENDING,
                club: { coordinatorId, collegeId },
            },
            include: { club: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveEvent(eventId, coordinatorId, remarks) {
        await this.getCoordinatorApprovalEventOrThrow(eventId, coordinatorId);
        const event = await this.prisma.event.update({
            where: { id: eventId },
            data: {
                status: client_1.EventStatus.APPROVED,
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
            if (!recipientId)
                return;
            this.notifications.sendNotificationToUser(recipientId, {
                title: 'Event Approved',
                message: `${event.title} is approved and ready to publish.`,
                type: 'success',
            });
        });
        return event;
    }
    async rejectEvent(eventId, coordinatorId, remarks) {
        await this.getCoordinatorApprovalEventOrThrow(eventId, coordinatorId);
        const event = await this.prisma.event.update({
            where: { id: eventId },
            data: {
                status: client_1.EventStatus.REJECTED,
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
            if (!recipientId)
                return;
            this.notifications.sendNotificationToUser(recipientId, {
                title: 'Event Needs Changes',
                message: `${event.title} was not approved.${remarks ? ` ${remarks}` : ''}`,
                type: 'warning',
            });
        });
        return event;
    }
    async getPublishableEvents(userId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.event.findMany({
            where: {
                collegeId,
                status: client_1.EventStatus.APPROVED,
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
    async makeEventPublic(eventId, userId) {
        const event = await this.getManagedEvent(eventId, userId);
        if (event.status !== client_1.EventStatus.APPROVED) {
            throw new common_1.BadRequestException('Event must be approved before publishing');
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
    async concludeEvent(eventId, requesterId) {
        await this.getManagedEvent(eventId, requesterId);
        const updated = await this.prisma.event.update({
            where: { id: eventId },
            data: { status: client_1.EventStatus.CONCLUDED },
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
            where: { collegeId, status: client_1.EventStatus.APPROVED, isPublic: true },
            include: {
                club: { select: { name: true, description: true } },
                registrations: { select: { id: true } },
            },
            orderBy: { date: 'asc' },
        });
    }
    async getEventById(eventId) {
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
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async getClubEvents(clubId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.event.findMany({
            where: { clubId, collegeId },
            include: {
                club: { select: { name: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
    async getRegistrationsForUser(userId) {
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
    async registerForEvent(userId, eventId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, collegeId },
            include: {
                _count: { select: { registrations: true } },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED) {
            throw new common_1.BadRequestException('Event is not approved');
        }
        const existing = await this.prisma.registration.findUnique({
            where: { userId_eventId: { userId, eventId } },
        });
        if (existing)
            throw new common_1.BadRequestException('Already registered for this event');
        const user = await this.prisma.user.findFirst({
            where: { id: userId, collegeId },
            select: {
                id: true,
                walletAddress: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
            actionType: client_2.TokenActionType.REGISTER,
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
    async registerGuest(eventId, guest) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, collegeId },
            include: {
                club: { select: { name: true } },
                _count: { select: { registrations: true } },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== client_1.EventStatus.APPROVED) {
            throw new common_1.BadRequestException('Event is not open for registration');
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
                    role: client_1.Role.GUEST,
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
    async getEventRegistrations(eventId) {
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
    async markAttendance(registrationId, attended) {
        await this.findRegistrationOrThrow(registrationId);
        return this.prisma.registration.update({
            where: { id: registrationId },
            data: { attended },
        });
    }
    async markAttendanceByQR(qrCode) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const registration = await this.prisma.registration.findFirst({
            where: { qrCode, collegeId },
        });
        if (!registration)
            throw new common_1.NotFoundException('Invalid QR Code');
        return this.prisma.registration.update({
            where: { id: registration.id },
            data: { attended: true },
        });
    }
    async getManagedEvent(eventId, requesterId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, collegeId },
            include: {
                club: { select: { presidentId: true, vpId: true } },
            },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const requester = await this.prisma.user.findFirst({
            where: { id: requesterId, collegeId },
            select: { role: true },
        });
        const isOwner = event.club?.presidentId === requesterId || event.club?.vpId === requesterId;
        const isAdmin = requester?.role === client_1.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Not authorized to manage this event');
        }
        return event;
    }
    async findEventOrThrow(eventId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, collegeId },
            select: { id: true },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        return event;
    }
    async findRegistrationOrThrow(registrationId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const registration = await this.prisma.registration.findFirst({
            where: { id: registrationId, collegeId },
            select: { id: true },
        });
        if (!registration) {
            throw new common_1.NotFoundException('Registration not found');
        }
        return registration;
    }
    async getCoordinatorApprovalEventOrThrow(eventId, coordinatorId) {
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
            throw new common_1.NotFoundException('Event not found or not assigned to this coordinator');
        }
        return event;
    }
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.BadRequestException('College context not available');
        }
        return collegeId;
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nestjs_cls_1.ClsService,
        ai_service_1.AiService,
        mail_service_1.MailService,
        algorand_service_1.AlgorandService,
        insights_service_1.InsightsService,
        notification_gateway_1.NotificationGateway,
        token_service_1.TokenService])
], EventService);
//# sourceMappingURL=event.service.js.map