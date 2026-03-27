import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { InsightsModule } from '../insights/insights.module';
import { GovernanceModule } from '../governance/governance.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [InsightsModule, GovernanceModule, FinanceModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
