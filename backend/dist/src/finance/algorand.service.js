"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AlgorandService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorandService = void 0;
const algokit_utils_1 = require("@algorandfoundation/algokit-utils");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const algosdk = __importStar(require("algosdk"));
const nestjs_cls_1 = require("nestjs-cls");
const prisma_service_1 = require("../prisma/prisma.service");
let AlgorandService = AlgorandService_1 = class AlgorandService {
    prisma;
    cls;
    logger = new common_1.Logger(AlgorandService_1.name);
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    algodClient;
    indexerClient;
    algorandClient;
    constructor(prisma, cls) {
        this.prisma = prisma;
        this.cls = cls;
        const algodConfig = this.getAlgodConfig();
        const indexerConfig = this.getIndexerConfig();
        this.algodClient = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port);
        this.indexerClient = new algosdk.Indexer(indexerConfig.token, indexerConfig.server, indexerConfig.port);
        this.algorandClient = algokit_utils_1.AlgorandClient.fromClients({
            algod: this.algodClient,
            indexer: this.indexerClient,
        });
        const signer = this.getServerSignerOrNull();
        if (signer) {
            this.algorandClient.setSignerFromAccount(signer);
        }
        this.logger.log(`Algorand service ready on ${this.getNetworkName().toUpperCase()} (${algodConfig.server})`);
    }
    getCurrentCollegeIdOrThrow() {
        const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
        if (!collegeId) {
            throw new common_1.InternalServerErrorException('College context is required for Algorand operations.');
        }
        return collegeId;
    }
    getNetworkName() {
        const configured = (process.env.ALGORAND_NETWORK || 'testnet').toLowerCase();
        return configured === 'localnet' ? 'localnet' : 'testnet';
    }
    getNetworkEnum() {
        return this.getNetworkName() === 'localnet'
            ? client_1.AlgorandNetwork.LOCALNET
            : client_1.AlgorandNetwork.TESTNET;
    }
    getExplorerBaseUrl() {
        if (process.env.ALGORAND_EXPLORER_URL) {
            return process.env.ALGORAND_EXPLORER_URL;
        }
        return this.getNetworkName() === 'localnet'
            ? 'http://localhost:9392'
            : 'https://testnet.explorer.perawallet.app';
    }
    getAlgodClient() {
        return this.algodClient;
    }
    getIndexerClient() {
        return this.indexerClient;
    }
    async prepareWalletTransaction(input) {
        this.assertValidAddress(input.sender);
        const receiver = input.receiver ?? input.sender;
        this.assertValidAddress(receiver);
        const notePayload = this.createCollegeNotePayload({
            action: input.action,
            contractType: input.contractType,
            entityId: input.entityId,
            metadata: input.metadata,
        });
        const txn = await this.algorandClient.createTransaction.payment({
            sender: input.sender,
            receiver,
            amount: (0, algokit_utils_1.microAlgo)(input.amountMicroAlgos ?? 0),
            note: this.encoder.encode(JSON.stringify(notePayload)),
        });
        return {
            network: this.getNetworkName(),
            explorerBaseUrl: this.getExplorerBaseUrl(),
            note: JSON.stringify(notePayload),
            txns: [
                {
                    txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64'),
                    message: `${input.action} for ${notePayload.collegeId}`,
                },
            ],
        };
    }
    async submitServerSignedNoteTransaction(input) {
        const signer = this.getServerSignerOrThrow();
        const prepared = await this.prepareWalletTransaction({
            ...input,
            sender: input.sender ?? signer.addr.toString(),
        });
        const unsigned = algosdk.decodeUnsignedTransaction(Buffer.from(prepared.txns[0].txn, 'base64'));
        const signed = unsigned.signTxn(signer.sk);
        const result = await this.broadcastSignedTransactions([
            Buffer.from(signed).toString('base64'),
        ]);
        return {
            ...result,
            sender: signer.addr.toString(),
            note: prepared.note,
        };
    }
    async broadcastSignedTransactions(signedTransactions) {
        if (signedTransactions.length === 0) {
            throw new common_1.BadRequestException('At least one signed transaction is required.');
        }
        const blobs = signedTransactions.map((txn) => Uint8Array.from(Buffer.from(txn, 'base64')));
        const response = await this.algodClient.sendRawTransaction(blobs).do();
        const timeoutRounds = Number(process.env.ALGORAND_CONFIRMATION_TIMEOUT_ROUNDS || '10');
        const confirmation = await algosdk.waitForConfirmation(this.algodClient, response.txid, timeoutRounds);
        return {
            txId: response.txid,
            confirmedRound: confirmation.confirmedRound ?? 0,
            confirmation,
        };
    }
    async registerCollegeContractDeployment(input) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const notePayload = this.createCollegeNotePayload({
            action: client_1.BlockchainActionType.DEPLOY,
            contractType: input.type,
            metadata: {
                appId: input.appId,
                assetId: input.assetId,
                address: input.address,
                ...(input.metadata ?? {}),
            },
        });
        const note = JSON.stringify(notePayload);
        const network = this.getNetworkEnum();
        return this.prisma.$transaction(async (tx) => {
            const deploymentTxId = input.deployedTxId ?? `pending-deploy-${input.type}-${Date.now()}`;
            const contract = await tx.collegeContract.upsert({
                where: {
                    collegeId_type_network: {
                        collegeId,
                        type: input.type,
                        network,
                    },
                },
                update: {
                    appId: input.appId,
                    assetId: input.assetId,
                    address: input.address,
                    deployedTxId: input.deployedTxId,
                    metadata: (input.metadata ?? {}),
                    note,
                    isActive: true,
                },
                create: {
                    collegeId,
                    type: input.type,
                    network,
                    appId: input.appId,
                    assetId: input.assetId,
                    address: input.address,
                    deployedTxId: input.deployedTxId,
                    metadata: (input.metadata ?? {}),
                    note,
                },
            });
            await tx.blockchainActivity.create({
                data: {
                    collegeId,
                    contractId: contract.id,
                    action: client_1.BlockchainActionType.DEPLOY,
                    txId: deploymentTxId,
                    note,
                    status: input.deployedTxId
                        ? client_1.BlockchainSyncStatus.CONFIRMED
                        : client_1.BlockchainSyncStatus.PENDING,
                    metadata: {
                        ...notePayload,
                        contractId: contract.id,
                    },
                },
            });
            await tx.collegeConfig.upsert({
                where: { collegeId },
                update: this.getCollegeConfigPatch(input),
                create: {
                    collegeId,
                    ...this.getCollegeConfigPatch(input),
                },
            });
            return contract;
        });
    }
    async getCollegeContracts() {
        return this.prisma.collegeContract.findMany({
            orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getActiveCollegeContract(type) {
        return this.prisma.collegeContract.findFirst({
            where: {
                type,
                network: this.getNetworkEnum(),
                isActive: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async lookupAssetHolding(walletAddress, assetId) {
        this.assertValidAddress(walletAddress);
        const response = (await this.indexerClient
            .lookupAccountAssets(walletAddress)
            .assetId(Number(assetId))
            .do());
        const amount = response.assets?.[0]?.amount;
        if (typeof amount === 'bigint') {
            return amount;
        }
        return BigInt(amount ?? 0);
    }
    async getCollegeScopedIndexerTransactions(limit = 25) {
        const collegeId = this.getCurrentCollegeIdOrThrow();
        const contracts = await this.prisma.collegeContract.findMany({
            where: {
                network: this.getNetworkEnum(),
                isActive: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (contracts.length === 0) {
            return [];
        }
        const searches = [];
        const seenAddress = new Set();
        for (const contract of contracts) {
            if (contract.appId) {
                searches.push(this.indexerClient
                    .searchForTransactions()
                    .applicationID(Number(contract.appId))
                    .limit(limit)
                    .do());
            }
            if (contract.assetId) {
                searches.push(this.indexerClient
                    .searchForTransactions()
                    .assetID(Number(contract.assetId))
                    .limit(limit)
                    .do());
            }
            if (contract.address && !seenAddress.has(contract.address)) {
                seenAddress.add(contract.address);
                searches.push(this.indexerClient
                    .searchForTransactions()
                    .address(contract.address)
                    .limit(limit)
                    .do());
            }
        }
        const results = await Promise.all(searches);
        const deduped = new Map();
        for (const result of results) {
            for (const transaction of result.transactions ?? []) {
                if (deduped.has(transaction.id)) {
                    continue;
                }
                if (this.noteBelongsToCollege(transaction.note, collegeId)) {
                    deduped.set(transaction.id, transaction);
                }
            }
        }
        return Array.from(deduped.values()).slice(0, limit);
    }
    async triggerLifecycleAction(input) {
        const contract = await this.getActiveCollegeContract(input.contractType);
        const notePayload = this.createCollegeNotePayload({
            action: input.action,
            contractType: input.contractType,
            entityId: input.entityId,
            metadata: input.metadata,
        });
        const note = JSON.stringify(notePayload);
        if (input.walletAddress && algosdk.isValidAddress(input.walletAddress)) {
            try {
                const onChain = await this.submitServerSignedNoteTransaction({
                    action: input.action,
                    contractType: input.contractType,
                    metadata: input.metadata,
                    entityId: input.entityId,
                });
                const activity = await this.prisma.blockchainActivity.create({
                    data: {
                        collegeId: this.getCurrentCollegeIdOrThrow(),
                        contractId: contract?.id,
                        action: input.action,
                        txId: onChain.txId,
                        walletAddress: input.walletAddress,
                        note: onChain.note,
                        status: client_1.BlockchainSyncStatus.CONFIRMED,
                        metadata: {
                            ...notePayload,
                            contractId: contract?.id,
                        },
                    },
                });
                return {
                    status: client_1.BlockchainSyncStatus.CONFIRMED,
                    txId: onChain.txId,
                    activity,
                };
            }
            catch (error) {
                this.logger.warn(`Lifecycle action ${input.action} fell back to pending sync: ${String(error)}`);
            }
        }
        const pending = await this.createPendingLifecycleActivity({
            contractId: contract?.id,
            walletAddress: input.walletAddress,
            action: input.action,
            note,
            metadata: notePayload,
        });
        return {
            status: pending.status,
            txId: pending.txId,
            activity: pending,
        };
    }
    getAlgodConfig() {
        if (this.getNetworkName() === 'localnet') {
            return {
                server: process.env.ALGORAND_ALGOD_URL || 'http://localhost',
                port: process.env.ALGORAND_ALGOD_PORT || '4001',
                token: process.env.ALGORAND_ALGOD_TOKEN ||
                    'a'.repeat(64),
            };
        }
        return {
            server: process.env.ALGORAND_ALGOD_URL || 'https://testnet-api.algonode.cloud',
            port: process.env.ALGORAND_ALGOD_PORT || '',
            token: process.env.ALGORAND_ALGOD_TOKEN || '',
        };
    }
    getIndexerConfig() {
        if (this.getNetworkName() === 'localnet') {
            return {
                server: process.env.ALGORAND_INDEXER_URL || 'http://localhost',
                port: process.env.ALGORAND_INDEXER_PORT || '8980',
                token: process.env.ALGORAND_INDEXER_TOKEN ||
                    'a'.repeat(64),
            };
        }
        return {
            server: process.env.ALGORAND_INDEXER_URL ||
                'https://testnet-idx.4160.nodely.dev',
            port: process.env.ALGORAND_INDEXER_PORT || '',
            token: process.env.ALGORAND_INDEXER_TOKEN || '',
        };
    }
    getServerSignerOrNull() {
        const mnemonic = process.env.ALGORAND_SERVER_MNEMONIC?.trim();
        if (!mnemonic) {
            return null;
        }
        return algosdk.mnemonicToSecretKey(mnemonic);
    }
    getServerSignerOrThrow() {
        const signer = this.getServerSignerOrNull();
        if (!signer) {
            throw new common_1.BadRequestException('Server-side Algorand signing is not configured. Set ALGORAND_SERVER_MNEMONIC or use the wallet signing flow.');
        }
        return signer;
    }
    createCollegeNotePayload(input) {
        return {
            app: 'CampusClubs',
            version: 1,
            collegeId: this.getCurrentCollegeIdOrThrow(),
            network: this.getNetworkName(),
            action: input.action,
            contractType: input.contractType,
            entityId: input.entityId,
            timestamp: new Date().toISOString(),
            ...(input.metadata ?? {}),
        };
    }
    getCollegeConfigPatch(input) {
        return {
            algorandNetwork: this.getNetworkEnum(),
            algodUrl: process.env.ALGORAND_ALGOD_URL || null,
            indexerUrl: process.env.ALGORAND_INDEXER_URL || null,
            treasuryContract: input.type === client_1.CollegeContractType.TREASURY
                ? input.appId ?? null
                : undefined,
            treasuryAppId: input.type === client_1.CollegeContractType.TREASURY
                ? input.appId ?? null
                : undefined,
            treasuryAddress: input.type === client_1.CollegeContractType.TREASURY
                ? input.address ?? null
                : undefined,
            entryTokenAssetId: input.type === client_1.CollegeContractType.ENTRY_TOKEN
                ? input.assetId ?? null
                : undefined,
            soulboundAssetId: input.type === client_1.CollegeContractType.SOULBOUND
                ? input.assetId ?? null
                : undefined,
        };
    }
    async createPendingLifecycleActivity(input) {
        const txId = `pending-${input.action.toLowerCase()}-${Date.now()}`;
        return this.prisma.blockchainActivity.create({
            data: {
                collegeId: this.getCurrentCollegeIdOrThrow(),
                contractId: input.contractId,
                action: input.action,
                txId,
                walletAddress: input.walletAddress ?? undefined,
                note: input.note,
                status: client_1.BlockchainSyncStatus.PENDING,
                metadata: input.metadata,
            },
        });
    }
    noteBelongsToCollege(note, collegeId) {
        if (!note) {
            return false;
        }
        try {
            const decoded = this.decoder.decode(Buffer.from(note, 'base64'));
            const payload = JSON.parse(decoded);
            return payload.collegeId === collegeId;
        }
        catch {
            return false;
        }
    }
    assertValidAddress(address) {
        if (!algosdk.isValidAddress(address)) {
            throw new common_1.BadRequestException('Invalid Algorand address.');
        }
    }
};
exports.AlgorandService = AlgorandService;
exports.AlgorandService = AlgorandService = AlgorandService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nestjs_cls_1.ClsService])
], AlgorandService);
//# sourceMappingURL=algorand.service.js.map