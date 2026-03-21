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
exports.ClubController = void 0;
const common_1 = require("@nestjs/common");
const club_service_1 = require("./club.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let ClubController = class ClubController {
    clubService;
    constructor(clubService) {
        this.clubService = clubService;
    }
    async createRequest(req, body) {
        try {
            return await this.clubService.createClubRequest({
                name: body.name,
                description: body.description,
                category: body.category,
                presidentId: req.user.userId,
                vpEmailOrId: body.vpEmailOrId,
                coordinatorEmailOrId: body.coordinatorEmailOrId,
            });
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    async getPending() {
        return this.clubService.getPendingRequests();
    }
    async approveClub(id) {
        return this.clubService.approveClub(id);
    }
    async rejectClub(id) {
        return this.clubService.rejectClub(id);
    }
    async getActiveClubs() {
        return this.clubService.getActiveClubs();
    }
    async getGlobalStats() {
        return this.clubService.getGlobalStats();
    }
    async getAllWithStats() {
        return this.clubService.getAllClubsWithStats();
    }
    async getMyClub(req) {
        return this.clubService.getMyClub(req.user.userId);
    }
    async inviteMember(clubId, body) {
        return this.clubService.sendInvitation(clubId, body.emailOrId, body.customRole);
    }
    async getMyInvitations(req) {
        return this.clubService.getInvitationsForUser(req.user.userId);
    }
    async respondToInvite(inviteId, req, body) {
        return this.clubService.respondToInvitation(inviteId, req.user.userId, body.status);
    }
    async getMembers(clubId) {
        return this.clubService.getMembers(clubId);
    }
};
exports.ClubController = ClubController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getPending", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "approveClub", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "rejectClub", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getActiveClubs", null);
__decorate([
    (0, common_1.Get)('global-stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getGlobalStats", null);
__decorate([
    (0, common_1.Get)('all-with-stats'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getAllWithStats", null);
__decorate([
    (0, common_1.Get)('my-club'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getMyClub", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Get)('my-invitations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getMyInvitations", null);
__decorate([
    (0, common_1.Patch)('invitation/:id/respond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "respondToInvite", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getMembers", null);
exports.ClubController = ClubController = __decorate([
    (0, common_1.Controller)('club'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [club_service_1.ClubService])
], ClubController);
//# sourceMappingURL=club.controller.js.map