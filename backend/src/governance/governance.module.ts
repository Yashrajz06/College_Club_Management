import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [InsightsModule],
  controllers: [GovernanceController],
  providers: [GovernanceService],
})
export class GovernanceModule {}
