import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
export declare class TaskService {
    private prisma;
    constructor(prisma: PrismaService);
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
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    updateTaskStatus(taskId: string, status: TaskStatus, requesterId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    }>;
    getTasksForClub(clubId: string, requesterId: string): Promise<({
        assignee: {
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
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
        description: string;
        status: import(".prisma/client").$Enums.TaskStatus;
        clubId: string;
        title: string;
        deadline: Date | null;
        priority: import(".prisma/client").$Enums.TaskPriority;
        assigneeId: string;
    })[]>;
}
