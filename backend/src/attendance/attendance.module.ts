import { forwardRef, Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [forwardRef(() => FinanceModule), InsightsModule, forwardRef(() => TokenModule)],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
