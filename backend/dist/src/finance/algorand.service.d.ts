import { AlgorandNetwork, BlockchainActionType, CollegeContractType, Prisma } from '@prisma/client';
import * as algosdk from 'algosdk';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../prisma/prisma.service';
type SupportedNetwork = 'testnet' | 'localnet';
interface WalletTransactionNoteOptions {
    action: BlockchainActionType;
    contractType?: CollegeContractType;
    entityId?: string;
    metadata?: Record<string, unknown>;
}
interface PrepareWalletTransactionInput extends WalletTransactionNoteOptions {
    sender: string;
    receiver?: string;
    amountMicroAlgos?: number;
}
interface RegisterCollegeContractInput {
    type: CollegeContractType;
    appId?: string;
    assetId?: string;
    address?: string;
    deployedTxId?: string;
    metadata?: Record<string, unknown>;
}
interface LifecycleBlockchainActionInput {
    action: BlockchainActionType;
    contractType: CollegeContractType;
    entityId: string;
    walletAddress?: string | null;
    metadata?: Record<string, unknown>;
}
interface TreasuryReleaseGroupInput {
    spendRequestId: string;
    proposalId: string;
    amount: number;
    receiptHash?: string | null;
    beneficiaryWalletAddress?: string | null;
    metadata?: Record<string, unknown>;
}
export declare class AlgorandService {
    private readonly prisma;
    private readonly cls;
    private readonly logger;
    private readonly encoder;
    private readonly decoder;
    private readonly algodClient;
    private readonly indexerClient;
    private readonly algorandClient;
    constructor(prisma: PrismaService, cls: ClsService);
    getCurrentCollegeIdOrThrow(): string;
    getNetworkName(): SupportedNetwork;
    getNetworkEnum(): AlgorandNetwork;
    getExplorerBaseUrl(): string;
    getAlgodClient(): algosdk.Algodv2;
    getIndexerClient(): algosdk.Indexer;
    prepareWalletTransaction(input: PrepareWalletTransactionInput): Promise<{
        network: SupportedNetwork;
        explorerBaseUrl: string;
        note: string;
        txns: {
            txn: string;
            message: string;
        }[];
    }>;
    submitServerSignedNoteTransaction(input: Omit<PrepareWalletTransactionInput, 'sender'> & {
        sender?: string;
    }): Promise<{
        sender: string;
        note: string;
        txId: string;
        confirmedRound: number | bigint;
        confirmation: algosdk.modelsv2.PendingTransactionResponse;
    }>;
    broadcastSignedTransactions(signedTransactions: string[]): Promise<{
        txId: string;
        confirmedRound: number | bigint;
        confirmation: algosdk.modelsv2.PendingTransactionResponse;
    }>;
    registerCollegeContractDeployment(input: RegisterCollegeContractInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        metadata: Prisma.JsonValue | null;
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
        metadata: Prisma.JsonValue | null;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        deployedTxId: string | null;
        note: string | null;
        isActive: boolean;
    }[]>;
    getActiveCollegeContract(type: CollegeContractType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        type: import(".prisma/client").$Enums.CollegeContractType;
        metadata: Prisma.JsonValue | null;
        appId: string | null;
        assetId: string | null;
        address: string | null;
        network: import(".prisma/client").$Enums.AlgorandNetwork;
        deployedTxId: string | null;
        note: string | null;
        isActive: boolean;
    } | null>;
    lookupAssetHolding(walletAddress: string, assetId: string): Promise<bigint>;
    getCollegeScopedIndexerTransactions(limit?: number): Promise<any[]>;
    triggerLifecycleAction(input: LifecycleBlockchainActionInput): Promise<{
        status: import(".prisma/client").$Enums.BlockchainSyncStatus;
        txId: string;
        activity: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            collegeId: string;
            walletAddress: string | null;
            status: import(".prisma/client").$Enums.BlockchainSyncStatus;
            action: import(".prisma/client").$Enums.BlockchainActionType;
            metadata: Prisma.JsonValue | null;
            note: string | null;
            txId: string;
            contractId: string | null;
        };
    }>;
    submitAtomicTreasuryReleaseGroup(input: TreasuryReleaseGroupInput): Promise<{
        txId: string;
        receiptTxId: string;
        groupId: string | null;
        sender: string;
        receiver: string;
        note: string;
        receiptNote: string;
        confirmation: algosdk.modelsv2.PendingTransactionResponse;
        confirmedRound: number | bigint;
    }>;
    private getAlgodConfig;
    private getIndexerConfig;
    private getServerSignerOrNull;
    private getServerSignerOrThrow;
    private createCollegeNotePayload;
    private getCollegeConfigPatch;
    private createPendingLifecycleActivity;
    private noteBelongsToCollege;
    private assertValidAddress;
}
export {};
