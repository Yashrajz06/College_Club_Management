import { Module } from '@nestjs/common';
import { SponsorController } from './sponsor.controller';
import { SponsorService } from './sponsor.service';
import { AiModule } from '../ai/ai.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [AiModule, InsightsModule],
  controllers: [SponsorController],
  providers: [SponsorService],
  exports: [SponsorService],
})
export class SponsorModule {}
