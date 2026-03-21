import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SponsorService } from './sponsor.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SponsorStatus } from '@prisma/client';

@Controller('sponsor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SponsorController {
  constructor(private readonly sponsorService: SponsorService) {}

  @Post()
  @Roles(Role.PRESIDENT, Role.VP)
  async createSponsor(@Body() body: any) {
    return this.sponsorService.addSponsor(body);
  }

  @Patch(':id/status')
  @Roles(Role.PRESIDENT, Role.VP)
  async updateSponsorStatus(@Param('id') id: string, @Body('status') status: SponsorStatus) {
    return this.sponsorService.updateStatus(id, status);
  }

  @Get('club/:clubId')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async getClubSponsors(@Param('clubId') clubId: string) {
    return this.sponsorService.getSponsorsForClub(clubId);
  }
}
