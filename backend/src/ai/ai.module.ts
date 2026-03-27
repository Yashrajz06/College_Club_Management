import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [InsightsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
