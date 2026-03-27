"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const nestjs_cls_1 = require("nestjs-cls");
const notification_gateway_1 = require("../notification/notification/notification.gateway");
let TaskService = class TaskService {
    prisma;
    cls;
    notifications;
    constructor(prisma, cls, notifications) {
        this.prisma = prisma;
        this.cls = cls;
        this.notifications = notifications;
    }
    async createTask(data) {
        const club = await this.prisma.club.findUnique({
            where: { id: data.clubId },
            select: { presidentId: true, vpId: true },
        });
        if (!club)
            throw new common_1.BadRequestException('Club not found');
        const isOwner = club.presidentId === data.requesterId || club.vpId === data.requesterId;
        if (!isOwner)
            throw new common_1.ForbiddenException('Not authorized to create tasks for this club');
        const assigneeIsMember = await this.prisma.clubMember.findFirst({
            where: { userId: data.assigneeId, clubId: data.clubId },
            select: { id: true },
        });
        if (!assigneeIsMember) {
            throw new common_1.BadRequestException('Assignee must be a member of this club');
        }
        const task = await this.prisma.task.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                priority: data.priority,
                clubId: data.clubId,
                assigneeId: data.assigneeId,
                status: client_1.TaskStatus.TODO
            }
        });
        this.notifications.sendNotificationToUser(data.assigneeId, {
            title: 'New Task Assigned',
            message: `${data.title} has been assigned to you.`,
            type: 'info',
        });
        return task;
    }
    async createSystemTask(data) {
        return this.prisma.task.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                title: data.title,
                description: data.description,
                deadline: data.deadline,
                priority: data.priority ?? client_1.TaskPriority.MEDIUM,
                clubId: data.clubId,
                eventId: data.eventId,
                assigneeId: data.assigneeId,
                status: client_1.TaskStatus.TODO,
            },
        });
    }
    async updateTaskStatus(taskId, status, requesterId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { club: { select: { presidentId: true, vpId: true } } },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const isAssignee = task.assigneeId === requesterId;
        const isOwner = task.club?.presidentId === requesterId || task.club?.vpId === requesterId;
        if (!isAssignee && !isOwner)
            throw new common_1.ForbiddenException('Not authorized to update this task');
        return this.prisma.task.update({
            where: { id: taskId },
            data: { status }
        });
    }
    async getTasksForClub(clubId, requesterId) {
        const club = await this.prisma.club.findUnique({
            where: { id: clubId },
            select: { presidentId: true, vpId: true },
        });
        if (!club)
            throw new common_1.BadRequestException('Club not found');
        const isOwner = club.presidentId === requesterId || club.vpId === requesterId;
        if (!isOwner)
            throw new common_1.ForbiddenException('Not authorized to view tasks for this club');
        return this.prisma.task.findMany({
            where: { clubId },
            include: {
                assignee: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getTasksForUser(userId) {
        return this.prisma.task.findMany({
            where: { assigneeId: userId },
            include: {
                club: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.BadRequestException('College context not available');
        }
        return collegeId;
    }
};
exports.TaskService = TaskService;
exports.TaskService = TaskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nestjs_cls_1.ClsService,
        notification_gateway_1.NotificationGateway])
], TaskService);
//# sourceMappingURL=task.service.js.map