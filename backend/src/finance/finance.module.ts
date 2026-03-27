import { forwardRef, Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { AlgorandService } from './algorand.service';
import { TokenGateService } from './token-gate.service';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [forwardRef(() => TokenModule)],
  controllers: [FinanceController],
  providers: [FinanceService, AlgorandService, TokenGateService],
  exports: [FinanceService, AlgorandService, TokenGateService],
})
export class FinanceModule {}
