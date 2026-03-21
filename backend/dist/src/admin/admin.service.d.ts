import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    inviteCoordinator(dto: InviteCoordinatorDto): Promise<{
        message: string;
    }>;
    resendInvite(userId: string): Promise<{
        message: string;
    }>;
    getCoordinators(): Promise<{
        id: string;
        email: string;
        name: string;
        isVerified: boolean;
        createdAt: Date;
        coordinatedClubs: {
            id: string;
            name: string;
        }[];
    }[]>;
}
