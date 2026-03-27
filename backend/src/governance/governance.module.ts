import { forwardRef, Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { InsightsModule } from '../insights/insights.module';
import { FinanceModule } from '../finance/finance.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [InsightsModule, forwardRef(() => FinanceModule), forwardRef(() => TokenModule)],
  controllers: [GovernanceController],
  providers: [GovernanceService],
  exports: [GovernanceService],
})
export class GovernanceModule {}
