import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public verification endpoints — no auth required.
 * Validates on-chain assets and tokens with college ownership proof.
 */
@Controller('verify')
export class VerifyController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify a treasury spend request by its on-chain transaction ID (requestTxId or releaseTxId).
   */
  @Public()
  @Get(':assetId')
  async verifyAsset(@Param('assetId') assetId: string) {
    // Search by requestTxId or releaseTxId
    const spendRequest = await this.prisma.treasurySpendRequest.findFirst({
      where: {
        OR: [
          { requestTxId: assetId },
          { releaseTxId: assetId },
        ],
      },
      include: {
        club: { select: { id: true, name: true } },
        college: { select: { id: true, name: true } },
        requester: { select: { name: true } },
        proposal: {
          select: {
            id: true,
            status: true,
            forWeight: true,
            againstWeight: true,
            _count: { select: { votes: true } },
          },
        },
      },
    });

    if (!spendRequest) {
      // Also search BlockchainActivity
      const activity = await this.prisma.blockchainActivity.findFirst({
        where: { txId: assetId },
        include: {
          college: { select: { id: true, name: true } },
          contract: { select: { type: true, appId: true, assetId: true } },
        },
      });

      if (!activity) {
        throw new NotFoundException(
          'No on-chain record found for this asset ID. It may not exist or may not be indexed yet.',
        );
      }

      return {
        verified: true,
        type: 'blockchain_activity',
        txId: activity.txId,
        action: activity.action,
        status: activity.status,
        college: activity.college,
        contract: activity.contract,
        walletAddress: activity.walletAddress,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        explorerUrl: `https://testnet.explorer.perawallet.app/tx/${activity.txId}`,
      };
    }

    return {
      verified: true,
      type: 'treasury_spend_request',
      id: spendRequest.id,
      title: spendRequest.title,
      description: spendRequest.description,
      amount: spendRequest.amount,
      status: spendRequest.status,
      requestTxId: spendRequest.requestTxId,
      releaseTxId: spendRequest.releaseTxId,
      receiptHash: spendRequest.receiptHash,
      college: spendRequest.college,
      club: spendRequest.club,
      requester: spendRequest.requester,
      proposal: spendRequest.proposal,
      timelockUntil: spendRequest.timelockUntil,
      createdAt: spendRequest.createdAt,
      explorerUrl: spendRequest.releaseTxId
        ? `https://testnet.explorer.perawallet.app/tx/${spendRequest.releaseTxId}`
        : spendRequest.requestTxId
          ? `https://testnet.explorer.perawallet.app/tx/${spendRequest.requestTxId}`
          : null,
    };
  }

  /**
   * Verify an EntryToken by its on-chain txId or tokenId (ASA ID).
   */
  @Public()
  @Get('token/:assetId')
  async verifyTokenAsset(@Param('assetId') assetId: string) {
    const token = await this.prisma.entryToken.findFirst({
      where: {
        OR: [
          { txId: assetId },
          { tokenId: assetId },
          { soulboundTxId: assetId },
        ],
      },
      include: {
        user: { select: { name: true, walletAddress: true } },
        event: { select: { title: true, date: true } },
        club: { select: { name: true } },
        college: { select: { id: true, name: true } },
      },
    });

    if (!token) {
      throw new NotFoundException(
        'No entry token found for this asset ID. It may not exist or may not be indexed yet.',
      );
    }

    return {
      verified: true,
      type: 'entry_token',
      id: token.id,
      tokenId: token.tokenId,
      txId: token.txId,
      soulboundTxId: token.soulboundTxId,
      actionType: token.actionType,
      holder: token.user,
      event: token.event,
      club: token.club,
      college: token.college,
      createdAt: token.createdAt,
      explorerUrl: token.txId && !token.txId.startsWith('offchain-')
        ? `https://testnet.explorer.perawallet.app/tx/${token.txId}`
        : null,
      isOnChain: !token.txId.startsWith('offchain-'),
    };
  }
}
