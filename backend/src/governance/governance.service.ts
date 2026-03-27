import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  CollegeContractType,
  EventStatus,
  GovernanceProposalStatus,
  TransactionType,
} from '@prisma/client';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from '../finance/algorand.service';
import { TokenGateService } from '../finance/token-gate.service';
import { FinanceService } from '../finance/finance.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: InsightsService,
    private readonly algorand: AlgorandService,
    private readonly tokenGate: TokenGateService,
    private readonly finance: FinanceService,
  ) {}

  // ── Create Proposal ───────────────────────────────────────

  async createProposal(data: {
    eventId: string;
    title: string;
    description: string;
    proposerId: string;
    spendAmount?: number;
    deadline?: string;
  }) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const event = await this.prisma.event.findFirst({
      where: { id: data.eventId, collegeId },
      include: {
        club: {
          select: {
            id: true,
            presidentId: true,
            vpId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.status !== EventStatus.APPROVED) {
      throw new BadRequestException(
        'Governance proposals can only be created for approved events.',
      );
    }

    const isOwner =
      event.club?.presidentId === data.proposerId ||
      event.club?.vpId === data.proposerId;
    if (!isOwner) {
      throw new ForbiddenException(
        'Only the club leadership can create governance proposals.',
      );
    }

    const proposal = await this.prisma.governanceProposal.create({
      data: {
        title: data.title,
        description: data.description,
        status: GovernanceProposalStatus.SUBMITTED,
        spendAmount: data.spendAmount ?? null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        collegeId,
        clubId: event.clubId,
        eventId: event.id,
        proposerId: data.proposerId,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'governance',
      action: 'proposal_submitted',
      entityId: proposal.id,
      payload: {
        eventId: proposal.eventId,
        clubId: proposal.clubId,
        spendAmount: proposal.spendAmount,
        status: proposal.status,
      },
    });

    return proposal;
  }

  // ── Cast Vote (Token-Gated + Weighted) ────────────────────

  async castVote(proposalId: string, voterId: string, voteFor: boolean) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const proposal = await this.prisma.governanceProposal.findFirst({
      where: { id: proposalId, collegeId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found.');
    }

    if (proposal.status !== GovernanceProposalStatus.SUBMITTED) {
      throw new BadRequestException('Voting is only allowed on SUBMITTED proposals.');
    }

    if (proposal.deadline && new Date() > proposal.deadline) {
      throw new BadRequestException('Voting deadline has passed.');
    }

    // Check club membership
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId: proposal.clubId, userId: voterId, collegeId },
    });
    if (!membership) {
      throw new ForbiddenException('You must be a club member to vote.');
    }

    // Token Gate: check entry token + soulbound
    const voter = await this.prisma.user.findFirst({
      where: { id: voterId, collegeId },
      select: { walletAddress: true },
    });

    let weight = 1;
    if (voter?.walletAddress) {
      await this.tokenGate.assertWalletEligibleForAction({
        walletAddress: voter.walletAddress,
        action: BlockchainActionType.VOTE,
      });

      // Treasury voting weight is pulled from both entry-token and soulbound holdings.
      const config = await this.prisma.collegeConfig.findFirst({
        where: { collegeId },
      });
      const [entryBalance, soulboundBalance] = await Promise.all([
        config?.entryTokenAssetId
          ? this.algorand.lookupAssetHolding(
              voter.walletAddress,
              config.entryTokenAssetId,
            )
          : Promise.resolve(0n),
        config?.soulboundAssetId
          ? this.algorand.lookupAssetHolding(
              voter.walletAddress,
              config.soulboundAssetId,
            )
          : Promise.resolve(0n),
      ]);
      weight = Math.min(Number(entryBalance + soulboundBalance), 10);
      if (weight < 1) weight = 1;
    }

    // Check for duplicate vote
    const existing = await this.prisma.governanceVote.findUnique({
      where: { proposalId_voterId: { proposalId, voterId } },
    });
    if (existing) {
      throw new ConflictException('You have already voted on this proposal.');
    }

    // On-chain VOTE action
    let txId: string | undefined;
    if (voter?.walletAddress) {
      try {
        const result = await this.algorand.triggerLifecycleAction({
          action: BlockchainActionType.VOTE,
          contractType: CollegeContractType.ENTRY_TOKEN,
          entityId: proposalId,
          walletAddress: voter.walletAddress,
          metadata: {
            proposalId,
            voterId,
            voteFor,
            weight,
          },
        });
        txId = result.txId;
      } catch (err) {
        this.logger.warn(`On-chain vote failed, proceeding off-chain: ${err}`);
      }
    }

    // Persist vote
    const vote = await this.prisma.governanceVote.create({
      data: {
        proposalId,
        voterId,
        voteFor,
        weight,
        txId,
        collegeId,
      },
    });

    // Update proposal tallies
    await this.prisma.governanceProposal.update({
      where: { id: proposalId },
      data: voteFor
        ? { forWeight: { increment: weight } }
        : { againstWeight: { increment: weight } },
    });

    // Analytics + AI sync
    await this.insights.recordSyncEvent({
      entityType: 'governance',
      action: 'vote_cast',
      entityId: proposalId,
      payload: {
        voterId,
        voteFor,
        weight,
        txId,
      },
    });

    return vote;
  }

  // ── Finalize Proposal ─────────────────────────────────────

  async finalizeProposal(proposalId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const proposal = await this.prisma.governanceProposal.findFirst({
      where: { id: proposalId, collegeId },
      include: { votes: true },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found.');
    }

    if (proposal.status !== GovernanceProposalStatus.SUBMITTED) {
      throw new BadRequestException('Only SUBMITTED proposals can be finalized.');
    }

    const newStatus =
      proposal.forWeight > proposal.againstWeight
        ? GovernanceProposalStatus.APPROVED
        : GovernanceProposalStatus.REJECTED;

    const updated = await this.prisma.governanceProposal.update({
      where: { id: proposalId },
      data: { status: newStatus },
    });

    await this.insights.recordSyncEvent({
      entityType: 'governance',
      action: 'proposal_finalized',
      entityId: proposalId,
      payload: {
        result: newStatus,
        forWeight: proposal.forWeight,
        againstWeight: proposal.againstWeight,
        totalVotes: proposal.votes.length,
      },
    });

    // Auto-sync linked TreasurySpendRequest status
    const linkedSr = await this.prisma.treasurySpendRequest.findUnique({
      where: { proposalId },
    });
    if (linkedSr) {
      const srStatus =
        newStatus === GovernanceProposalStatus.APPROVED
          ? 'READY_FOR_RELEASE'
          : 'REJECTED';
      await this.prisma.treasurySpendRequest.update({
        where: { id: linkedSr.id },
        data: { status: srStatus as any },
      });
      this.logger.log(`Synced SpendRequest ${linkedSr.id} → ${srStatus}`);
    }

    return updated;
  }

  // ── Execute Proposal (Treasury Release) ───────────────────

  async executeProposal(proposalId: string, executorId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const proposal = await this.prisma.governanceProposal.findFirst({
      where: { id: proposalId, collegeId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found.');
    }

    if (proposal.status !== GovernanceProposalStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED proposals can be executed.');
    }

    // If spendAmount is set, trigger treasury release
    if (proposal.spendAmount && proposal.spendAmount > 0) {
      await this.finance.logTransaction({
        amount: proposal.spendAmount,
        type: TransactionType.DEBIT,
        description: `Governance: ${proposal.title}`,
        clubId: proposal.clubId,
        eventId: proposal.eventId,
        userId: executorId,
      });
    }

    const updated = await this.prisma.governanceProposal.update({
      where: { id: proposalId },
      data: { status: GovernanceProposalStatus.EXECUTED },
    });

    await this.insights.recordSyncEvent({
      entityType: 'governance',
      action: 'proposal_executed',
      entityId: proposalId,
      payload: {
        spendAmount: proposal.spendAmount,
        clubId: proposal.clubId,
        executorId,
      },
    });

    return updated;
  }

  // ── Queries ───────────────────────────────────────────────

  async listEventProposals(eventId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    return this.prisma.governanceProposal.findMany({
      where: { eventId, collegeId },
      include: {
        proposer: {
          select: { id: true, name: true, email: true },
        },
        votes: {
          select: {
            id: true,
            voteFor: true,
            weight: true,
            voterId: true,
            txId: true,
            createdAt: true,
          },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProposal(proposalId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const proposal = await this.prisma.governanceProposal.findFirst({
      where: { id: proposalId, collegeId },
      include: {
        proposer: {
          select: { id: true, name: true, email: true },
        },
        club: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, title: true },
        },
        votes: {
          include: {
            voter: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found.');
    }

    return proposal;
  }

  async listAllProposals() {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    return this.prisma.governanceProposal.findMany({
      where: { collegeId },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
        club: {
          select: { id: true, name: true },
        },
        event: {
          select: { id: true, title: true },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
