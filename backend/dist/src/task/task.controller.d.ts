import { TaskService } from './task.service';
import { TaskStatus } from '@prisma/client';
export declare class TaskController {
    private readonly taskService;
    constructor(taskService: TaskService);
    createTask(req: any, body: any): Promise<{
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
    updateStatus(req: any, id: string, status: TaskStatus): Promise<{
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
    getClubTasks(req: any, clubId: string): Promise<({
        assignee: {
            email: string;
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
    getMyTasks(req: any): Promise<({
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
}
