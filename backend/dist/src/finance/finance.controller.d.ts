import { AlgorandService } from './algorand.service';
import { RegisterCollegeContractDto } from './dto/register-college-contract.dto';
import { PrepareWalletTransactionDto } from './dto/prepare-wallet-transaction.dto';
import { SubmitWalletTransactionDto } from './dto/submit-wallet-transaction.dto';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    private readonly algorandService;
    constructor(financeService: FinanceService, algorandService: AlgorandService);
    createTransaction(req: any, body: any): Promise<{
        event: {
            title: string;
        } | null;
        sponsor: {
            name: string;
            organization: string;
        } | null;
    } & {
        collegeId: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        walletAddress: string | null;
        amount: number;
        description: string;
        date: Date;
        clubId: string;
        eventId: string | null;
        txnHash: string | null;
        blockchainActivityId: string | null;
        sponsorId: string | null;
        treasurySpendRequestId: string | null;
    }>;
    prepareWalletTransaction(body: PrepareWalletTransactionDto): Promise<{
        network: "testnet" | "localnet";
        explorerBaseUrl: string;
        note: string;
        txns: {
            txn: string;
            message: string;
        }[];
    }>;
    submitWalletTransaction(body: SubmitWalletTransactionDto): Promise<{
        event: {
            title: string;
        } | null;
        sponsor: {
            name: string;
            organization: string;
        } | null;
    } & {
        collegeId: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        walletAddress: string | null;
        amount: number;
        description: string;
        date: Date;
        clubId: string;
        eventId: string | null;
        txnHash: string | null;
        blockchainActivityId: string | null;
        sponsorId: string | null;
        treasurySpendRequestId: string | null;
    }>;
    registerCollegeContract(body: RegisterCollegeContractDto): Promise<{
        collegeId: string;
        id: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        deployedTxId: string | null;
        note: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCollegeContracts(): Promise<{
        collegeId: string;
        id: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        deployedTxId: string | null;
        note: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getCollegeScopedTransactions(limit?: string): Promise<any[]>;
    getClubTransactions(clubId: string): Promise<({
        event: {
            title: string;
        } | null;
        sponsor: {
            name: string;
            organization: string;
        } | null;
    } & {
        collegeId: string;
        id: string;
        type: import(".prisma/client").$Enums.TransactionType;
        walletAddress: string | null;
        amount: number;
        description: string;
        date: Date;
        clubId: string;
        eventId: string | null;
        txnHash: string | null;
        blockchainActivityId: string | null;
        sponsorId: string | null;
        treasurySpendRequestId: string | null;
    })[]>;
    getClubBalance(clubId: string): Promise<{
        balance: number;
    }>;
}
