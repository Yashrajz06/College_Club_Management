import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  AlgorandNetwork,
  BlockchainActionType,
  BlockchainSyncStatus,
  CollegeContractType,
  Prisma,
} from '@prisma/client';
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

@Injectable()
export class AlgorandService {
  private readonly logger = new Logger(AlgorandService.name);
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();
  private readonly algodClient: algosdk.Algodv2;
  private readonly indexerClient: algosdk.Indexer;
  private readonly algorandClient: AlgorandClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {
    const algodConfig = this.getAlgodConfig();
    const indexerConfig = this.getIndexerConfig();

    this.algodClient = new algosdk.Algodv2(
      algodConfig.token,
      algodConfig.server,
      algodConfig.port,
    );
    this.indexerClient = new algosdk.Indexer(
      indexerConfig.token,
      indexerConfig.server,
      indexerConfig.port,
    );
    this.algorandClient = AlgorandClient.fromClients({
      algod: this.algodClient,
      indexer: this.indexerClient,
    });

    const signer = this.getServerSignerOrNull();
    if (signer) {
      this.algorandClient.setSignerFromAccount(signer);
    }

    this.logger.log(
      `Algorand service ready on ${this.getNetworkName().toUpperCase()} (${algodConfig.server})`,
    );
  }

  getCurrentCollegeIdOrThrow(): string {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new InternalServerErrorException(
        'College context is required for Algorand operations.',
      );
    }
    return collegeId;
  }

  getNetworkName(): SupportedNetwork {
    const configured = (process.env.ALGORAND_NETWORK || 'testnet').toLowerCase();
    return configured === 'localnet' ? 'localnet' : 'testnet';
  }

  getNetworkEnum(): AlgorandNetwork {
    return this.getNetworkName() === 'localnet'
      ? AlgorandNetwork.LOCALNET
      : AlgorandNetwork.TESTNET;
  }

  getExplorerBaseUrl(): string {
    if (process.env.ALGORAND_EXPLORER_URL) {
      return process.env.ALGORAND_EXPLORER_URL;
    }

    return this.getNetworkName() === 'localnet'
      ? 'http://localhost:9392'
      : 'https://testnet.explorer.perawallet.app';
  }

  getAlgodClient(): algosdk.Algodv2 {
    return this.algodClient;
  }

  getIndexerClient(): algosdk.Indexer {
    return this.indexerClient;
  }

  async prepareWalletTransaction(input: PrepareWalletTransactionInput) {
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
      amount: microAlgo(input.amountMicroAlgos ?? 0),
      note: this.encoder.encode(JSON.stringify(notePayload)),
    });

    return {
      network: this.getNetworkName(),
      explorerBaseUrl: this.getExplorerBaseUrl(),
      note: JSON.stringify(notePayload),
      txns: [
        {
          txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString(
            'base64',
          ),
          message: `${input.action} for ${notePayload.collegeId}`,
        },
      ],
    };
  }

  async submitServerSignedNoteTransaction(
    input: Omit<PrepareWalletTransactionInput, 'sender'> & { sender?: string },
  ) {
    const signer = this.getServerSignerOrThrow();
    const prepared = await this.prepareWalletTransaction({
      ...input,
      sender: input.sender ?? signer.addr.toString(),
    });
    const unsigned = algosdk.decodeUnsignedTransaction(
      Buffer.from(prepared.txns[0].txn, 'base64'),
    );
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

  async broadcastSignedTransactions(signedTransactions: string[]) {
    if (signedTransactions.length === 0) {
      throw new BadRequestException('At least one signed transaction is required.');
    }

    const blobs = signedTransactions.map((txn) =>
      Uint8Array.from(Buffer.from(txn, 'base64')),
    );

    const response = await this.algodClient.sendRawTransaction(blobs).do();
    const timeoutRounds = Number(
      process.env.ALGORAND_CONFIRMATION_TIMEOUT_ROUNDS || '10',
    );
    const confirmation = await algosdk.waitForConfirmation(
      this.algodClient,
      response.txid,
      timeoutRounds,
    );

    return {
      txId: response.txid,
      confirmedRound: confirmation.confirmedRound ?? 0,
      confirmation,
    };
  }

  async registerCollegeContractDeployment(input: RegisterCollegeContractInput) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    const notePayload = this.createCollegeNotePayload({
      action: BlockchainActionType.DEPLOY,
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
      const deploymentTxId =
        input.deployedTxId ?? `pending-deploy-${input.type}-${Date.now()}`;
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
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
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
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
          note,
        },
      });

      await tx.blockchainActivity.create({
        data: {
          collegeId,
          contractId: contract.id,
          action: BlockchainActionType.DEPLOY,
          txId: deploymentTxId,
          note,
          status: input.deployedTxId
            ? BlockchainSyncStatus.CONFIRMED
            : BlockchainSyncStatus.PENDING,
          metadata: {
            ...notePayload,
            contractId: contract.id,
          } as Prisma.InputJsonValue,
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
      where: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getActiveCollegeContract(type: CollegeContractType) {
    return this.prisma.collegeContract.findFirst({
      where: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        type,
        network: this.getNetworkEnum(),
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async lookupAssetHolding(walletAddress: string, assetId: string) {
    this.assertValidAddress(walletAddress);

    const response = (await this.indexerClient
      .lookupAccountAssets(walletAddress)
      .assetId(Number(assetId))
      .do()) as {
      assets?: Array<{ amount?: number | bigint }>;
    };

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
        collegeId,
        network: this.getNetworkEnum(),
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (contracts.length === 0) {
      return [];
    }

    const searches: Array<Promise<{ transactions?: any[] }>> = [];
    const seenAddress = new Set<string>();

    for (const contract of contracts) {
      if (contract.appId) {
        searches.push(
          this.indexerClient
            .searchForTransactions()
            .applicationID(Number(contract.appId))
            .limit(limit)
            .do() as Promise<{ transactions?: any[] }>,
        );
      }

      if (contract.assetId) {
        searches.push(
          this.indexerClient
            .searchForTransactions()
            .assetID(Number(contract.assetId))
            .limit(limit)
            .do() as Promise<{ transactions?: any[] }>,
        );
      }

      if (contract.address && !seenAddress.has(contract.address)) {
        seenAddress.add(contract.address);
        searches.push(
          this.indexerClient
            .searchForTransactions()
            .address(contract.address)
            .limit(limit)
            .do() as Promise<{ transactions?: any[] }>,
        );
      }
    }

    const results = await Promise.all(searches);
    const deduped = new Map<string, any>();

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

  async triggerLifecycleAction(input: LifecycleBlockchainActionInput) {
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
            status: BlockchainSyncStatus.CONFIRMED,
            metadata: {
              ...notePayload,
              contractId: contract?.id,
            } as Prisma.InputJsonValue,
          },
        });

        return {
          status: BlockchainSyncStatus.CONFIRMED,
          txId: onChain.txId,
          activity,
        };
      } catch (error) {
        this.logger.warn(
          `Lifecycle action ${input.action} fell back to pending sync: ${String(
            error,
          )}`,
        );
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

  async submitAtomicTreasuryReleaseGroup(input: TreasuryReleaseGroupInput) {
    const signer = this.getServerSignerOrThrow();
    const sender = signer.addr.toString();
    const receiver =
      input.beneficiaryWalletAddress &&
      algosdk.isValidAddress(input.beneficiaryWalletAddress)
        ? input.beneficiaryWalletAddress
        : sender;
    const contract = await this.getActiveCollegeContract(CollegeContractType.TREASURY);
    const params = await this.algodClient.getTransactionParams().do();

    const primaryNotePayload = this.createCollegeNotePayload({
      action: BlockchainActionType.RELEASE,
      contractType: CollegeContractType.TREASURY,
      entityId: input.spendRequestId,
      metadata: {
        kind: 'treasury_release',
        proposalId: input.proposalId,
        amount: input.amount,
        receiptHash: input.receiptHash ?? null,
        receiver,
        treasuryAppId: contract?.appId ?? null,
        ...(input.metadata ?? {}),
      },
    });
    const receiptNotePayload = this.createCollegeNotePayload({
      action: BlockchainActionType.RELEASE,
      contractType: CollegeContractType.TREASURY,
      entityId: input.spendRequestId,
      metadata: {
        kind: 'receipt_hash',
        proposalId: input.proposalId,
        receiptHash: input.receiptHash ?? null,
      },
    });

    const txns = [
      algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver,
        amount: 0,
        suggestedParams: params,
        note: this.encoder.encode(JSON.stringify(primaryNotePayload)),
      }),
      algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver: sender,
        amount: 0,
        suggestedParams: params,
        note: this.encoder.encode(JSON.stringify(receiptNotePayload)),
      }),
    ];

    algosdk.assignGroupID(txns);
    const signed = txns.map((txn) => txn.signTxn(signer.sk));
    const response = await this.algodClient.sendRawTransaction(signed).do();
    const timeoutRounds = Number(
      process.env.ALGORAND_CONFIRMATION_TIMEOUT_ROUNDS || '10',
    );
    const confirmation = await algosdk.waitForConfirmation(
      this.algodClient,
      response.txid,
      timeoutRounds,
    );

    return {
      txId: txns[0].txID().toString(),
      receiptTxId: txns[1].txID().toString(),
      groupId: txns[0].group
        ? Buffer.from(txns[0].group).toString('base64')
        : null,
      sender,
      receiver,
      note: JSON.stringify(primaryNotePayload),
      receiptNote: JSON.stringify(receiptNotePayload),
      confirmation,
      confirmedRound: confirmation.confirmedRound ?? 0,
    };
  }

  private getAlgodConfig() {
    if (this.getNetworkName() === 'localnet') {
      return {
        server: process.env.ALGORAND_ALGOD_URL || 'http://localhost',
        port: process.env.ALGORAND_ALGOD_PORT || '4001',
        token:
          process.env.ALGORAND_ALGOD_TOKEN ||
          'a'.repeat(64),
      };
    }

    return {
      server:
        process.env.ALGORAND_ALGOD_URL || 'https://testnet-api.algonode.cloud',
      port: process.env.ALGORAND_ALGOD_PORT || '',
      token: process.env.ALGORAND_ALGOD_TOKEN || '',
    };
  }

  private getIndexerConfig() {
    if (this.getNetworkName() === 'localnet') {
      return {
        server: process.env.ALGORAND_INDEXER_URL || 'http://localhost',
        port: process.env.ALGORAND_INDEXER_PORT || '8980',
        token:
          process.env.ALGORAND_INDEXER_TOKEN ||
          'a'.repeat(64),
      };
    }

    return {
      server:
        process.env.ALGORAND_INDEXER_URL ||
        'https://testnet-idx.4160.nodely.dev',
      port: process.env.ALGORAND_INDEXER_PORT || '',
      token: process.env.ALGORAND_INDEXER_TOKEN || '',
    };
  }

  private getServerSignerOrNull() {
    const mnemonic = process.env.ALGORAND_SERVER_MNEMONIC?.trim();
    if (!mnemonic) {
      return null;
    }

    return algosdk.mnemonicToSecretKey(mnemonic);
  }

  private getServerSignerOrThrow() {
    const signer = this.getServerSignerOrNull();
    if (!signer) {
      throw new BadRequestException(
        'Server-side Algorand signing is not configured. Set ALGORAND_SERVER_MNEMONIC or use the wallet signing flow.',
      );
    }
    return signer;
  }

  private createCollegeNotePayload(input: WalletTransactionNoteOptions) {
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

  private getCollegeConfigPatch(input: RegisterCollegeContractInput) {
    return {
      algorandNetwork: this.getNetworkEnum(),
      algodUrl: process.env.ALGORAND_ALGOD_URL || null,
      indexerUrl: process.env.ALGORAND_INDEXER_URL || null,
      treasuryContract:
        input.type === CollegeContractType.TREASURY
          ? input.appId ?? null
          : undefined,
      treasuryAppId:
        input.type === CollegeContractType.TREASURY
          ? input.appId ?? null
          : undefined,
      treasuryAddress:
        input.type === CollegeContractType.TREASURY
          ? input.address ?? null
          : undefined,
      entryTokenAssetId:
        input.type === CollegeContractType.ENTRY_TOKEN
          ? input.assetId ?? null
          : undefined,
      soulboundAssetId:
        input.type === CollegeContractType.SOULBOUND
          ? input.assetId ?? null
          : undefined,
    };
  }

  private async createPendingLifecycleActivity(input: {
    contractId?: string;
    walletAddress?: string | null;
    action: BlockchainActionType;
    note: string;
    metadata: Record<string, unknown>;
  }) {
    const txId = `pending-${input.action.toLowerCase()}-${Date.now()}`;

    return this.prisma.blockchainActivity.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        contractId: input.contractId,
        action: input.action,
        txId,
        walletAddress: input.walletAddress ?? undefined,
        note: input.note,
        status: BlockchainSyncStatus.PENDING,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  private noteBelongsToCollege(note: string | undefined, collegeId: string) {
    if (!note) {
      return false;
    }

    try {
      const decoded = this.decoder.decode(Buffer.from(note, 'base64'));
      const payload = JSON.parse(decoded) as { collegeId?: string };
      return payload.collegeId === collegeId;
    } catch {
      return false;
    }
  }

  private assertValidAddress(address: string) {
    if (!algosdk.isValidAddress(address)) {
      throw new BadRequestException('Invalid Algorand address.');
    }
  }
}
