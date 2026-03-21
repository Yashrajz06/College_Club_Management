import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    createTransaction(req: any, body: any): Promise<{
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
    getClubBalance(clubId: string): Promise<{
        balance: number;
    }>;
}
