import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AiModule } from '../ai/ai.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AiModule, MailModule],
  controllers: [EventController],
  providers: [EventService]
})
export class EventModule {}
