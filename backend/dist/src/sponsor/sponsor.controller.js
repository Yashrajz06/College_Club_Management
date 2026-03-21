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
const sponsor_service_1 = require("./sponsor.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let SponsorController = class SponsorController {
    sponsorService;
    constructor(sponsorService) {
        this.sponsorService = sponsorService;
    }
    async createSponsor(body) {
        return this.sponsorService.addSponsor(body);
    }
    async updateSponsorStatus(id, status) {
        return this.sponsorService.updateStatus(id, status);
    }
    async getClubSponsors(clubId) {
        return this.sponsorService.getSponsorsForClub(clubId);
    }
};
exports.SponsorController = SponsorController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "createSponsor", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SponsorController.prototype, "updateSponsorStatus", null);
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
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [sponsor_service_1.SponsorService])
], SponsorController);
//# sourceMappingURL=sponsor.controller.js.map