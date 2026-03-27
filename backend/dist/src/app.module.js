"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_cls_1 = require("nestjs-cls");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const club_module_1 = require("./club/club.module");
const task_module_1 = require("./task/task.module");
const event_module_1 = require("./event/event.module");
const finance_module_1 = require("./finance/finance.module");
const sponsor_module_1 = require("./sponsor/sponsor.module");
const ai_module_1 = require("./ai/ai.module");
const media_module_1 = require("./media/media.module");
const notification_module_1 = require("./notification/notification.module");
const report_module_1 = require("./report/report.module");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
const mail_module_1 = require("./mail/mail.module");
const admin_module_1 = require("./admin/admin.module");
const college_context_middleware_1 = require("./common/middleware/college-context.middleware");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./auth/guards/roles.guard");
const token_gate_guard_1 = require("./auth/guards/token-gate.guard");
const colleges_module_1 = require("./colleges/colleges.module");
const governance_module_1 = require("./governance/governance.module");
const insights_module_1 = require("./insights/insights.module");
const supabase_module_1 = require("./supabase/supabase.module");
const treasury_module_1 = require("./treasury/treasury.module");
const attendance_module_1 = require("./attendance/attendance.module");
const token_module_1 = require("./token/token.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(college_context_middleware_1.CollegeContextMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: true },
            }),
            prisma_module_1.PrismaModule, auth_module_1.AuthModule, mail_module_1.MailModule, club_module_1.ClubModule, task_module_1.TaskModule, event_module_1.EventModule, finance_module_1.FinanceModule, treasury_module_1.TreasuryModule, attendance_module_1.AttendanceModule, token_module_1.TokenModule, sponsor_module_1.SponsorModule, ai_module_1.AiModule, media_module_1.MediaModule, notification_module_1.NotificationModule, report_module_1.ReportModule, admin_module_1.AdminModule, colleges_module_1.CollegesModule, governance_module_1.GovernanceModule, insights_module_1.InsightsModule, supabase_module_1.SupabaseModule, analytics_module_1.AnalyticsModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: token_gate_guard_1.TokenGateGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map