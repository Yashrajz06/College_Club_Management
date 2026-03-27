"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const notification_gateway_1 = require("../notification/notification/notification.gateway");
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
let AdminService = class AdminService {
    prisma;
    mailService;
    cls;
    notifications;
    constructor(prisma, mailService, cls, notifications) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.cls = cls;
        this.notifications = notifications;
    }
    async inviteCoordinator(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.BadRequestException('A user with this email already exists');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        await this.prisma.user.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                name: dto.name,
                email: dto.email,
                passwordHash: '',
                role: client_1.Role.COORDINATOR,
                isVerified: false,
                inviteToken: token,
                inviteTokenExpiry: expiry,
            },
        });
        const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
        await this.mailService.sendInviteEmail(dto.email, dto.name, inviteLink);
        this.notifications.sendGlobalNotification({
            title: 'Coordinator Invited',
            message: `${dto.name} was invited as a faculty coordinator.`,
        });
        return { message: 'Invite sent successfully' };
    }
    async resendInvite(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, collegeId: this.getCurrentCollegeIdOrThrow() },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Account is already active');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                inviteToken: token,
                inviteTokenExpiry: expiry,
            },
        });
        const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
        await this.mailService.sendInviteEmail(user.email, user.name, inviteLink);
        return { message: 'Invite resent successfully' };
    }
    async getCoordinators() {
        const coordinators = await this.prisma.user.findMany({
            where: {
                role: client_1.Role.COORDINATOR,
                collegeId: this.getCurrentCollegeIdOrThrow(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                isVerified: true,
                createdAt: true,
                coordinatedClubs: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return coordinators;
    }
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.BadRequestException('College context is required');
        }
        return collegeId;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        nestjs_cls_1.ClsService,
        notification_gateway_1.NotificationGateway])
], AdminService);
//# sourceMappingURL=admin.service.js.map