import { forwardRef, Module } from '@nestjs/common';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { FinanceModule } from '../finance/finance.module';
import { InsightsModule } from '../insights/insights.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [forwardRef(() => FinanceModule), InsightsModule, forwardRef(() => TokenModule)],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService],
})
export class ClubModule {}
