import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { AlgorandService } from '../finance/algorand.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private supabase;
    private readonly algorand;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, supabase: SupabaseService, algorand: AlgorandService);
    register(dto: {
        name: string;
        email: string;
        password: string;
        studentId?: string;
        department?: string;
        year?: number;
        secretCode?: string;
        collegeId?: string;
    }): Promise<{
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
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
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
    refresh(refreshToken: string): Promise<{
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
    setPassword(dto: SetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
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
    updateProfile(userId: string, data: {
        name?: string;
        department?: string;
        year?: number;
    }): Promise<{
        id: string;
        name: string;
        walletAddress: string | null;
        email: string;
        studentId: string | null;
        department: string | null;
        year: number | null;
        role: import(".prisma/client").$Enums.Role;
    }>;
    connectWallet(userId: string, walletAddress: string): Promise<{
        message: string;
        walletAddress: string;
    }>;
    disconnectWallet(userId: string): Promise<{
        message: string;
    }>;
}
