import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from './algorand.service';
import { TokenGateService } from './token-gate.service';
import { PrepareWalletTransactionDto } from './dto/prepare-wallet-transaction.dto';
import { SubmitWalletTransactionDto } from './dto/submit-wallet-transaction.dto';
import { TokenService } from '../token/token.service';
interface LedgerTransactionInput {
    amount: number;
    type: TransactionType;
    description: string;
    clubId: string;
    eventId?: string;
    sponsorId?: string;
    userId?: string;
    walletAddress?: string;
}
export declare class FinanceService {
    private readonly prisma;
    private readonly algorand;
    private readonly tokenGate;
    private readonly tokenService;
    constructor(prisma: PrismaService, algorand: AlgorandService, tokenGate: TokenGateService, tokenService: TokenService);
    logTransaction(data: LedgerTransactionInput): Promise<{
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
        treasurySpendRequestId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
    }>;
    prepareWalletTransaction(data: PrepareWalletTransactionDto): Promise<{
        network: "testnet" | "localnet";
        explorerBaseUrl: string;
        note: string;
        txns: {
            txn: string;
            message: string;
        }[];
    }>;
    submitWalletTransaction(data: SubmitWalletTransactionDto): Promise<{
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
        treasurySpendRequestId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
    }>;
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
        treasurySpendRequestId: string | null;
        amount: number;
        type: import(".prisma/client").$Enums.TransactionType;
        eventId: string | null;
        sponsorId: string | null;
    })[]>;
    getClubBalance(clubId: string): Promise<number>;
    private persistConfirmedLedgerTransaction;
    private validateLedgerTransactionInput;
    private assertClubExists;
    private buildLedgerMetadata;
}
export {};
