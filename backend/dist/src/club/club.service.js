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
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ClubService = class ClubService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createClubRequest(data) {
        const existing = await this.prisma.club.findUnique({ where: { name: data.name } });
        if (existing)
            throw new Error("Club name already exists");
        const vpUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: data.vpEmailOrId }, { studentId: data.vpEmailOrId }] },
        });
        if (!vpUser)
            throw new common_1.NotFoundException('Vice President not found');
        let coordinatorId;
        if (!data.coordinatorEmailOrId) {
            throw new common_1.BadRequestException('coordinatorEmailOrId is required');
        }
        const coordinatorUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: data.coordinatorEmailOrId }, { studentId: data.coordinatorEmailOrId }] },
        });
        if (!coordinatorUser)
            throw new common_1.NotFoundException('Faculty Coordinator not found');
        coordinatorId = coordinatorUser.id;
        return this.prisma.club.create({
            data: {
                name: data.name,
                description: data.description,
                category: data.category,
                status: client_1.ClubStatus.PENDING,
                presidentId: data.presidentId,
                vpId: vpUser.id,
                coordinatorId,
            }
        });
    }
    async getPendingRequests() {
        return this.prisma.club.findMany({
            where: { status: client_1.ClubStatus.PENDING },
            include: { president: { select: { name: true, email: true } }, coordinator: { select: { name: true } } }
        });
    }
    async approveClub(clubId) {
        const club = await this.prisma.club.findUnique({ where: { id: clubId } });
        if (!club)
            throw new common_1.NotFoundException('Club not found');
        const updated = await this.prisma.club.update({
            where: { id: clubId },
            data: { status: client_1.ClubStatus.ACTIVE }
        });
        if (!club.presidentId || !club.vpId || !club.coordinatorId) {
            throw new common_1.BadRequestException('Club missing compulsory positions (PRESIDENT/VP/COORDINATOR)');
        }
        await this.prisma.user.update({
            where: { id: club.presidentId },
            data: { role: client_1.Role.PRESIDENT }
        });
        const presMember = await this.prisma.clubMember.findFirst({
            where: { userId: club.presidentId, clubId: clubId },
        });
        if (!presMember) {
            await this.prisma.clubMember.create({
                data: { userId: club.presidentId, clubId: clubId, customRole: 'President' },
            });
        }
        else {
            await this.prisma.clubMember.update({
                where: { id: presMember.id },
                data: { customRole: 'President' },
            });
        }
        await this.prisma.user.update({
            where: { id: club.vpId },
            data: { role: client_1.Role.VP }
        });
        const vpMember = await this.prisma.clubMember.findFirst({
            where: { userId: club.vpId, clubId: clubId },
        });
        if (!vpMember) {
            await this.prisma.clubMember.create({
                data: { userId: club.vpId, clubId: clubId, customRole: 'VP' },
            });
        }
        else {
            await this.prisma.clubMember.update({
                where: { id: vpMember.id },
                data: { customRole: 'VP' },
            });
        }
        await this.prisma.user.update({
            where: { id: club.coordinatorId },
            data: { role: client_1.Role.COORDINATOR }
        });
        return updated;
    }
    async rejectClub(clubId) {
        return this.prisma.club.update({
            where: { id: clubId },
            data: { status: client_1.ClubStatus.INACTIVE }
        });
    }
    async getActiveClubs() {
        return this.prisma.club.findMany({
            where: { status: client_1.ClubStatus.ACTIVE },
            include: { president: { select: { name: true } } }
        });
    }
    async getGlobalStats() {
        const [clubCount, memberCount, eventCount, totalBudget] = await Promise.all([
            this.prisma.club.count({ where: { status: client_1.ClubStatus.ACTIVE } }),
            this.prisma.user.count({ where: { NOT: { role: client_1.Role.GUEST } } }),
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
    async getMyClub(userId) {
        return this.prisma.club.findFirst({
            where: { OR: [{ presidentId: userId }, { vpId: userId }] },
            select: { id: true, name: true },
        });
    }
    async sendInvitation(clubId, emailOrId, customRole) {
        const user = await this.prisma.user.findFirst({
            where: { OR: [{ email: emailOrId }, { studentId: emailOrId }] },
        });
        if (!user)
            throw new common_1.NotFoundException('Student not found');
        return this.prisma.invitation.create({
            data: {
                clubId,
                userId: user.id,
                customRole,
            },
        });
    }
    async getInvitationsForUser(userId) {
        return this.prisma.invitation.findMany({
            where: { userId, status: 'PENDING' },
            include: { club: { select: { name: true, category: true } } },
        });
    }
    async respondToInvitation(invitationId, userId, status) {
        const invite = await this.prisma.invitation.findUnique({
            where: { id: invitationId },
        });
        if (!invite || invite.userId !== userId)
            throw new Error('Invitation not found or unauthorized');
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
    async getMembers(clubId) {
        return this.prisma.clubMember.findMany({
            where: { clubId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    }
};
exports.ClubService = ClubService;
exports.ClubService = ClubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClubService);
//# sourceMappingURL=club.service.js.map