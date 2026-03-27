import { AuthService } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            collegeId: any;
            walletAddress: any;
        };
    }>;
    register(body: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            collegeId: any;
            walletAddress: any;
        };
    }>;
    refresh(body: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            collegeId: any;
            walletAddress: any;
        };
    }>;
    setPassword(body: SetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
        year: number | null;
        id: string;
        name: string;
        email: string;
        studentId: string | null;
        department: string | null;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.Role;
        walletAddress: string | null;
        createdAt: Date;
        collegeId: string;
    }>;
    updateProfile(req: any, body: any): Promise<{
        year: number | null;
        id: string;
        name: string;
        email: string;
        studentId: string | null;
        department: string | null;
        role: import(".prisma/client").$Enums.Role;
        walletAddress: string | null;
    }>;
    connectWallet(req: any, body: {
        walletAddress: string;
    }): Promise<{
        message: string;
        walletAddress: string;
    }>;
    disconnectWallet(req: any): Promise<{
        message: string;
    }>;
}
