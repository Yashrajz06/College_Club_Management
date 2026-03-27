import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClubModule } from './club/club.module';
import { TaskModule } from './task/task.module';
import { EventModule } from './event/event.module';
import { FinanceModule } from './finance/finance.module';
import { SponsorModule } from './sponsor/sponsor.module';
import { AiModule } from './ai/ai.module';
import { MediaModule } from './media/media.module';
import { NotificationModule } from './notification/notification.module';
import { ReportModule } from './report/report.module';

import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { CollegeContextMiddleware } from './common/middleware/college-context.middleware';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CollegesModule } from './colleges/colleges.module';
import { GovernanceModule } from './governance/governance.module';
import { InsightsModule } from './insights/insights.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TreasuryModule } from './treasury/treasury.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    PrismaModule, AuthModule, MailModule, ClubModule, TaskModule, EventModule, FinanceModule, TreasuryModule, SponsorModule, AiModule, MediaModule, NotificationModule, ReportModule, AdminModule, CollegesModule, GovernanceModule, InsightsModule, SupabaseModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CollegeContextMiddleware)
      .forRoutes('*');
  }
}
