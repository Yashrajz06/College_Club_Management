import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { Role, SponsorStatus } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { SponsorService } from './sponsor.service';

@Controller('sponsor')
export class SponsorController {
  constructor(private readonly sponsorService: SponsorService) {}

  @Post()
  @Roles(Role.PRESIDENT, Role.VP)
  async createSponsor(@Request() req: any, @Body() body: any) {
    return this.sponsorService.addSponsor({
      ...body,
      requesterId: req.user.userId,
    });
  }

  @Patch(':id/status')
  @Roles(Role.PRESIDENT, Role.VP)
  async updateSponsorStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: SponsorStatus,
  ) {
    return this.sponsorService.updateStatus(id, status, req.user.userId);
  }

  @Post(':id/outreach-draft')
  @Roles(Role.PRESIDENT, Role.VP)
  async createOutreachDraft(
    @Param('id') id: string,
    @Request() req: any,
    @Body('eventId') eventId: string,
  ) {
    return this.sponsorService.generateOutreachDraft(
      id,
      eventId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT, Role.VP)
  async deleteSponsor(@Param('id') id: string, @Request() req: any) {
    return this.sponsorService.deleteSponsor(id, req.user.userId);
  }

  @Get('club/:clubId')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async getClubSponsors(@Param('clubId') clubId: string) {
    return this.sponsorService.getSponsorsForClub(clubId);
  }
}
