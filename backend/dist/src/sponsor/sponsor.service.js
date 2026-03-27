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
exports.SponsorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
const ai_service_1 = require("../ai/ai.service");
const insights_service_1 = require("../insights/insights.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SponsorService = class SponsorService {
    prisma;
    cls;
    aiService;
    insights;
    constructor(prisma, cls, aiService, insights) {
        this.prisma = prisma;
        this.cls = cls;
        this.aiService = aiService;
        this.insights = insights;
    }
    async addSponsor(data) {
        await this.assertClubOwnership(data.clubId, data.requesterId);
        const sponsor = await this.prisma.sponsor.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                name: data.name,
                organization: data.organization,
                email: data.email,
                phone: data.phone,
                clubId: data.clubId,
                status: client_1.SponsorStatus.PROSPECT,
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
    async updateStatus(sponsorId, status, requesterId) {
        const sponsor = await this.prisma.sponsor.findFirst({
            where: { id: sponsorId },
            select: {
                id: true,
                clubId: true,
            },
        });
        if (!sponsor) {
            throw new common_1.NotFoundException('Sponsor not found');
        }
        await this.assertClubOwnership(sponsor.clubId, requesterId);
        const updated = await this.prisma.sponsor.update({
            where: { id: sponsorId },
            data: {
                status,
                lastContactedAt: status === client_1.SponsorStatus.CONTACTED ? new Date() : undefined,
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
    async generateOutreachDraft(sponsorId, eventId, requesterId) {
        const sponsor = await this.prisma.sponsor.findFirst({
            where: { id: sponsorId },
            select: { id: true, clubId: true },
        });
        if (!sponsor) {
            throw new common_1.NotFoundException('Sponsor not found');
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
    async getSponsorsForClub(clubId) {
        return this.prisma.sponsor.findMany({
            where: { clubId },
            orderBy: { createdAt: 'desc' },
            include: {
                transactions: { select: { amount: true, date: true } },
            },
        });
    }
    async deleteSponsor(sponsorId, requesterId) {
        const sponsor = await this.prisma.sponsor.findFirst({
            where: { id: sponsorId },
            select: {
                id: true,
                clubId: true,
            },
        });
        if (!sponsor)
            throw new common_1.NotFoundException('Sponsor not found');
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
    async assertClubOwnership(clubId, requesterId) {
        const club = await this.prisma.club.findFirst({
            where: { id: clubId },
            select: {
                presidentId: true,
                vpId: true,
            },
        });
        if (!club) {
            throw new common_1.NotFoundException('Club not found');
        }
        if (club.presidentId !== requesterId && club.vpId !== requesterId) {
            throw new common_1.ForbiddenException('Not authorized to manage sponsors for this club');
        }
    }
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.NotFoundException('College context not available');
        }
        return collegeId;
    }
};
exports.SponsorService = SponsorService;
exports.SponsorService = SponsorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nestjs_cls_1.ClsService,
        ai_service_1.AiService,
        insights_service_1.InsightsService])
], SponsorService);
//# sourceMappingURL=sponsor.service.js.map