"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubModule = void 0;
const common_1 = require("@nestjs/common");
const club_controller_1 = require("./club.controller");
const club_service_1 = require("./club.service");
const finance_module_1 = require("../finance/finance.module");
const insights_module_1 = require("../insights/insights.module");
let ClubModule = class ClubModule {
};
exports.ClubModule = ClubModule;
exports.ClubModule = ClubModule = __decorate([
    (0, common_1.Module)({
        imports: [finance_module_1.FinanceModule, insights_module_1.InsightsModule],
        controllers: [club_controller_1.ClubController],
        providers: [club_service_1.ClubService],
        exports: [club_service_1.ClubService],
    })
], ClubModule);
//# sourceMappingURL=club.module.js.map