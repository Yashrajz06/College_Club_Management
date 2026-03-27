import { Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [FinanceModule, InsightsModule],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
