import { Test, TestingModule } from '@nestjs/testing';
import {
  GovernanceProposalStatus,
  Role,
  TreasurySpendRequestStatus,
} from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { GovernanceService } from '../governance/governance.service';
import { AlgorandService } from '../finance/algorand.service';
import { TokenGateService } from '../finance/token-gate.service';
import { FinanceService } from '../finance/finance.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';
import { TreasuryService } from './treasury.service';

describe('TreasuryService', () => {
  let service: TreasuryService;
  let prisma: any;
  let governance: any;
  let algorand: any;
  let finance: any;
  let insights: any;

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn() },
      club: { findFirst: jest.fn(), update: jest.fn() },
      event: { findFirst: jest.fn() },
      treasurySpendRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      governanceProposal: { update: jest.fn(), findUnique: jest.fn() },
      transaction: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      blockchainActivity: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    governance = {
      createProposal: jest.fn(),
      castVote: jest.fn(),
      finalizeProposal: jest.fn(),
    };
    algorand = {
      triggerLifecycleAction: jest.fn(),
      submitAtomicTreasuryReleaseGroup: jest.fn(),
      getActiveCollegeContract: jest.fn(),
    };
    finance = { logTransaction: jest.fn() };
    insights = {
      recordSyncEvent: jest.fn(),
      getCurrentCollegeIdOrThrow: jest.fn(() => 'college-1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AlgorandService, useValue: algorand },
        { provide: TokenGateService, useValue: { assertWalletEligibleForAction: jest.fn() } },
        { provide: FinanceService, useValue: finance },
        { provide: GovernanceService, useValue: governance },
        { provide: InsightsService, useValue: insights },
        {
          provide: ClsService,
          useValue: {
            isActive: () => true,
            get: () => 'college-1',
          },
        },
      ],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
  });

  it('creates a spend request linked to a governance proposal', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      role: Role.PRESIDENT,
      walletAddress: 'WALLET',
    });
    prisma.club.findFirst.mockResolvedValue({
      id: 'club-1',
      name: 'Robotics',
      presidentId: 'user-1',
      vpId: 'vp-1',
    });
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      title: 'Hack Day',
    });
    governance.createProposal.mockResolvedValue({ id: 'proposal-1' });
    algorand.triggerLifecycleAction.mockResolvedValue({ txId: 'txn-1' });
    prisma.treasurySpendRequest.create.mockResolvedValue({
      id: 'spend-1',
      title: 'LED wall',
      description: 'Main stage support',
      amount: 5000,
      status: TreasurySpendRequestStatus.PENDING_VOTE,
      timelockUntil: new Date(),
      proposalId: 'proposal-1',
      clubId: 'club-1',
      eventId: 'event-1',
      receiptHash: null,
      receiptUrl: null,
      receiptFileName: null,
      receiptMimeType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      club: { id: 'club-1', name: 'Robotics', coordinatorId: 'coord-1' },
      event: { id: 'event-1', title: 'Hack Day' },
      requester: { id: 'user-1', name: 'Ava', email: 'ava@college.edu' },
      proposal: {
        id: 'proposal-1',
        status: GovernanceProposalStatus.SUBMITTED,
        forWeight: 0,
        againstWeight: 0,
        deadline: null,
        _count: { votes: 0 },
      },
    });

    const result = await service.createSpendRequest({
      title: 'LED wall',
      description: 'Main stage support',
      amount: 5000,
      clubId: 'club-1',
      eventId: 'event-1',
      requesterId: 'user-1',
    });

    expect(governance.createProposal).toHaveBeenCalled();
    expect(algorand.triggerLifecycleAction).toHaveBeenCalled();
    expect(result.proposalId).toBe('proposal-1');
  });

  it('records a treasury vote through the governance module', async () => {
    prisma.treasurySpendRequest.findFirst.mockResolvedValue({
      id: 'spend-1',
      title: 'LED wall',
      description: 'Main stage support',
      amount: 5000,
      status: TreasurySpendRequestStatus.PENDING_VOTE,
      timelockUntil: new Date(Date.now() + 60_000),
      proposalId: 'proposal-1',
      clubId: 'club-1',
      eventId: 'event-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      club: { id: 'club-1', name: 'Robotics', coordinatorId: 'coord-1' },
      event: { id: 'event-1', title: 'Hack Day' },
      requester: { id: 'user-1', name: 'Ava', email: 'ava@college.edu' },
      proposal: {
        id: 'proposal-1',
        status: GovernanceProposalStatus.SUBMITTED,
        forWeight: 2,
        againstWeight: 0,
        deadline: null,
        _count: { votes: 1 },
      },
    });
    prisma.governanceProposal.findUnique.mockResolvedValue({
      id: 'proposal-1',
      status: GovernanceProposalStatus.SUBMITTED,
    });
    prisma.treasurySpendRequest.findUnique.mockResolvedValue({
      id: 'spend-1',
      status: TreasurySpendRequestStatus.PENDING_VOTE,
    });
    governance.castVote.mockResolvedValue({ id: 'vote-1', weight: 2, voteFor: true });

    const result = await service.voteOnSpendRequest('spend-1', 'member-1', true);

    expect(governance.castVote).toHaveBeenCalledWith('proposal-1', 'member-1', true);
    expect(result.vote.weight).toBe(2);
  });

  it('releases an approved request and persists the ledger sync', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'admin-1',
      role: Role.ADMIN,
    });
    prisma.treasurySpendRequest.findFirst.mockResolvedValue({
      id: 'spend-1',
      title: 'LED wall',
      description: 'Main stage support',
      amount: 5000,
      status: TreasurySpendRequestStatus.READY_FOR_RELEASE,
      timelockUntil: new Date(Date.now() - 60_000),
      proposalId: 'proposal-1',
      clubId: 'club-1',
      eventId: 'event-1',
      receiptHash: 'hash-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      club: { id: 'club-1', name: 'Robotics', coordinatorId: 'coord-1', prizePoolBalance: 10000 },
      event: { id: 'event-1', title: 'Hack Day' },
      requester: { id: 'user-1', name: 'Ava', email: 'ava@college.edu' },
      proposal: {
        id: 'proposal-1',
        status: GovernanceProposalStatus.APPROVED,
        forWeight: 5,
        againstWeight: 1,
        deadline: null,
        _count: { votes: 3 },
      },
    });
    algorand.submitAtomicTreasuryReleaseGroup.mockResolvedValue({
      txId: 'release-1',
      receiptTxId: 'receipt-1',
      groupId: 'group-1',
      receiver: 'receiver-1',
      note: 'note',
    });
    finance.logTransaction.mockResolvedValue({ id: 'transaction-1' });
    prisma.club.findFirst.mockResolvedValue({ id: 'club-1', prizePoolBalance: 10000 });
    prisma.club.update.mockResolvedValue({ id: 'club-1' });
    prisma.treasurySpendRequest.update.mockResolvedValue({
      id: 'spend-1',
      title: 'LED wall',
      description: 'Main stage support',
      amount: 5000,
      status: TreasurySpendRequestStatus.RELEASED,
      timelockUntil: new Date(Date.now() - 60_000),
      proposalId: 'proposal-1',
      clubId: 'club-1',
      eventId: 'event-1',
      receiptHash: 'hash-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      club: { id: 'club-1', name: 'Robotics', coordinatorId: 'coord-1' },
      event: { id: 'event-1', title: 'Hack Day' },
      requester: { id: 'user-1', name: 'Ava', email: 'ava@college.edu' },
      proposal: {
        id: 'proposal-1',
        status: GovernanceProposalStatus.APPROVED,
        forWeight: 5,
        againstWeight: 1,
        deadline: null,
        _count: { votes: 3 },
      },
    });

    const result = await service.releaseSpendRequest('spend-1', 'admin-1');

    expect(algorand.submitAtomicTreasuryReleaseGroup).toHaveBeenCalled();
    expect(finance.logTransaction).toHaveBeenCalled();
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'transaction-1' },
      data: { treasurySpendRequestId: 'spend-1' },
    });
    expect(result.txId).toBe('release-1');
  });
});
