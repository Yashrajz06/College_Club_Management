import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.analyticsService.getLeaderboard(limit ?? 20);
  }

  @Get('timeline')
  async getTimeline(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.analyticsService.getTimeline(limit ?? 50);
  }
}
