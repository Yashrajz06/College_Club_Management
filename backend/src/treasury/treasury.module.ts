import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';
import { FinanceModule } from '../finance/finance.module';
import { GovernanceModule } from '../governance/governance.module';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [FinanceModule, GovernanceModule, InsightsModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
