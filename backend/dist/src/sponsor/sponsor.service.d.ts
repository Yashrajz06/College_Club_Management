import { PrismaService } from '../prisma/prisma.service';
import { SponsorStatus } from '@prisma/client';
export declare class SponsorService {
    private prisma;
    constructor(prisma: PrismaService);
    addSponsor(data: {
        name: string;
        organization: string;
        email?: string;
        phone?: string;
        clubId: string;
    }): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    }>;
    updateStatus(sponsorId: string, status: SponsorStatus): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    }>;
    getSponsorsForClub(clubId: string): Promise<({
        transactions: {
            date: Date;
            amount: number;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    })[]>;
}
