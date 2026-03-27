import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { NotificationGateway } from '../notification/notification/notification.gateway';
export declare class TaskService {
    private prisma;
    private readonly cls;
    private readonly notifications;
    constructor(prisma: PrismaService, cls: ClsService, notifications: NotificationGateway);
    createTask(data: {
        title: string;
        description: string;
        deadline?: Date;
        priority: TaskPriority;
        clubId: string;
        assigneeId: string;
        requesterId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        eventId: string | null;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    createSystemTask(data: {
        title: string;
        description: string;
        deadline?: Date;
        priority?: TaskPriority;
        clubId: string;
        assigneeId: string;
        eventId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        eventId: string | null;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    updateTaskStatus(taskId: string, status: TaskStatus, requesterId: string): Promise<{
        id: string;
        createdAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        eventId: string | null;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    getTasksForClub(clubId: string, requesterId: string): Promise<({
        assignee: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        eventId: string | null;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    })[]>;
    getTasksForUser(userId: string): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        eventId: string | null;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    })[]>;
    private getCurrentCollegeIdOrThrow;
}
