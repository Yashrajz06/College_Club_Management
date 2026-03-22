import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    createTransaction(req: any, body: any): Promise<{
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
    getClubBalance(clubId: string): Promise<{
        balance: number;
    }>;
}
