import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from '../finance/algorand.service';
import { BlockchainActionType, CollegeContractType, TokenActionType } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly algorand: AlgorandService,
    private readonly cls: ClsService,
  ) {}

  private getCurrentCollegeIdOrThrow() {
    return this.cls.get('collegeId');
  }

  async mintEntryToken(input: {
    userId: string;
    actionType: TokenActionType;
    walletAddress?: string;
    eventId?: string;
    clubId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const collegeId = this.getCurrentCollegeIdOrThrow();

    let txId = `offchain-${Date.now()}-${input.actionType}`;
    let soulboundTxId: string | undefined;

    // Trigger on-chain ASA if wallet is provided
    if (input.walletAddress) {
      try {
        const result = await this.algorand.triggerLifecycleAction({
          action: BlockchainActionType.MINT,
          contractType: CollegeContractType.ENTRY_TOKEN,
          entityId: input.userId,
          walletAddress: input.walletAddress,
          metadata: {
            reason: `mint_${input.actionType.toLowerCase()}`,
            ...input.metadata,
          },
        });
        txId = result.txId;

        if (input.actionType === TokenActionType.ATTEND) {
          const sbResult = await this.algorand.triggerLifecycleAction({
            action: BlockchainActionType.MINT,
            contractType: CollegeContractType.SOULBOUND,
            entityId: input.userId,
            walletAddress: input.walletAddress,
            metadata: {
              reason: `soulbound_${input.actionType.toLowerCase()}`,
              ...input.metadata,
            },
          });
          soulboundTxId = sbResult.txId;
        }

      } catch (err) {
        this.logger.warn(`Failed to mint on-chain token, reverting to off-chain log: ${err}`);
      }
    }

    const token = await this.prisma.entryToken.create({
      data: {
        txId,
        soulboundTxId,
        actionType: input.actionType,
        userId: input.userId,
        collegeId,
        eventId: input.eventId,
        clubId: input.clubId,
      },
    });

    this.logger.log(`Minted EntryToken ${token.id} for user ${input.userId} (Action: ${input.actionType})`);
    return token;
  }

  async getUserTokens(userId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();
    return this.prisma.entryToken.findMany({
      where: { userId, collegeId },
      include: {
        event: { select: { title: true } },
        club: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyToken(tokenId: string) {
    const token = await this.prisma.entryToken.findUnique({
      where: { id: tokenId },
      include: {
        user: { select: { name: true, walletAddress: true } },
        event: { select: { title: true } },
        club: { select: { name: true } },
        college: { select: { name: true } }
      }
    });

    if (!token) {
      throw new NotFoundException('Token not found or invalid');
    }

    return {
      valid: true,
      token,
    };
  }
}
