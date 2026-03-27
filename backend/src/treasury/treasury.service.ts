import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  GovernanceProposalStatus,
  TransactionType,
  TreasurySpendRequestStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from '../finance/algorand.service';
import { TokenGateService } from '../finance/token-gate.service';
import { FinanceService } from '../finance/finance.service';
import { GovernanceService } from '../governance/governance.service';
import { InsightsService } from '../insights/insights.service';

@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly algorand: AlgorandService,
    private readonly tokenGate: TokenGateService,
    private readonly finance: FinanceService,
    private readonly governance: GovernanceService,
    private readonly insights: InsightsService,
  ) {}

  // ── Create Spend Request ──────────────────────────────────

  async createSpendRequest(data: {
    title: string;
    description: string;
    amount: number;
    clubId: string;
    eventId?: string;
    requesterId: string;
    beneficiaryName?: string;
    beneficiaryWalletAddress?: string;
    timelockHours?: number;
    deadline?: string;
  }) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    if (data.amount <= 0) {
      throw new BadRequestException('Spend amount must be greater than zero.');
    }

    // Verify club exists and requester is leadership
    const club = await this.prisma.club.findFirst({
      where: { id: data.clubId, collegeId },
      select: { id: true, presidentId: true, vpId: true, prizePoolBalance: true },
    });
    if (!club) throw new NotFoundException('Club not found.');

    const isLeadership =
      club.presidentId === data.requesterId ||
      club.vpId === data.requesterId;
    if (!isLeadership) {
      throw new ForbiddenException('Only club leadership can create spend requests.');
    }

    // Check balance
    if (club.prizePoolBalance < data.amount) {
      throw new BadRequestException(
        `Insufficient funds. Club balance: ${club.prizePoolBalance}, requested: ${data.amount}`,
      );
    }

    // Token gate: require Entry Token for spend request creation
    const requester = await this.prisma.user.findFirst({
      where: { id: data.requesterId, collegeId },
      select: { walletAddress: true },
    });
    if (requester?.walletAddress) {
      await this.tokenGate.assertWalletEligibleForAction({
        walletAddress: requester.walletAddress,
        action: BlockchainActionType.TREASURY_LOG,
      });
    }

    // Calculate timelock
    const timelockHours = data.timelockHours ?? 24;
    const timelockUntil = new Date(Date.now() + timelockHours * 60 * 60 * 1000);

    // Auto-create governance proposal linked to the spend request
    let eventId = data.eventId;
    if (!eventId) {
      // Find most recent approved event for this club
      const recentEvent = await this.prisma.event.findFirst({
        where: { clubId: data.clubId, collegeId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (!recentEvent) {
        throw new BadRequestException(
          'No approved event found for this club. A spend request must be linked to an event.',
        );
      }
      eventId = recentEvent.id;
    }

    // Create the governance proposal first
    const proposal = await this.governance.createProposal({
      eventId,
      title: `Spend Request: ${data.title}`,
      description: `Treasury spend request for ${data.amount}.\n\n${data.description}`,
      proposerId: data.requesterId,
      spendAmount: data.amount,
      deadline: data.deadline,
    });

    // Create the spend request (linked to proposal)
    const spendRequest = await this.prisma.treasurySpendRequest.create({
      data: {
        title: data.title,
        description: data.description,
        amount: data.amount,
        status: TreasurySpendRequestStatus.PENDING_VOTE,
        beneficiaryName: data.beneficiaryName,
        beneficiaryWalletAddress: data.beneficiaryWalletAddress,
        timelockUntil,
        collegeId,
        clubId: data.clubId,
        eventId,
        requesterId: data.requesterId,
        proposalId: proposal.id,
      },
      include: {
        proposal: true,
        requester: { select: { id: true, name: true } },
        club: { select: { id: true, name: true } },
      },
    });

    // Log on-chain spend request creation
    try {
      const result = await this.algorand.triggerLifecycleAction({
        action: BlockchainActionType.TREASURY_LOG,
        contractType: 'TREASURY' as any,
        entityId: spendRequest.id,
        walletAddress: requester?.walletAddress,
        metadata: {
          kind: 'spend_request_created',
          amount: data.amount,
          clubId: data.clubId,
          proposalId: proposal.id,
          timelockUntil: timelockUntil.toISOString(),
        },
      });
      await this.prisma.treasurySpendRequest.update({
        where: { id: spendRequest.id },
        data: { requestTxId: result.txId },
      });
    } catch (err) {
      this.logger.warn(`On-chain spend request log failed: ${err}`);
    }

    await this.insights.recordSyncEvent({
      entityType: 'treasury',
      action: 'spend_request_created',
      entityId: spendRequest.id,
      payload: {
        amount: data.amount,
        clubId: data.clubId,
        proposalId: proposal.id,
        timelockUntil: timelockUntil.toISOString(),
      },
    });

    return spendRequest;
  }

  async voteOnSpendRequest(id: string, voterId: string, voteFor: boolean) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const spendRequest = await this.prisma.treasurySpendRequest.findFirst({
      where: { id, collegeId },
    });
    if (!spendRequest) {
      throw new NotFoundException('Spend request not found.');
    }

    const vote = await this.governance.castVote(
      spendRequest.proposalId,
      voterId,
      voteFor,
    );
    await this.syncProposalStatusToSpendRequest(spendRequest.proposalId);

    await this.insights.recordSyncEvent({
      entityType: 'treasury',
      action: 'vote_cast',
      entityId: spendRequest.id,
      payload: {
        proposalId: spendRequest.proposalId,
        voterId,
        voteFor,
        weight: vote.weight,
      },
    });

    return {
      vote,
      spendRequest: await this.getSpendRequest(spendRequest.id),
    };
  }

  // ── Release Spend Request ─────────────────────────────────

  async releaseSpendRequest(id: string, executorId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    const sr = await this.prisma.treasurySpendRequest.findFirst({
      where: { id, collegeId },
      include: {
        proposal: true,
        club: { select: { id: true, prizePoolBalance: true } },
      },
    });

    if (!sr) throw new NotFoundException('Spend request not found.');

    // Check proposal is approved
    if (
      sr.proposal.status !== GovernanceProposalStatus.APPROVED &&
      sr.status !== TreasurySpendRequestStatus.READY_FOR_RELEASE
    ) {
      throw new BadRequestException(
        'Spend request cannot be released until its governance proposal is APPROVED.',
      );
    }

    // Check timelock
    if (new Date() < sr.timelockUntil) {
      const remaining = Math.ceil(
        (sr.timelockUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new BadRequestException(
        `Timelock active. Release will be available in ${remaining} minute(s).`,
      );
    }

    // Check balance
    if (sr.club.prizePoolBalance < sr.amount) {
      throw new BadRequestException('Insufficient club funds for release.');
    }

    // Token gate: require RELEASE eligibility
    const executor = await this.prisma.user.findFirst({
      where: { id: executorId, collegeId },
      select: { walletAddress: true },
    });
    if (executor?.walletAddress) {
      await this.tokenGate.assertWalletEligibleForAction({
        walletAddress: executor.walletAddress,
        action: BlockchainActionType.RELEASE,
      });
    }

    // Execute atomic treasury release on-chain
    let releaseTxId: string | undefined;
    try {
      const onChain = await this.algorand.submitAtomicTreasuryReleaseGroup({
        spendRequestId: sr.id,
        proposalId: sr.proposalId,
        amount: sr.amount,
        receiptHash: sr.receiptHash,
        beneficiaryWalletAddress: sr.beneficiaryWalletAddress,
        metadata: {
          executorId,
          clubId: sr.clubId,
          title: sr.title,
        },
      });
      releaseTxId = onChain.txId;
    } catch (err) {
      this.logger.warn(`Atomic treasury release failed, proceeding off-chain: ${err}`);
    }

    // Debit club balance via FinanceService
    const transaction = await this.finance.logTransaction({
      amount: sr.amount,
      type: TransactionType.DEBIT,
      description: `Treasury Release: ${sr.title}`,
      clubId: sr.clubId,
      eventId: sr.eventId ?? undefined,
      userId: executorId,
    });

    // Update spend request status
    const updated = await this.prisma.treasurySpendRequest.update({
      where: { id: sr.id },
      data: {
        status: TreasurySpendRequestStatus.RELEASED,
        releaseTxId,
      },
    });

    // Link transaction to spend request
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { treasurySpendRequestId: sr.id },
    });

    // Mark governance proposal as EXECUTED
    await this.prisma.governanceProposal.update({
      where: { id: sr.proposalId },
      data: { status: GovernanceProposalStatus.EXECUTED },
    });

    // Analytics + AI sync
    await this.insights.recordSyncEvent({
      entityType: 'treasury',
      action: 'spend_released',
      entityId: sr.id,
      payload: {
        amount: sr.amount,
        releaseTxId,
        executorId,
        clubId: sr.clubId,
        proposalId: sr.proposalId,
      },
    });

    return {
      txId: releaseTxId ?? null,
      spendRequest: await this.getSpendRequest(updated.id),
    };
  }

  // ── Upload Receipt ────────────────────────────────────────

  async uploadReceipt(
    id: string,
    uploaderId: string,
    receipt: {
      url: string;
      fileName?: string;
      mimeType?: string;
      fileBuffer?: Buffer;
    },
  ) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    const sr = await this.prisma.treasurySpendRequest.findFirst({
      where: { id, collegeId },
    });
    if (!sr) throw new NotFoundException('Spend request not found.');

    // Compute SHA-256 hash of the receipt
    let receiptHash: string | undefined;
    if (receipt.fileBuffer) {
      receiptHash = createHash('sha256').update(receipt.fileBuffer).digest('hex');
    } else {
      // Hash the URL as a fallback
      receiptHash = createHash('sha256').update(receipt.url).digest('hex');
    }

    // Store receipt hash on-chain
    try {
      await this.algorand.submitServerSignedNoteTransaction({
        action: BlockchainActionType.RELEASE,
        contractType: 'TREASURY' as any,
        entityId: sr.id,
        metadata: {
          kind: 'receipt_uploaded',
          receiptHash,
          fileName: receipt.fileName,
          uploaderId,
        },
      });
    } catch (err) {
      this.logger.warn(`On-chain receipt hash storage failed: ${err}`);
    }

    const updated = await this.prisma.treasurySpendRequest.update({
      where: { id: sr.id },
      data: {
        receiptUrl: receipt.url,
        receiptHash,
        receiptFileName: receipt.fileName,
        receiptMimeType: receipt.mimeType,
      },
    });

    await this.insights.recordSyncEvent({
      entityType: 'treasury',
      action: 'receipt_uploaded',
      entityId: sr.id,
      payload: { receiptHash, uploaderId },
    });

    return updated;
  }

  // ── Queries ───────────────────────────────────────────────

  async getSpendRequest(id: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const sr = await this.prisma.treasurySpendRequest.findFirst({
      where: { id, collegeId },
      include: {
        proposal: {
          include: {
            votes: {
              include: { voter: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { votes: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
        club: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        releaseTransaction: true,
      },
    });
    if (!sr) throw new NotFoundException('Spend request not found.');
    return {
      ...sr,
      status: this.deriveSpendRequestStatus(
        sr.status,
        sr.proposal.status,
        sr.timelockUntil,
      ),
      proposalVoteCount: sr.proposal._count.votes,
    };
  }

  async listClubSpendRequests(clubId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const spendRequests = await this.prisma.treasurySpendRequest.findMany({
      where: { clubId, collegeId },
      include: {
        proposal: {
          select: {
            id: true,
            status: true,
            forWeight: true,
            againstWeight: true,
            _count: { select: { votes: true } },
          },
        },
        requester: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return spendRequests.map((spendRequest) => ({
      ...spendRequest,
      status: this.deriveSpendRequestStatus(
        spendRequest.status,
        spendRequest.proposal.status,
        spendRequest.timelockUntil,
      ),
      proposalVoteCount: spendRequest.proposal._count.votes,
    }));
  }

  async getTreasuryOverview(clubId: string) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();

    const [club, spendRequests, transactions] = await Promise.all([
      this.prisma.club.findFirst({
        where: { id: clubId, collegeId },
        select: { id: true, name: true, prizePoolBalance: true },
      }),
      this.prisma.treasurySpendRequest.findMany({
        where: { clubId, collegeId },
        select: {
          id: true,
          amount: true,
          status: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { clubId, collegeId },
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          date: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!club) throw new NotFoundException('Club not found.');

    // Build balance timeline
    let runningBalance = 0;
    const balanceTimeline = transactions.map((tx) => {
      runningBalance += tx.type === 'CREDIT' ? tx.amount : -tx.amount;
      return {
        date: tx.date,
        balance: runningBalance,
        amount: tx.amount,
        type: tx.type,
      };
    });

    // Build monthly flow
    const monthlyFlow: Record<string, { income: number; spending: number }> = {};
    for (const tx of transactions) {
      const month = new Date(tx.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyFlow[month]) monthlyFlow[month] = { income: 0, spending: 0 };
      if (tx.type === 'CREDIT') {
        monthlyFlow[month].income += tx.amount;
      } else {
        monthlyFlow[month].spending += tx.amount;
      }
    }

    // Spend breakdown by category
    const spendByCategory: Record<string, number> = {};
    for (const tx of transactions.filter((t) => t.type === 'DEBIT')) {
      const category = tx.description.split(':')[0]?.trim() || 'Other';
      spendByCategory[category] = (spendByCategory[category] ?? 0) + tx.amount;
    }

    return {
      club,
      currentBalance: club.prizePoolBalance,
      totalSpent: spendRequests
        .filter((sr) => sr.status === 'RELEASED')
        .reduce((sum, sr) => sum + sr.amount, 0),
      totalApproved: spendRequests
        .filter((sr) => ['APPROVED', 'READY_FOR_RELEASE'].includes(sr.status))
        .reduce((sum, sr) => sum + sr.amount, 0),
      pendingCount: spendRequests.filter((sr) => sr.status === 'PENDING_VOTE').length,
      releasedCount: spendRequests.filter((sr) => sr.status === 'RELEASED').length,
      balanceTimeline,
      monthlyFlow: Object.entries(monthlyFlow).map(([month, data]) => ({
        month,
        ...data,
      })),
      spendBreakdown: Object.entries(spendByCategory).map(([name, value]) => ({
        name,
        value,
      })),
      recentRequests: spendRequests.slice(0, 5),
    };
  }

  async getExplorerData(limit = 25) {
    const collegeId = this.insights.getCurrentCollegeIdOrThrow();
    const spendRequests = await this.prisma.treasurySpendRequest.findMany({
      where: { collegeId },
      include: {
        proposal: {
          select: {
            id: true,
            status: true,
            forWeight: true,
            againstWeight: true,
            deadline: true,
            _count: { select: { votes: true } },
          },
        },
        requester: { select: { id: true, name: true, email: true } },
        club: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const mapped = spendRequests.map((spendRequest) => ({
      ...spendRequest,
      status: this.deriveSpendRequestStatus(
        spendRequest.status,
        spendRequest.proposal.status,
        spendRequest.timelockUntil,
      ),
      proposalVoteCount: spendRequest.proposal._count.votes,
    }));

    const totals = {
      totalRequested: mapped.reduce((sum, item) => sum + item.amount, 0),
      totalReleased: mapped
        .filter((item) => item.status === TreasurySpendRequestStatus.RELEASED)
        .reduce((sum, item) => sum + item.amount, 0),
      readyForRelease: mapped
        .filter(
          (item) => item.status === TreasurySpendRequestStatus.READY_FOR_RELEASE,
        )
        .reduce((sum, item) => sum + item.amount, 0),
    };

    const statusBreakdown = Object.values(TreasurySpendRequestStatus).map(
      (status) => ({
        status,
        count: mapped.filter((item) => item.status === status).length,
        amount: mapped
          .filter((item) => item.status === status)
          .reduce((sum, item) => sum + item.amount, 0),
      }),
    );

    const timelineMap = new Map<string, { requested: number; released: number }>();
    for (const item of mapped) {
      const key = item.createdAt.toISOString().slice(0, 10);
      const current = timelineMap.get(key) ?? { requested: 0, released: 0 };
      current.requested += item.amount;
      if (item.status === TreasurySpendRequestStatus.RELEASED) {
        current.released += item.amount;
      }
      timelineMap.set(key, current);
    }

    const clubMap = new Map<
      string,
      { clubName: string; requested: number; released: number }
    >();
    for (const item of mapped) {
      const current = clubMap.get(item.clubId) ?? {
        clubName: item.club?.name ?? 'Unknown club',
        requested: 0,
        released: 0,
      };
      current.requested += item.amount;
      if (item.status === TreasurySpendRequestStatus.RELEASED) {
        current.released += item.amount;
      }
      clubMap.set(item.clubId, current);
    }

    return {
      totals,
      statusBreakdown,
      timeline: Array.from(timelineMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, values]) => ({ date, ...values })),
      clubs: Array.from(clubMap.entries()).map(([clubId, values]) => ({
        clubId,
        ...values,
      })),
      spendRequests: mapped,
    };
  }

  async getSpendRequestDetail(id: string) {
    return this.getSpendRequest(id);
  }

  // ── Proposal Status Sync ──────────────────────────────────

  async syncProposalStatusToSpendRequest(proposalId: string) {
    const proposal = await this.prisma.governanceProposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) return;

    const sr = await this.prisma.treasurySpendRequest.findUnique({
      where: { proposalId },
    });
    if (!sr) return;

    let newStatus: TreasurySpendRequestStatus | undefined;
    if (proposal.status === GovernanceProposalStatus.APPROVED) {
      newStatus = TreasurySpendRequestStatus.READY_FOR_RELEASE;
    } else if (proposal.status === GovernanceProposalStatus.REJECTED) {
      newStatus = TreasurySpendRequestStatus.REJECTED;
    }

    if (newStatus && sr.status !== newStatus) {
      await this.prisma.treasurySpendRequest.update({
        where: { id: sr.id },
        data: { status: newStatus },
      });
    }
  }

  private deriveSpendRequestStatus(
    currentStatus: TreasurySpendRequestStatus,
    proposalStatus: GovernanceProposalStatus,
    timelockUntil: Date,
  ) {
    if (currentStatus === TreasurySpendRequestStatus.RELEASED) {
      return TreasurySpendRequestStatus.RELEASED;
    }
    if (proposalStatus === GovernanceProposalStatus.REJECTED) {
      return TreasurySpendRequestStatus.REJECTED;
    }
    if (proposalStatus === GovernanceProposalStatus.APPROVED) {
      return new Date() >= timelockUntil
        ? TreasurySpendRequestStatus.READY_FOR_RELEASE
        : TreasurySpendRequestStatus.APPROVED;
    }
    return currentStatus;
  }
}
