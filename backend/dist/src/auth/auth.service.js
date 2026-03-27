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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const supabase_service_1 = require("../supabase/supabase.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const algorand_service_1 = require("../finance/algorand.service");
const client_2 = require("@prisma/client");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    supabase;
    algorand;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, supabase, algorand) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.supabase = supabase;
        this.algorand = algorand;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        let role = client_1.Role.MEMBER;
        if (dto.secretCode) {
            if (dto.secretCode === (process.env.ADMIN_SECRET || 'admin-secret-123')) {
                role = client_1.Role.ADMIN;
            }
            else if (dto.secretCode === (process.env.COORDINATOR_SECRET || 'faculty-secret-123')) {
                role = client_1.Role.COORDINATOR;
            }
            else {
                throw new common_1.UnauthorizedException('Invalid registration secret code');
            }
        }
        const college = dto.collegeId
            ? await this.prisma.college.findFirst({
                where: { id: dto.collegeId },
                select: { id: true, domain: true },
            })
            : await this.prisma.college.findFirst({
                where: {
                    domain: dto.email.split('@')[1]?.toLowerCase(),
                },
                select: { id: true, domain: true },
            });
        if (!college) {
            throw new common_1.BadRequestException('No college matched this registration. Select a college first or use an email with a registered college domain.');
        }
        const user = await this.prisma.user.create({
            data: {
                collegeId: college.id,
                name: dto.name,
                email: dto.email,
                passwordHash,
                studentId: dto.studentId,
                department: dto.department,
                year: dto.year,
                role: role,
            }
        });
        const { passwordHash: _, ...result } = user;
        this.logger.log(`[Analytics Sync] New user registered: ${user.id} role=${role}`);
        return this.login(result);
    }
    async validateUser(email, pass) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && user.passwordHash) {
            const isMatch = await bcrypt.compare(pass, user.passwordHash);
            if (isMatch) {
                const { passwordHash, ...result } = user;
                return result;
            }
        }
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role, collegeId: user.collegeId };
        this.logger.log(`[Analytics Sync] User login: ${user.id}`);
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_for_hackathon',
                expiresIn: '7d'
            }),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                collegeId: user.collegeId,
                walletAddress: user.walletAddress || null,
            }
        };
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_for_hackathon'
            });
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user)
                throw new common_1.UnauthorizedException();
            return this.login(user);
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async setPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: { inviteToken: dto.token },
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired invite link');
        }
        if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
            throw new common_1.BadRequestException('Invite link has expired. Please ask the admin to resend.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                isVerified: true,
                inviteToken: null,
                inviteTokenExpiry: null,
            },
        });
        return { message: 'Password set successfully. You can now log in.' };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, role: true, walletAddress: true,
                studentId: true, department: true, year: true, isVerified: true,
                collegeId: true, createdAt: true,
            },
        });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return user;
    }
    async updateProfile(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.department && { department: data.department }),
                ...(data.year && { year: data.year }),
            },
            select: {
                id: true, name: true, email: true, role: true, walletAddress: true,
                studentId: true, department: true, year: true,
            },
        });
    }
    async connectWallet(userId, walletAddress) {
        try {
            const sb = this.supabase.getClient();
            await sb.from('User').update({ walletAddress }).eq('id', userId);
        }
        catch {
            await this.prisma.user.update({
                where: { id: userId },
                data: { walletAddress },
            });
        }
        await this.algorand.triggerLifecycleAction({
            action: client_2.BlockchainActionType.MINT,
            contractType: client_2.CollegeContractType.ENTRY_TOKEN,
            entityId: userId,
            walletAddress,
            metadata: {
                reason: 'profile_setup',
                userId,
                targetWalletAddress: walletAddress,
            },
        });
        return { message: 'Wallet connected', walletAddress };
    }
    async disconnectWallet(userId) {
        try {
            const sb = this.supabase.getClient();
            await sb.from('User').update({ walletAddress: null }).eq('id', userId);
        }
        catch {
            await this.prisma.user.update({
                where: { id: userId },
                data: { walletAddress: null },
            });
        }
        return { message: 'Wallet disconnected' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        supabase_service_1.SupabaseService,
        algorand_service_1.AlgorandService])
], AuthService);
//# sourceMappingURL=auth.service.js.map