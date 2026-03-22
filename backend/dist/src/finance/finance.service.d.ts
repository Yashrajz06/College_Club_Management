import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { AlgorandService } from './algorand.service';
export declare class FinanceService {
    private prisma;
    private algorand;
    constructor(prisma: PrismaService, algorand: AlgorandService);
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
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        txnHash: string | null;
        eventId: string | null;
        sponsorId: string | null;
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
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        txnHash: string | null;
        eventId: string | null;
        sponsorId: string | null;
    })[]>;
    getClubBalance(clubId: string): Promise<number>;
}
