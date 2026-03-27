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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    cls;
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(cls) {
        super();
        this.cls = cls;
    }
    async onModuleInit() {
        await this.$connect();
        this.$use(async (params, next) => {
            let collegeId;
            try {
                collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
            }
            catch (e) { }
            const modelsWithCollegeId = [
                'User', 'Club', 'Event', 'Registration', 'Sponsor',
                'Transaction', 'Task', 'Invitation', 'ClubMember', 'CollegeConfig',
                'CollegeContract', 'BlockchainActivity', 'GovernanceProposal',
                'GovernanceVote', 'TreasurySpendRequest'
            ];
            if (collegeId && params.model && modelsWithCollegeId.includes(params.model)) {
                if (params.action === 'findUnique' || params.action === 'findFirst') {
                    params.action = 'findFirst';
                    params.args = params.args || {};
                    params.args.where = { ...params.args.where, collegeId };
                }
                else if (params.action === 'findMany') {
                    params.args = params.args || {};
                    params.args.where = { ...params.args.where, collegeId };
                }
                else if (params.action === 'updateMany' || params.action === 'deleteMany') {
                    params.args = params.args || {};
                    params.args.where = { ...params.args.where, collegeId };
                }
                else if (params.action === 'create') {
                    params.args = params.args || {};
                    params.args.data = { ...params.args.data, collegeId };
                }
                else if (params.action === 'createMany') {
                    params.args = params.args || {};
                    if (Array.isArray(params.args.data)) {
                        params.args.data = params.args.data.map((d) => ({ ...d, collegeId }));
                    }
                    else {
                        params.args.data = { ...params.args.data, collegeId };
                    }
                }
            }
            return next(params);
        });
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map