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
        id: string;
        collegeId: string;
        walletAddress: string | null;
        description: string;
        clubId: string;
        date: Date;
        txnHash: string | null;
        blockchainActivityId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
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
        id: string;
        collegeId: string;
        walletAddress: string | null;
        description: string;
        clubId: string;
        date: Date;
        txnHash: string | null;
        blockchainActivityId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
    }>;
    registerCollegeContract(body: RegisterCollegeContractDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        deployedTxId: string | null;
        note: string | null;
        isActive: boolean;
    }>;
    getCollegeContracts(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        deployedTxId: string | null;
        note: string | null;
        isActive: boolean;
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
        id: string;
        collegeId: string;
        walletAddress: string | null;
        description: string;
        clubId: string;
        date: Date;
        txnHash: string | null;
        blockchainActivityId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
    })[]>;
    getClubBalance(clubId: string): Promise<{
        balance: number;
    }>;
}
