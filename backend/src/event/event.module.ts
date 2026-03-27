import { forwardRef, Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AiModule } from '../ai/ai.module';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';
import { MailModule } from '../mail/mail.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [forwardRef(() => FinanceModule), InsightsModule, MailModule, AiModule, forwardRef(() => TokenModule)],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
