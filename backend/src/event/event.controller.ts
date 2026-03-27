import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { EventStatus, Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Roles(Role.PRESIDENT, Role.VP)
  async createEvent(@Request() req: any, @Body() body: any) {
    return this.eventService.createEvent({
      title: body.title,
      description: body.description,
      category: body.category,
      date: new Date(body.date),
      venue: body.venue,
      capacity: Number(body.capacity),
      budget: body.budget ? Number(body.budget) : 0,
      clubId: body.clubId,
      isPublic: Boolean(body.isPublic),
      requesterId: req.user.userId,
    });
  }

  @Patch(':id')
  @Roles(Role.PRESIDENT, Role.VP, Role.ADMIN)
  async updateEvent(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.eventService.updateEvent(id, req.user.userId, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.date ? { date: new Date(body.date) } : {}),
      ...(body.venue !== undefined ? { venue: body.venue } : {}),
      ...(body.capacity !== undefined ? { capacity: Number(body.capacity) } : {}),
      ...(body.budget !== undefined ? { budget: Number(body.budget) } : {}),
      ...(body.isPublic !== undefined ? { isPublic: Boolean(body.isPublic) } : {}),
    });
  }

  @Delete(':id')
  @Roles(Role.PRESIDENT, Role.VP, Role.ADMIN)
  async deleteEvent(@Param('id') id: string, @Request() req: any) {
    return this.eventService.deleteEvent(id, req.user.userId);
  }

  @Get('pending-approvals')
  @Roles(Role.COORDINATOR)
  async getPending(@Request() req: any) {
    return this.eventService.getPendingApprovals(req.user.userId);
  }

  @Patch(':id/approve')
  @Roles(Role.COORDINATOR)
  async approveEvent(
    @Param('id') id: string,
    @Request() req: any,
    @Body('remarks') remarks?: string,
  ) {
    return this.eventService.approveEvent(id, req.user.userId, remarks);
  }

  @Patch(':id/reject')
  @Roles(Role.COORDINATOR)
  async rejectEvent(
    @Param('id') id: string,
    @Request() req: any,
    @Body('remarks') remarks?: string,
  ) {
    return this.eventService.rejectEvent(id, req.user.userId, remarks);
  }

  @Public()
  @Get('public')
  async getPublicEvents() {
    return this.eventService.getPublicEvents();
  }

  @Get('club/:clubId')
  async getClubEvents(@Param('clubId') clubId: string) {
    return this.eventService.getClubEvents(clubId);
  }

  @Post(':id/register')
  async register(@Param('id') id: string, @Request() req: any) {
    return this.eventService.registerForEvent(req.user.userId, id);
  }

  @Public()
  @Post(':id/register-guest')
  async guestRegister(@Param('id') id: string, @Body() body: any) {
    return this.eventService.registerGuest(id, body);
  }

  @Get(':id/registrations')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async getRegistrations(@Param('id') id: string) {
    return this.eventService.getEventRegistrations(id);
  }

  @Patch(':id/attendance')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async markAttendance(
    @Param('id') id: string,
    @Body() body: { registrationId: string; attended: boolean },
  ) {
    return this.eventService.markAttendance(body.registrationId, body.attended);
  }

  @Post('attendance/qr')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR)
  async markAttendanceByQR(@Body() body: { qrCode: string }) {
    return this.eventService.markAttendanceByQR(body.qrCode);
  }

  @Patch(':id/conclude')
  @Roles(Role.PRESIDENT, Role.VP)
  async concludeEvent(@Param('id') id: string, @Request() req: any) {
    return this.eventService.concludeEvent(id, req.user.userId);
  }

  @Get('publishable')
  @Roles(Role.PRESIDENT, Role.VP)
  async getPublishable(@Request() req: any) {
    return this.eventService.getPublishableEvents(req.user.userId);
  }

  @Patch(':id/public')
  @Roles(Role.PRESIDENT, Role.VP)
  async makePublic(@Param('id') id: string, @Request() req: any) {
    return this.eventService.makeEventPublic(id, req.user.userId);
  }

  @Public()
  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return this.eventService.getEventById(id);
  }
}
