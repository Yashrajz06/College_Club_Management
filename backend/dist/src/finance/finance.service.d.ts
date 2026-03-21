import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
export declare class FinanceService {
    private prisma;
    constructor(prisma: PrismaService);
    logTransaction(data: {
        amount: number;
        type: TransactionType;
        description: string;
        clubId: string;
        eventId?: string;
        sponsorId?: string;
        userId: string;
    }): Promise<{
        id: string;
        description: string;
        clubId: string;
        date: Date;
        eventId: string | null;
        sponsorId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
    }>;
    getClubTransactions(clubId: string): Promise<({
        event: {
            title: string;
        } | null;
        sponsor: {
            organization: string;
        } | null;
    } & {
        id: string;
        description: string;
        clubId: string;
        date: Date;
        eventId: string | null;
        sponsorId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
    })[]>;
    getClubBalance(clubId: string): Promise<number>;
}
