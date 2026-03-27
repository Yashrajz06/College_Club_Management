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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const algorand_service_1 = require("./algorand.service");
const register_college_contract_dto_1 = require("./dto/register-college-contract.dto");
const prepare_wallet_transaction_dto_1 = require("./dto/prepare-wallet-transaction.dto");
const submit_wallet_transaction_dto_1 = require("./dto/submit-wallet-transaction.dto");
const finance_service_1 = require("./finance.service");
let FinanceController = class FinanceController {
    financeService;
    algorandService;
    constructor(financeService, algorandService) {
        this.financeService = financeService;
        this.algorandService = algorandService;
    }
    async createTransaction(req, body) {
        return this.financeService.logTransaction({
            amount: Number(body.amount),
            type: body.type,
            description: body.description,
            clubId: body.clubId,
            eventId: body.eventId,
            sponsorId: body.sponsorId,
            userId: req.user.userId,
        });
    }
    async prepareWalletTransaction(body) {
        return this.financeService.prepareWalletTransaction(body);
    }
    async submitWalletTransaction(body) {
        return this.financeService.submitWalletTransaction(body);
    }
    async registerCollegeContract(body) {
        return this.algorandService.registerCollegeContractDeployment(body);
    }
    async getCollegeContracts() {
        return this.algorandService.getCollegeContracts();
    }
    async getCollegeScopedTransactions(limit) {
        return this.algorandService.getCollegeScopedIndexerTransactions(limit ? Number(limit) : 25);
    }
    async getClubTransactions(clubId) {
        return this.financeService.getClubTransactions(clubId);
    }
    async getClubBalance(clubId) {
        return { balance: await this.financeService.getClubBalance(clubId) };
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Post)('transaction'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Post)('algorand/prepare'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prepare_wallet_transaction_dto_1.PrepareWalletTransactionDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "prepareWalletTransaction", null);
__decorate([
    (0, common_1.Post)('algorand/submit'),
    (0, roles_decorator_1.Roles)(client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_wallet_transaction_dto_1.SubmitWalletTransactionDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "submitWalletTransaction", null);
__decorate([
    (0, common_1.Post)('algorand/contracts'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_college_contract_dto_1.RegisterCollegeContractDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "registerCollegeContract", null);
__decorate([
    (0, common_1.Get)('algorand/contracts'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR, client_1.Role.PRESIDENT, client_1.Role.VP),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCollegeContracts", null);
__decorate([
    (0, common_1.Get)('algorand/indexer/transactions'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR, client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCollegeScopedTransactions", null);
__decorate([
    (0, common_1.Get)('club/:clubId/transactions'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR, client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('clubId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getClubTransactions", null);
__decorate([
    (0, common_1.Get)('club/:clubId/balance'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.COORDINATOR, client_1.Role.PRESIDENT, client_1.Role.VP),
    __param(0, (0, common_1.Param)('clubId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getClubBalance", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        algorand_service_1.AlgorandService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map