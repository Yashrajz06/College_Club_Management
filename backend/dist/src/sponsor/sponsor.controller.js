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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SponsorController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const sponsor_service_1 = require("./sponsor.service");
let SponsorController = class SponsorController {
    sponsorService;
    constructor(sponsorService) {
        this.sponsorService = sponsorService;
    }
    async createSponsor(req, body) {
        return this.sponsorService.addSponsor({
            ...body,
            requesterId: req.user.userId,
        });
    }
    async updateSponsorStatus(id, req, status) {
        return this.sponsorService.updateStatus(id, status, req.user.userId);
    }
    async createOutreachDraft(id, req, eventId) {
        return this.sponsorService.generateOutreachDraft(id, eventId, req.user.userId);
    }
    async deleteSponsor(id, req) {
        return this.sponsorService.deleteSponsor(id, req.user.userId);
    }
    async getClubSponsors(clubId) {
        return this.sponsorService.getSponsorsForClub(clubId);
    }
};
exports.SponsorController = SponsorController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "createSponsor", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "updateSponsorStatus", null);
__decorate([
    (0, common_1.Post)(':id/outreach-draft'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "createOutreachDraft", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "deleteSponsor", null);
__decorate([
    (0, common_1.Get)('club/:clubId'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Param)('clubId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "getClubSponsors", null);
exports.SponsorController = SponsorController = __decorate([
    (0, common_1.Controller)('sponsor'),
    __metadata("design:paramtypes", [sponsor_service_1.SponsorService])
], SponsorController);
//# sourceMappingURL=sponsor.controller.js.map