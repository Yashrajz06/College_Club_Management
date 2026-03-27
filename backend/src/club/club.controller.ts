import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClubService } from './club.service';

@Controller('club')
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
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create club request',
      );
    }
  }

  @Get('pending')
  @Roles(Role.ADMIN)
  async getPending() {
    return this.clubService.getPendingRequests();
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  async approveClub(@Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.clubService.approveClub(id, remarks);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  async rejectClub(@Param('id') id: string, @Body('remarks') remarks?: string) {
    return this.clubService.rejectClub(id, remarks);
  }

  @Public()
  @Get()
  async getActiveClubs() {
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
  async inviteMember(
    @Param('id') clubId: string,
    @Request() req: any,
    @Body() body: { emailOrId: string; customRole?: string },
  ) {
    return this.clubService.sendInvitation(
      clubId,
      req.user.userId,
      body.emailOrId,
      body.customRole,
    );
  }

  @Get('my-invitations')
  async getMyInvitations(@Request() req: any) {
    return this.clubService.getInvitationsForUser(req.user.userId);
  }

  @Patch('invitation/:id/respond')
  async respondToInvite(
    @Param('id') inviteId: string,
    @Request() req: any,
    @Body() body: { status: 'ACCEPTED' | 'REJECTED' },
  ) {
    return this.clubService.respondToInvitation(
      inviteId,
      req.user.userId,
      body.status,
    );
  }

  @Get(':id/members')
  async getMembers(@Param('id') clubId: string) {
    return this.clubService.getMembers(clubId);
  }

  @Public()
  @Get(':id')
  async getClub(@Param('id') clubId: string) {
    return this.clubService.getClubById(clubId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PRESIDENT, Role.VP)
  async updateClub(
    @Param('id') clubId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.clubService.updateClub(clubId, req.user.userId, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PRESIDENT, Role.VP)
  async deleteClub(@Param('id') clubId: string, @Request() req: any) {
    return this.clubService.deleteClub(clubId, req.user.userId);
  }
}
