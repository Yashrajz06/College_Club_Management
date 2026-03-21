import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ─── PRESIDENT/VP routes (JWT required) ─────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP)
  async draftEvent(@Body() body: any) {
    return this.eventService.createEvent({
      ...body,
      date: new Date(body.date),
    });
  }

  // ─── COORDINATOR routes ──────────────────────────────────────────────────────
  @Get('pending-approvals')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR)
  async getPending(@Request() req: any) {
    return this.eventService.getPendingApprovals(req.user.userId);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR)
  async approveEvent(@Param('id') id: string, @Body('remarks') remarks: string) {
    return this.eventService.approveEvent(id, remarks);
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.COORDINATOR)
  async rejectEvent(@Param('id') id: string, @Body('remarks') remarks: string) {
    return this.eventService.rejectEvent(id, remarks);
  }

  // ─── PUBLIC routes (no auth needed) ─────────────────────────────────────────
  @Get('public')
  async getPublicEvents() {
    return this.eventService.getPublicEvents();
  }

  // GET /event/:id  – single public event
  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return this.eventService.getEventById(id);
  }

  // ─── REGISTRATION ────────────────────────────────────────────────────────────
  // Authenticated member register
  @Post(':id/register')
  @UseGuards(AuthGuard('jwt'))
  async register(@Param('id') id: string, @Request() req: any) {
    return this.eventService.registerForEvent(req.user.userId, id);
  }

  // Guest register (no auth)
  @Post(':id/register-guest')
  async guestRegister(@Param('id') id: string, @Body() body: any) {
    return this.eventService.registerGuest(id, body);
  }

  // ─── ATTENDANCE (President / Coordinator) ────────────────────────────────────
  @Get(':id/registrations')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async getRegistrations(@Param('id') id: string) {
    return this.eventService.getEventRegistrations(id);
  }

  @Patch(':id/attendance')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async markAttendance(@Param('id') id: string, @Body() body: { registrationId: string; attended: boolean }) {
    return this.eventService.markAttendance(body.registrationId, body.attended);
  }

  @Post('attendance/qr')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async markAttendanceByQR(@Body() body: { qrCode: string }) {
    return this.eventService.markAttendanceByQR(body.qrCode);
  }

  @Patch(':id/conclude')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP)
  async concludeEvent(@Param('id') id: string) {
    return this.eventService.concludeEvent(id);
  }

  // ─── EVENT PROMOTION (make public) ────────────────────────────────────────
  @Get('publishable')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP)
  async getPublishable(@Request() req: any) {
    return this.eventService.getPublishableEvents(req.user.userId);
  }

  @Patch(':id/public')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.PRESIDENT, Role.VP)
  async makePublic(@Param('id') id: string, @Request() req: any) {
    return this.eventService.makeEventPublic(id, req.user.userId);
  }
}
