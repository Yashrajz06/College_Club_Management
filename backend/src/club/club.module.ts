import { Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';
import { NotificationModule } from '../notification/notification.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [FinanceModule, InsightsModule, NotificationModule, TokenModule],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
