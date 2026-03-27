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
exports.ClubService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
const algorand_service_1 = require("../finance/algorand.service");
const insights_service_1 = require("../insights/insights.service");
const prisma_service_1 = require("../prisma/prisma.service");
const token_service_1 = require("../token/token.service");
const client_2 = require("@prisma/client");
let ClubService = class ClubService {
    prisma;
    cls;
    algorand;
    insights;
    tokenService;
    constructor(prisma, cls, algorand, insights, tokenService) {
        this.prisma = prisma;
        this.cls = cls;
        this.algorand = algorand;
        this.insights = insights;
        this.tokenService = tokenService;
    }
    async createClubRequest(data) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const existing = await this.prisma.club.findFirst({
            where: { collegeId, name: data.name },
            select: { id: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('Club name already exists');
        }
        const [president, vpUser, coordinatorUser] = await Promise.all([
            this.prisma.user.findFirst({
                where: { id: data.presidentId, collegeId },
            }),
            this.prisma.user.findFirst({
                where: {
                    collegeId,
                    OR: [
                        { email: data.vpEmailOrId },
                        { studentId: data.vpEmailOrId },
                    ],
                },
            }),
            this.prisma.user.findFirst({
                where: {
                    collegeId,
                    OR: [
                        { email: data.coordinatorEmailOrId },
                        { studentId: data.coordinatorEmailOrId },
                    ],
                },
            }),
        ]);
        if (!president)
            throw new common_1.NotFoundException('President not found');
        if (!vpUser)
            throw new common_1.NotFoundException('Vice President not found');
        if (!coordinatorUser) {
            throw new common_1.NotFoundException('Faculty Coordinator not found');
        }
        const club = await this.prisma.club.create({
            data: {
                collegeId,
                name: data.name,
                description: data.description,
                category: data.category,
                status: client_1.ClubStatus.PENDING,
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
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.club.findMany({
            where: { collegeId, status: client_1.ClubStatus.PENDING },
            include: {
                president: { select: { name: true, email: true } },
                coordinator: { select: { name: true, email: true } },
                vp: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveClub(clubId, remarks) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
            include: {
                president: {
                    select: { id: true, walletAddress: true },
                },
            },
        });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        if (!club.presidentId || !club.vpId || !club.coordinatorId) {
            throw new common_1.BadRequestException('Club missing compulsory positions (PRESIDENT/VP/COORDINATOR)');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const approvedClub = await tx.club.update({
                where: { id: clubId },
                data: {
                    status: client_1.ClubStatus.ACTIVE,
                    approvalRemarks: remarks,
                    approvedAt: new Date(),
                    rejectedAt: null,
                },
            });
            await tx.user.update({
                where: { id: club.presidentId },
                data: { role: client_1.Role.PRESIDENT },
            });
            await tx.user.update({
                where: { id: club.vpId },
                data: { role: client_1.Role.VP },
            });
            await tx.user.update({
                where: { id: club.coordinatorId },
                data: { role: client_1.Role.COORDINATOR },
            });
            await this.ensureMembership(tx, clubId, club.presidentId, 'President');
            await this.ensureMembership(tx, clubId, club.vpId, 'Vice President');
            return approvedClub;
        });
        await this.tokenService.mintEntryToken({
            userId: club.presidentId,
            actionType: client_2.TokenActionType.JOIN,
            walletAddress: club.president?.walletAddress ?? undefined,
            clubId: updated.id,
            metadata: {
                reason: 'club_approval_founder',
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
    async rejectClub(clubId, remarks) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const existing = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
            select: { id: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Club not found');
        }
        const club = await this.prisma.club.update({
            where: { id: clubId },
            data: {
                status: client_1.ClubStatus.INACTIVE,
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
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.club.findMany({
            where: { collegeId, status: client_1.ClubStatus.ACTIVE },
            include: {
                president: { select: { id: true, name: true, email: true } },
                coordinator: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getClubById(clubId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
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
            throw new common_1.NotFoundException('Club not found');
        }
        return club;
    }
    async updateClub(clubId, userId, data) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
            include: {
                president: { select: { id: true } },
            },
        });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        const requester = await this.prisma.user.findFirst({
            where: { id: userId, collegeId },
            select: { role: true },
        });
        const isOwner = club.presidentId === userId || club.vpId === userId;
        const isAdmin = requester?.role === client_1.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Not authorized to update this club');
        }
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.description)
            updateData.description = data.description;
        if (data.category)
            updateData.category = data.category;
        if (data.coordinatorEmailOrId) {
            const coordinator = await this.prisma.user.findFirst({
                where: {
                    collegeId,
                    OR: [
                        { email: data.coordinatorEmailOrId },
                        { studentId: data.coordinatorEmailOrId },
                    ],
                },
            });
            if (!coordinator) {
                throw new common_1.NotFoundException('Faculty Coordinator not found');
            }
            updateData.coordinatorId = coordinator.id;
        }
        if (data.vpEmailOrId) {
            const vp = await this.prisma.user.findFirst({
                where: {
                    collegeId,
                    OR: [
                        { email: data.vpEmailOrId },
                        { studentId: data.vpEmailOrId },
                    ],
                },
            });
            if (!vp) {
                throw new common_1.NotFoundException('Vice President not found');
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
    async deleteClub(clubId, userId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
            select: {
                id: true,
                presidentId: true,
                vpId: true,
            },
        });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        const requester = await this.prisma.user.findFirst({
            where: { id: userId, collegeId },
            select: { role: true },
        });
        const isOwner = club.presidentId === userId || club.vpId === userId;
        const isAdmin = requester?.role === client_1.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Not authorized to archive this club');
        }
        const archived = await this.prisma.club.update({
            where: { id: clubId },
            data: { status: client_1.ClubStatus.INACTIVE },
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
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.club.findMany({
            where: { collegeId },
            include: {
                _count: { select: { members: true, events: true } },
                president: { select: { name: true, email: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getMyClub(userId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.club.findFirst({
            where: { collegeId, OR: [{ presidentId: userId }, { vpId: userId }] },
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
    async sendInvitation(clubId, senderId, emailOrId, customRole) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const club = await this.prisma.club.findFirst({
            where: { id: clubId, collegeId },
            select: {
                presidentId: true,
                vpId: true,
            },
        });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        const isOwner = club.presidentId === senderId || club.vpId === senderId;
        if (!isOwner) {
            throw new common_1.ForbiddenException('Not authorized to invite members to this club');
        }
        const user = await this.prisma.user.findFirst({
            where: {
                collegeId,
                OR: [{ email: emailOrId }, { studentId: emailOrId }],
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Student not found');
        return this.prisma.invitation.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                clubId,
                userId: user.id,
                customRole,
            },
        });
    }
    async getInvitationsForUser(userId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.invitation.findMany({
            where: { collegeId, userId, status: 'PENDING' },
            include: { club: { select: { name: true, category: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async respondToInvitation(invitationId, userId, status) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const invite = await this.prisma.invitation.findFirst({
            where: { id: invitationId, collegeId },
        });
        if (!invite || invite.userId !== userId) {
            throw new common_1.NotFoundException('Invitation not found or unauthorized');
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
            const member = await this.prisma.user.findFirst({
                where: { id: invite.userId, collegeId },
                select: { walletAddress: true },
            });
            await this.tokenService.mintEntryToken({
                userId: invite.userId,
                actionType: client_2.TokenActionType.JOIN,
                walletAddress: member?.walletAddress ?? undefined,
                clubId: invite.clubId,
            });
        }
        return this.prisma.invitation.update({
            where: { id: invitationId },
            data: { status },
        });
    }
    async getMembers(clubId) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        return this.prisma.clubMember.findMany({
            where: { clubId, collegeId },
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async ensureMembership(tx, clubId, userId, customRole) {
        const existing = await tx.clubMember.findFirst({
            where: { userId, clubId, collegeId: this.getCurrentCollegeIdOrThrow() },
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
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.BadRequestException('College context not available');
        }
        return collegeId;
    }
};
exports.ClubService = ClubService;
exports.ClubService = ClubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nestjs_cls_1.ClsService,
        algorand_service_1.AlgorandService,
        insights_service_1.InsightsService,
        token_service_1.TokenService])
], ClubService);
//# sourceMappingURL=club.service.js.map