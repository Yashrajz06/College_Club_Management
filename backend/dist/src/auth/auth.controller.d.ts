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
        collegeId: string;
        id: string;
        createdAt: Date;
        name: string;
        walletAddress: string | null;
        email: string;
        studentId: string | null;
        department: string | null;
        year: number | null;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.Role;
    }>;
    updateProfile(req: any, body: any): Promise<{
        id: string;
        name: string;
        walletAddress: string | null;
        email: string;
        studentId: string | null;
        department: string | null;
        year: number | null;
        role: import(".prisma/client").$Enums.Role;
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
