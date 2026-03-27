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
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const event_service_1 = require("./event.service");
let EventController = class EventController {
    eventService;
    constructor(eventService) {
        this.eventService = eventService;
    }
    async createEvent(req, body) {
        return this.eventService.createEvent({
            title: body.title,
            description: body.description,
            category: body.category,
            date: new Date(body.date),
            venue: body.venue,
            capacity: Number(body.capacity),
            budget: body.budget ? Number(body.budget) : 0,
            clubId: body.clubId,
            isPublic: Boolean(body.isPublic),
            requesterId: req.user.userId,
        });
    }
    async updateEvent(id, req, body) {
        return this.eventService.updateEvent(id, req.user.userId, {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.category !== undefined ? { category: body.category } : {}),
            ...(body.date ? { date: new Date(body.date) } : {}),
            ...(body.venue !== undefined ? { venue: body.venue } : {}),
            ...(body.capacity !== undefined ? { capacity: Number(body.capacity) } : {}),
            ...(body.budget !== undefined ? { budget: Number(body.budget) } : {}),
            ...(body.isPublic !== undefined ? { isPublic: Boolean(body.isPublic) } : {}),
        });
    }
    async deleteEvent(id, req) {
        return this.eventService.deleteEvent(id, req.user.userId);
    }
    async getPending(req) {
        return this.eventService.getPendingApprovals(req.user.userId);
    }
    async approveEvent(id, req, remarks) {
        return this.eventService.approveEvent(id, req.user.userId, remarks);
    }
    async rejectEvent(id, req, remarks) {
        return this.eventService.rejectEvent(id, req.user.userId, remarks);
    }
    async getPublicEvents() {
        return this.eventService.getPublicEvents();
    }
    async getClubEvents(clubId) {
        return this.eventService.getClubEvents(clubId);
    }
    async register(id, req) {
        return this.eventService.registerForEvent(req.user.userId, id);
    }
    async getMyRegistrations(req) {
        return this.eventService.getRegistrationsForUser(req.user.userId);
    }
    async guestRegister(id, body) {
        return this.eventService.registerGuest(id, body);
    }
    async getRegistrations(id) {
        return this.eventService.getEventRegistrations(id);
    }
    async markAttendance(id, body) {
        return this.eventService.markAttendance(body.registrationId, body.attended);
    }
    async markAttendanceByQR(body) {
        return this.eventService.markAttendanceByQR(body.qrCode);
    }
    async concludeEvent(id, req) {
        return this.eventService.concludeEvent(id, req.user.userId);
    }
    async getPublishable(req) {
        return this.eventService.getPublishableEvents(req.user.userId);
    }
    async makePublic(id, req) {
        return this.eventService.makeEventPublic(id, req.user.userId);
    }
    async getEventById(id) {
        return this.eventService.getEventById(id);
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.Get)('pending-approvals'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getPending", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('remarks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "approveEvent", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, roles_decorator_1.Roles)(client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)('remarks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "rejectEvent", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getPublicEvents", null);
__decorate([
    (0, common_1.Get)('club/:clubId'),
    __param(0, (0, common_1.Param)('clubId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getClubEvents", null);
__decorate([
    (0, common_1.Post)(':id/register'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('my-registrations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getMyRegistrations", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':id/register-guest'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "guestRegister", null);
__decorate([
    (0, common_1.Get)(':id/registrations'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR, client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getRegistrations", null);
__decorate([
    (0, common_1.Patch)(':id/attendance'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Post)('attendance/qr'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "markAttendanceByQR", null);
__decorate([
    (0, common_1.Patch)(':id/conclude'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "concludeEvent", null);
__decorate([
    (0, common_1.Get)('publishable'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getPublishable", null);
__decorate([
    (0, common_1.Patch)(':id/public'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "makePublic", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "getEventById", null);
exports.EventController = EventController = __decorate([
    (0, common_1.Controller)('event'),
    __metadata("design:paramtypes", [event_service_1.EventService])
], EventController);
//# sourceMappingURL=event.controller.js.map