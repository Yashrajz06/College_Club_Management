import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
export declare class TaskService {
    private prisma;
    private readonly cls;
    constructor(prisma: PrismaService, cls: ClsService);
    createTask(data: {
        title: string;
        description: string;
        deadline?: Date;
        priority: TaskPriority;
        clubId: string;
        assigneeId: string;
        requesterId: string;
    }): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        description: string;
        title: string;
        clubId: string;
        deadline: Date | null;
        eventId: string | null;
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
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        description: string;
        title: string;
        clubId: string;
        deadline: Date | null;
        eventId: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    updateTaskStatus(taskId: string, status: TaskStatus, requesterId: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        description: string;
        title: string;
        clubId: string;
        deadline: Date | null;
        eventId: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    getTasksForClub(clubId: string, requesterId: string): Promise<({
        assignee: {
            name: string;
            email: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        description: string;
        title: string;
        clubId: string;
        deadline: Date | null;
        eventId: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    })[]>;
    getTasksForUser(userId: string): Promise<({
        club: {
            name: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TaskStatus;
        description: string;
        title: string;
        clubId: string;
        deadline: Date | null;
        eventId: string | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    })[]>;
    private getCurrentCollegeIdOrThrow;
}
