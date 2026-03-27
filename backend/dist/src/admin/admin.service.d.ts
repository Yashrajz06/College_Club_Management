import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationGateway } from '../notification/notification/notification.gateway';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';
import { ClsService } from 'nestjs-cls';
export declare class AdminService {
    private readonly prisma;
    private readonly mailService;
    private readonly cls;
    private readonly notifications;
    constructor(prisma: PrismaService, mailService: MailService, cls: ClsService, notifications: NotificationGateway);
    inviteCoordinator(dto: InviteCoordinatorDto): Promise<{
        message: string;
    }>;
    resendInvite(userId: string): Promise<{
        message: string;
    }>;
    getCoordinators(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        isVerified: boolean;
        coordinatedClubs: {
            id: string;
            name: string;
        }[];
    }[]>;
    private getCurrentCollegeIdOrThrow;
}
