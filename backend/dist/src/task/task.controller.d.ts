import { TaskService } from './task.service';
import { TaskStatus } from '@prisma/client';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
    createTask(req: any, body: any): Promise<{
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
    updateStatus(req: any, id: string, status: TaskStatus): Promise<{
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
    getClubTasks(req: any, clubId: string): Promise<({
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
    getMyTasks(req: any): Promise<({
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
}
