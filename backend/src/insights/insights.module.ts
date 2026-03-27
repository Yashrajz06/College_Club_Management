import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { InsightsService } from './insights.service';

@Module({
  imports: [FinanceModule],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
