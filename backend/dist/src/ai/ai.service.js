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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = class AiService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async draftSponsorMessage(eventId, sponsorId) {
        const event = await this.prisma.event.findUnique({ where: { id: eventId }, include: { club: true } });
        const sponsor = await this.prisma.sponsor.findUnique({ where: { id: sponsorId } });
        if (!event || !sponsor)
            throw new Error("Event or Sponsor not found");
        return {
            subject: `Sponsorship Opportunity: ${event.title}`,
            message: `Dear ${sponsor.name},\n\nWe at ${event.club.name} are hosting an exciting event "${event.title}" on ${event.date.toLocaleDateString()} at ${event.venue}.\n\nGiven ${sponsor.organization}'s esteemed position, we would love to invite you to sponsor our event. We are expecting a footfall of ${event.capacity} students.\n\nLooking forward to your response.\n\nBest Regards,\nThe Team at ${event.club.name}`
        };
    }
    async generatePosterBackground(prompt) {
        const keyword = prompt.split(' ')[0] || 'college';
        return { imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)},abstract,event` };
    }
    async generateGuestCertificates(eventId) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: { where: { attended: true, user: { role: 'GUEST' } }, include: { user: true } },
                club: true,
            },
        });
        if (!event)
            return;
        for (const reg of event.registrations) {
            console.log(`Generating AI Thank-You Certificate for guest: ${reg.user.name} for event: ${event.title}`);
            const certificateUrl = `https://source.unsplash.com/800x600/?diploma,certificate,appreciation,${event.club.name.toLowerCase().replace(/ /g, ',')}`;
            await this.prisma.registration.update({
                where: { id: reg.id },
                data: { certificateUrl }
            });
        }
        return { count: event.registrations.length, status: 'certificates_completed' };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map