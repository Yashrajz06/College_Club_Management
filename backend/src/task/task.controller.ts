import { Controller, Post, Patch, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';

@Controller('task')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles(Role.PRESIDENT, Role.VP)
  async createTask(@Request() req: any, @Body() body: any) {
    return this.taskService.createTask({
      title: body.title,
      description: body.description,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      priority: body.priority || TaskPriority.MEDIUM,
      clubId: body.clubId,
      assigneeId: body.assigneeId,
      requesterId: req.user.userId,
    });
  }

  @Patch(':id/status')
  async updateStatus(@Request() req: any, @Param('id') id: string, @Body('status') status: TaskStatus) {
    return this.taskService.updateTaskStatus(id, status, req.user.userId);
  }

  @Get('club/:clubId')
  @Roles(Role.PRESIDENT, Role.VP)
  async getClubTasks(@Request() req: any, @Param('clubId') clubId: string) {
    return this.taskService.getTasksForClub(clubId, req.user.userId);
  }

  @Get('my-tasks')
  async getMyTasks(@Request() req: any) {
    return this.taskService.getTasksForUser(req.user.userId);
  }
}
