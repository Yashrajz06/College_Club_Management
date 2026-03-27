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
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const club_service_1 = require("./club.service");
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
        catch (error) {
            throw new common_1.BadRequestException(error instanceof Error ? error.message : 'Failed to create club request');
        }
    }
    async getPending() {
        return this.clubService.getPendingRequests();
    }
    async approveClub(id, remarks) {
        return this.clubService.approveClub(id, remarks);
    }
    async rejectClub(id, remarks) {
        return this.clubService.rejectClub(id, remarks);
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
    async inviteMember(clubId, req, body) {
        return this.clubService.sendInvitation(clubId, req.user.userId, body.emailOrId, body.customRole);
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
    async getClub(clubId) {
        return this.clubService.getClubById(clubId);
    }
    async updateClub(clubId, req, body) {
        return this.clubService.updateClub(clubId, req.user.userId, body);
    }
    async deleteClub(clubId, req) {
        return this.clubService.deleteClub(clubId, req.user.userId);
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
    __param(1, (0, common_1.Body)('remarks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "approveClub", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('remarks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "rejectClub", null);
__decorate([
    (0, public_decorator_1.Public)(),
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
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
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
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "getClub", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "updateClub", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "deleteClub", null);
exports.ClubController = ClubController = __decorate([
    (0, common_1.Controller)('club'),
    __metadata("design:paramtypes", [club_service_1.ClubService])
], ClubController);
//# sourceMappingURL=club.controller.js.map