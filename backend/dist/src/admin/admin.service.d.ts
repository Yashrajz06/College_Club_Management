import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';
import { ClsService } from 'nestjs-cls';
export declare class AdminService {
    private readonly prisma;
    private readonly mailService;
    private readonly cls;
    constructor(prisma: PrismaService, mailService: MailService, cls: ClsService);
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
