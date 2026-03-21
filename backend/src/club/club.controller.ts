import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ClubService } from './club.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('club')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post('request')
  async createRequest(@Request() req: any, @Body() body: any) {
    try {
      return await this.clubService.createClubRequest({
        name: body.name,
        description: body.description,
        category: body.category,
        presidentId: req.user.userId,
        vpEmailOrId: body.vpEmailOrId,
        coordinatorEmailOrId: body.coordinatorEmailOrId,
      });
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('pending')
  @Roles(Role.ADMIN)
  async getPending() {
    return this.clubService.getPendingRequests();
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  async approveClub(@Param('id') id: string) {
    return this.clubService.approveClub(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  async rejectClub(@Param('id') id: string) {
    return this.clubService.rejectClub(id);
  }

  @Get()
  async getActiveClubs() {
    // Open to all authenticated users
    return this.clubService.getActiveClubs();
  }

  @Get('global-stats')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async getGlobalStats() {
    return this.clubService.getGlobalStats();
  }

  @Get('all-with-stats')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async getAllWithStats() {
    return this.clubService.getAllClubsWithStats();
  }

  @Get('my-club')
  @Roles(Role.PRESIDENT, Role.VP)
  async getMyClub(@Request() req: any) {
    return this.clubService.getMyClub(req.user.userId);
  }

  @Post(':id/invite')
  @Roles(Role.PRESIDENT, Role.VP)
  async inviteMember(@Param('id') clubId: string, @Body() body: { emailOrId: string, customRole?: string }) {
    return this.clubService.sendInvitation(clubId, body.emailOrId, body.customRole);
  }

  @Get('my-invitations')
  async getMyInvitations(@Request() req: any) {
    return this.clubService.getInvitationsForUser(req.user.userId);
  }

  @Patch('invitation/:id/respond')
  async respondToInvite(@Param('id') inviteId: string, @Request() req: any, @Body() body: { status: 'ACCEPTED' | 'REJECTED' }) {
    return this.clubService.respondToInvitation(inviteId, req.user.userId, body.status);
  }

  @Get(':id/members')
  async getMembers(@Param('id') clubId: string) {
    return this.clubService.getMembers(clubId);
  }
}
