import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryController } from '../src/treasury/treasury.controller';
import { TreasuryService } from '../src/treasury/treasury.service';

describe('TreasuryController (integration)', () => {
  let controller: TreasuryController;
  const treasuryService = {
    createSpendRequest: jest.fn(),
    voteOnSpendRequest: jest.fn(),
    releaseSpendRequest: jest.fn(),
    getExplorerData: jest.fn(),
    getSpendRequestDetail: jest.fn(),
    getClubSpendRequests: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TreasuryController],
      providers: [
        {
          provide: TreasuryService,
          useValue: treasuryService,
        },
      ],
    }).compile();

    controller = moduleFixture.get(TreasuryController);
    jest.clearAllMocks();
  });

  it('maps spend request creation to the treasury service with requester context', async () => {
    treasuryService.createSpendRequest.mockResolvedValue({ id: 'spend-1' });

    await controller.createSpendRequest(
      { user: { userId: 'user-1' } },
      {
        title: 'Venue deposit',
        description: 'Advance payment for the main auditorium booking',
        amount: 2500,
        clubId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '550e8400-e29b-41d4-a716-446655440001',
      },
    );

    expect(treasuryService.createSpendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'user-1',
        title: 'Venue deposit',
      }),
    );
  });

  it('routes vote requests through the controller body', async () => {
    treasuryService.voteOnSpendRequest.mockResolvedValue({
      vote: { id: 'vote-1' },
    });

    await controller.voteOnSpendRequest(
      'spend-1',
      { user: { userId: 'user-1' } },
      { voteFor: true },
    );

    expect(treasuryService.voteOnSpendRequest).toHaveBeenCalledWith(
      'spend-1',
      'user-1',
      true,
    );
  });

  it('serves public explorer data', async () => {
    treasuryService.getExplorerData.mockResolvedValue({
      totals: { totalRequested: 2500, totalReleased: 0, readyForRelease: 0 },
      statusBreakdown: [],
      timeline: [],
      clubs: [],
      spendRequests: [],
    });

    const response = await controller.getExplorer(12);

    expect(response.totals.totalRequested).toBe(2500);
    expect(treasuryService.getExplorerData).toHaveBeenCalledWith(12);
  });
});
