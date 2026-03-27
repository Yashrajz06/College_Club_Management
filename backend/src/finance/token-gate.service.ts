import { ForbiddenException, Injectable } from '@nestjs/common';
import { BlockchainActionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from './algorand.service';

interface TokenGateCheckInput {
  walletAddress: string;
  action: BlockchainActionType;
}

@Injectable()
export class TokenGateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly algorand: AlgorandService,
  ) {}

  async assertWalletEligibleForAction(input: TokenGateCheckInput) {
    const config = await this.prisma.collegeConfig.findFirst();
    if (!config) {
      return {
        checked: false,
        rules: [],
      };
    }

    const rules = [
      config.entryTokenAssetId
        ? {
            assetId: config.entryTokenAssetId,
            label: 'entry-token',
          }
        : null,
      input.action === BlockchainActionType.VOTE ||
      input.action === BlockchainActionType.RELEASE
        ? config.soulboundAssetId
          ? {
              assetId: config.soulboundAssetId,
              label: 'soulbound',
            }
          : null
        : null,
    ].filter((value): value is { assetId: string; label: string } => Boolean(value));

    if (rules.length === 0) {
      return {
        checked: false,
        rules: [],
      };
    }

    const results = await Promise.all(
      rules.map(async (rule) => {
        const balance = await this.algorand.lookupAssetHolding(
          input.walletAddress,
          rule.assetId,
        );

        return {
          ...rule,
          balance,
          satisfied: balance > 0n,
        };
      }),
    );

    const failedRule = results.find((rule) => !rule.satisfied);
    if (failedRule) {
      throw new ForbiddenException(
        `Wallet does not satisfy the ${failedRule.label} token gate for this college.`,
      );
    }

    return {
      checked: true,
      rules: results,
    };
  }
}
