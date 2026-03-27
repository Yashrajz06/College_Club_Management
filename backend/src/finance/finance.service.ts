import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  BlockchainSyncStatus,
  CollegeContractType,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from './algorand.service';
import { TokenGateService } from './token-gate.service';
import { PrepareWalletTransactionDto } from './dto/prepare-wallet-transaction.dto';
import { SubmitWalletTransactionDto } from './dto/submit-wallet-transaction.dto';
import { forwardRef, Inject } from '@nestjs/common';
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

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly algorand: AlgorandService,
    private readonly tokenGate: TokenGateService,
    @Inject(forwardRef(() => TokenService)) private readonly tokenService: TokenService,
  ) {}

  async logTransaction(data: LedgerTransactionInput) {
    await this.validateLedgerTransactionInput(data);

    const onChain = await this.algorand.submitServerSignedNoteTransaction({
      action: BlockchainActionType.TREASURY_LOG,
      contractType: CollegeContractType.TREASURY,
      metadata: this.buildLedgerMetadata(data),
    });

    const persisted = await this.persistConfirmedLedgerTransaction({
      ...data,
      walletAddress: onChain.sender,
      txId: onChain.txId,
      note: onChain.note,
    });

    if (data.type === TransactionType.CREDIT && data.sponsorId && data.userId) {
      try {
        await this.tokenService.mintEntryToken({
          userId: data.userId,
          actionType: 'SPONSOR',
          walletAddress: onChain.sender,
          clubId: data.clubId,
          eventId: data.eventId,
          metadata: {
            reason: 'sponsor_contribution',
            sponsorId: data.sponsorId,
          },
        });
      } catch (err) {
         // handle failure gracefully
      }
    }

    return persisted;
  }

  async prepareWalletTransaction(data: PrepareWalletTransactionDto) {
    await this.validateLedgerTransactionInput(data);

    await this.tokenGate.assertWalletEligibleForAction({
      walletAddress: data.walletAddress,
      action: data.action ?? BlockchainActionType.TREASURY_LOG,
    });

    return this.algorand.prepareWalletTransaction({
      sender: data.walletAddress,
      action: data.action ?? BlockchainActionType.TREASURY_LOG,
      contractType: data.contractType ?? CollegeContractType.TREASURY,
      metadata: this.buildLedgerMetadata(data),
    });
  }

  async submitWalletTransaction(data: SubmitWalletTransactionDto) {
    await this.validateLedgerTransactionInput(data);

    const onChain = await this.algorand.broadcastSignedTransactions(
      data.signedTransactions,
    );

    return this.persistConfirmedLedgerTransaction({
      ...data,
      txId: onChain.txId,
      note: data.note,
    });
  }

  async getClubTransactions(clubId: string) {
    await this.assertClubExists(clubId);

    return this.prisma.transaction.findMany({
      where: { clubId },
      include: {
        event: { select: { title: true } },
        sponsor: { select: { name: true, organization: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getClubBalance(clubId: string) {
    const club = await this.assertClubExists(clubId);
    return club.prizePoolBalance || 0;
  }

  private async persistConfirmedLedgerTransaction(
    data: LedgerTransactionInput & {
      txId: string;
      note: string;
    },
  ) {
    const treasuryContract = await this.algorand.getActiveCollegeContract(
      CollegeContractType.TREASURY,
    );
    const collegeId = this.algorand.getCurrentCollegeIdOrThrow();

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.blockchainActivity.create({
        data: {
          collegeId,
          contractId: treasuryContract?.id,
          action: BlockchainActionType.TREASURY_LOG,
          txId: data.txId,
          walletAddress: data.walletAddress,
          note: data.note,
          status: BlockchainSyncStatus.CONFIRMED,
          metadata: {
            ...this.buildLedgerMetadata(data),
            txnHash: data.txId,
          } as Prisma.InputJsonValue,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          collegeId,
          amount: data.amount,
          type: data.type,
          description: data.description,
          clubId: data.clubId,
          eventId: data.eventId,
          sponsorId: data.sponsorId,
          txnHash: data.txId,
          walletAddress: data.walletAddress,
          blockchainActivityId: activity.id,
        },
        include: {
          event: { select: { title: true } },
          sponsor: { select: { name: true, organization: true } },
        },
      });

      const club = await tx.club.update({
        where: { id: data.clubId },
        data: {
          prizePoolBalance:
            data.type === TransactionType.CREDIT
              ? { increment: data.amount }
              : { decrement: data.amount },
        },
      });

      if (club.prizePoolBalance < 0) {
        throw new BadRequestException('Insufficient funds in the Prize Pool');
      }

      return transaction;
    });
  }

  private async validateLedgerTransactionInput(
    data: Pick<
      LedgerTransactionInput,
      'amount' | 'clubId' | 'eventId' | 'sponsorId' | 'type'
    >,
  ) {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const club = await this.assertClubExists(data.clubId);

    if (
      data.type === TransactionType.DEBIT &&
      club.prizePoolBalance - data.amount < 0
    ) {
      throw new BadRequestException('Insufficient funds in the Prize Pool');
    }

    if (data.eventId) {
      const event = await this.prisma.event.findFirst({
        where: {
          id: data.eventId,
          clubId: data.clubId,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found for this club.');
      }
    }

    if (data.sponsorId) {
      const sponsor = await this.prisma.sponsor.findFirst({
        where: {
          id: data.sponsorId,
          clubId: data.clubId,
        },
      });

      if (!sponsor) {
        throw new NotFoundException('Sponsor not found for this club.');
      }
    }
  }

  private async assertClubExists(clubId: string) {
    const club = await this.prisma.club.findFirst({
      where: { id: clubId },
      select: { id: true, prizePoolBalance: true },
    });

    if (!club) {
      throw new NotFoundException('Club not found.');
    }

    return club;
  }

  private buildLedgerMetadata(
    data: Pick<
      LedgerTransactionInput,
      'clubId' | 'eventId' | 'sponsorId' | 'description' | 'amount' | 'type'
    >,
  ) {
    return {
      clubId: data.clubId,
      eventId: data.eventId,
      sponsorId: data.sponsorId,
      description: data.description,
      amount: data.amount,
      type: data.type,
    };
  }
}
