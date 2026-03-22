import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { AlgorandService } from './algorand.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, AlgorandService]
})
export class FinanceModule {}
