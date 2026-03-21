import { Module } from '@nestjs/common';
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

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, ClubModule, TaskModule, EventModule, FinanceModule, SponsorModule, AiModule, MediaModule, NotificationModule, ReportModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
