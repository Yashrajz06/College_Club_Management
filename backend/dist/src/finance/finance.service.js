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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logTransaction(data) {
        if (data.amount <= 0)
            throw new common_1.BadRequestException('Amount must be greater than zero');
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                    clubId: data.clubId,
                    eventId: data.eventId,
                    sponsorId: data.sponsorId
                }
            });
            const club = await tx.club.update({
                where: { id: data.clubId },
                data: {
                    prizePoolBalance: data.type === client_1.TransactionType.CREDIT
                        ? { increment: data.amount }
                        : { decrement: data.amount }
                }
            });
            if (club.prizePoolBalance < 0) {
                throw new common_1.BadRequestException('Insufficient funds in the Prize Pool');
            }
            return transaction;
        });
    }
    async getClubTransactions(clubId) {
        return this.prisma.transaction.findMany({
            where: { clubId },
            include: {
                event: { select: { title: true } },
                sponsor: { select: { organization: true } }
            },
            orderBy: { date: 'desc' }
        });
    }
    async getClubBalance(clubId) {
        const club = await this.prisma.club.findUnique({
            where: { id: clubId },
            select: { prizePoolBalance: true }
        });
        return club?.prizePoolBalance || 0;
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map