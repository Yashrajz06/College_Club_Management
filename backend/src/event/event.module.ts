import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AiModule } from '../ai/ai.module';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AiModule, MailModule, FinanceModule, InsightsModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
