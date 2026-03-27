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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const algorand_service_1 = require("./algorand.service");
const token_gate_service_1 = require("./token-gate.service");
let FinanceService = class FinanceService {
    prisma;
    algorand;
    tokenGate;
    constructor(prisma, algorand, tokenGate) {
        this.prisma = prisma;
        this.algorand = algorand;
        this.tokenGate = tokenGate;
    }
    async logTransaction(data) {
        await this.validateLedgerTransactionInput(data);
        const onChain = await this.algorand.submitServerSignedNoteTransaction({
            action: client_1.BlockchainActionType.TREASURY_LOG,
            contractType: client_1.CollegeContractType.TREASURY,
            metadata: this.buildLedgerMetadata(data),
        });
        return this.persistConfirmedLedgerTransaction({
            ...data,
            walletAddress: onChain.sender,
            txId: onChain.txId,
            note: onChain.note,
        });
    }
    async prepareWalletTransaction(data) {
        await this.validateLedgerTransactionInput(data);
        await this.tokenGate.assertWalletEligibleForAction({
            walletAddress: data.walletAddress,
            action: data.action ?? client_1.BlockchainActionType.TREASURY_LOG,
        });
        return this.algorand.prepareWalletTransaction({
            sender: data.walletAddress,
            action: data.action ?? client_1.BlockchainActionType.TREASURY_LOG,
            contractType: data.contractType ?? client_1.CollegeContractType.TREASURY,
            metadata: this.buildLedgerMetadata(data),
        });
    }
    async submitWalletTransaction(data) {
        await this.validateLedgerTransactionInput(data);
        const onChain = await this.algorand.broadcastSignedTransactions(data.signedTransactions);
        return this.persistConfirmedLedgerTransaction({
            ...data,
            txId: onChain.txId,
            note: data.note,
        });
    }
    async getClubTransactions(clubId) {
        await this.assertClubExists(clubId);
        return this.prisma.transaction.findMany({
            where: { clubId },
            include: {
                event: { select: { title: true } },
                sponsor: { select: { name: true, organization: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
    async getClubBalance(clubId) {
        const club = await this.assertClubExists(clubId);
        return club.prizePoolBalance || 0;
    }
    async persistConfirmedLedgerTransaction(data) {
        const treasuryContract = await this.algorand.getActiveCollegeContract(client_1.CollegeContractType.TREASURY);
        const collegeId = this.algorand.getCurrentCollegeIdOrThrow();
        return this.prisma.$transaction(async (tx) => {
            const activity = await tx.blockchainActivity.create({
                data: {
                    collegeId,
                    contractId: treasuryContract?.id,
                    action: client_1.BlockchainActionType.TREASURY_LOG,
                    txId: data.txId,
                    walletAddress: data.walletAddress,
                    note: data.note,
                    status: client_1.BlockchainSyncStatus.CONFIRMED,
                    metadata: {
                        ...this.buildLedgerMetadata(data),
                        txnHash: data.txId,
                    },
                },
            });
            const transaction = await tx.transaction.create({
                data: {
                    collegeId,
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                    clubId: data.clubId,
                    eventId: data.eventId,
                    sponsorId: data.sponsorId,
                    txnHash: data.txId,
                    walletAddress: data.walletAddress,
                    blockchainActivityId: activity.id,
                },
                include: {
                    event: { select: { title: true } },
                    sponsor: { select: { name: true, organization: true } },
                },
            });
            const club = await tx.club.update({
                where: { id: data.clubId },
                data: {
                    prizePoolBalance: data.type === client_1.TransactionType.CREDIT
                        ? { increment: data.amount }
                        : { decrement: data.amount },
                },
            });
            if (club.prizePoolBalance < 0) {
                throw new common_1.BadRequestException('Insufficient funds in the Prize Pool');
            }
            return transaction;
        });
    }
    async validateLedgerTransactionInput(data) {
        if (data.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be greater than zero');
        }
        const club = await this.assertClubExists(data.clubId);
        if (data.type === client_1.TransactionType.DEBIT &&
            club.prizePoolBalance - data.amount < 0) {
            throw new common_1.BadRequestException('Insufficient funds in the Prize Pool');
        }
        if (data.eventId) {
            const event = await this.prisma.event.findFirst({
                where: {
                    id: data.eventId,
                    clubId: data.clubId,
                },
            });
            if (!event) {
                throw new common_1.NotFoundException('Event not found for this club.');
            }
        }
        if (data.sponsorId) {
            const sponsor = await this.prisma.sponsor.findFirst({
                where: {
                    id: data.sponsorId,
                    clubId: data.clubId,
                },
            });
            if (!sponsor) {
                throw new common_1.NotFoundException('Sponsor not found for this club.');
            }
        }
    }
    async assertClubExists(clubId) {
        const club = await this.prisma.club.findFirst({
            where: { id: clubId },
            select: { id: true, prizePoolBalance: true },
        });
        if (!club) {
            throw new common_1.NotFoundException('Club not found.');
        }
        return club;
    }
    buildLedgerMetadata(data) {
        return {
            clubId: data.clubId,
            eventId: data.eventId,
            sponsorId: data.sponsorId,
            description: data.description,
            amount: data.amount,
            type: data.type,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        algorand_service_1.AlgorandService,
        token_gate_service_1.TokenGateService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map