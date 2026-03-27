import { AdminService } from './admin.service';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    inviteCoordinator(body: InviteCoordinatorDto): Promise<{
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
}
