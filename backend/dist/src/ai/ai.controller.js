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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const token_gate_decorator_1 = require("../auth/decorators/token-gate.decorator");
const client_1 = require("@prisma/client");
const common_2 = require("@nestjs/common");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async draftMessage(eventId, sponsorId) {
        return this.aiService.draftSponsorMessage(eventId, sponsorId);
    }
    async generatePoster(prompt) {
        return this.aiService.generatePosterBackground(prompt);
    }
    async generateEventPoster(eventId, mood, tagline) {
        return this.aiService.generateEventPoster(eventId, { mood, tagline });
    }
    async generatePosterCopy(eventId, mood, currentFields) {
        return this.aiService.generatePosterCopySuggestions(eventId, {
            mood,
            currentFields,
        });
    }
    async getAssistantContext() {
        return this.aiService.getAssistantContext();
    }
    async chatWithAssistant(req, prompt, history) {
        return this.aiService.chatWithAssistant(req.user.userId, prompt, history);
    }
    async executeAction(req, body) {
        return this.aiService.executeSuggestedAction(req.user.userId, body.type, body.payload);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('draft-message'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('sponsorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "draftMessage", null);
__decorate([
    (0, common_1.Get)('generate-poster'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Query)('prompt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generatePoster", null);
__decorate([
    (0, common_1.Get)('generate-event-poster'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Query)('eventId')),
    __param(1, (0, common_1.Query)('mood')),
    __param(2, (0, common_1.Query)('tagline')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateEventPoster", null);
__decorate([
    (0, common_2.Post)('poster-copy'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_2.Body)('eventId')),
    __param(1, (0, common_2.Body)('mood')),
    __param(2, (0, common_2.Body)('currentFields')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generatePosterCopy", null);
__decorate([
    (0, common_1.Get)('assistant-context'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR, client_1.Role.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getAssistantContext", null);
__decorate([
    (0, common_2.Post)('chat'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR, client_1.Role.ADMIN),
    __param(0, (0, common_2.Request)()),
    __param(1, (0, common_2.Body)('prompt')),
    __param(2, (0, common_2.Body)('history')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chatWithAssistant", null);
__decorate([
    (0, common_2.Post)('execute-action'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP, client_1.Role.COORDINATOR, client_1.Role.ADMIN),
    __param(0, (0, common_2.Request)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "executeAction", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, token_gate_decorator_1.TokenGate)(client_1.BlockchainActionType.MINT),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map