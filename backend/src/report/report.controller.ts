import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { Response } from 'express';

@Controller('report')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('event/:eventId')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.PRESIDENT, Role.VP)
  async getEventReport(@Param('eventId') eventId: string, @Res() res: Response) {
    const buffer = await this.reportService.generateEventSummary(eventId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="event_${eventId}_report.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
