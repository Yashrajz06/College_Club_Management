import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  async createTask(data: { 
    title: string; 
    description: string; 
    deadline?: Date; 
    priority: TaskPriority; 
    clubId: string; 
    assigneeId: string;
    requesterId: string;
  }) {
    const club = await this.prisma.club.findUnique({
      where: { id: data.clubId },
      select: { presidentId: true, vpId: true },
    });
    if (!club) throw new BadRequestException('Club not found');

    const isOwner = club.presidentId === data.requesterId || club.vpId === data.requesterId;
    if (!isOwner) throw new ForbiddenException('Not authorized to create tasks for this club');

    const assigneeIsMember = await this.prisma.clubMember.findFirst({
      where: { userId: data.assigneeId, clubId: data.clubId },
      select: { id: true },
    });
    if (!assigneeIsMember) {
      throw new BadRequestException('Assignee must be a member of this club');
    }

    return this.prisma.task.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        priority: data.priority,
        clubId: data.clubId,
        assigneeId: data.assigneeId,
        status: TaskStatus.TODO
      }
    });
  }

  async createSystemTask(data: {
    title: string;
    description: string;
    deadline?: Date;
    priority?: TaskPriority;
    clubId: string;
    assigneeId: string;
    eventId?: string;
  }) {
    return this.prisma.task.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        priority: data.priority ?? TaskPriority.MEDIUM,
        clubId: data.clubId,
        eventId: data.eventId,
        assigneeId: data.assigneeId,
        status: TaskStatus.TODO,
      },
    });
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, requesterId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { club: { select: { presidentId: true, vpId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isAssignee = task.assigneeId === requesterId;
    const isOwner = task.club?.presidentId === requesterId || task.club?.vpId === requesterId;
    if (!isAssignee && !isOwner) throw new ForbiddenException('Not authorized to update this task');

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
  }

  async getTasksForClub(clubId: string, requesterId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { presidentId: true, vpId: true },
    });
    if (!club) throw new BadRequestException('Club not found');

    const isOwner = club.presidentId === requesterId || club.vpId === requesterId;
    if (!isOwner) throw new ForbiddenException('Not authorized to view tasks for this club');

    return this.prisma.task.findMany({
      where: { clubId },
      include: {
        assignee: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTasksForUser(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        club: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new BadRequestException('College context not available');
    }
    return collegeId;
  }
}
