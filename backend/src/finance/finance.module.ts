import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { AlgorandService } from './algorand.service';
import { TokenGateService } from './token-gate.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, AlgorandService, TokenGateService],
  exports: [FinanceService, AlgorandService, TokenGateService],
})
export class FinanceModule {}
