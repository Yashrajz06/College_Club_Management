import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('invite-coordinator')
  async inviteCoordinator(@Body() body: InviteCoordinatorDto) {
    return this.adminService.inviteCoordinator(body);
  }

  @Post('resend-invite/:userId')
  async resendInvite(@Param('userId') userId: string) {
    return this.adminService.resendInvite(userId);
  }

  @Get('coordinators')
  async getCoordinators() {
    return this.adminService.getCoordinators();
  }
}
