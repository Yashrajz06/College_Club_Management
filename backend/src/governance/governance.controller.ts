import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Role, BlockchainActionType } from '@prisma/client';
import { TokenGate } from '../auth/decorators/token-gate.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateGovernanceProposalDto, CastVoteDto } from './dto/create-governance-proposal.dto';
import { GovernanceService } from './governance.service';

@Controller('governance')
@TokenGate(BlockchainActionType.MINT)
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  // ── Create Proposal (PRESIDENT / VP) ──────────────────────
  @Post('proposals')
  @Roles(Role.PRESIDENT, Role.VP)
  async createProposal(
    @Req() req: any,
    @Body() body: CreateGovernanceProposalDto,
  ) {
    return this.governanceService.createProposal({
      ...body,
      proposerId: req.user.userId,
    });
  }

  // ── List All Proposals (any authenticated user) ───────────
  @Get('proposals')
  async listAllProposals() {
    return this.governanceService.listAllProposals();
  }

  // ── Get Single Proposal ───────────────────────────────────
  @Get('proposals/:id')
  async getProposal(@Param('id') id: string) {
    return this.governanceService.getProposal(id);
  }

  // ── List Proposals for Event ──────────────────────────────
  @Get('event/:eventId')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN, Role.MEMBER)
  async getEventProposals(@Param('eventId') eventId: string) {
    return this.governanceService.listEventProposals(eventId);
  }

  // ── Cast Vote (MEMBER, PRESIDENT, VP) ─────────────────────
  @Post('proposals/:id/vote')
  @Roles(Role.MEMBER, Role.PRESIDENT, Role.VP)
  async castVote(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: CastVoteDto,
  ) {
    return this.governanceService.castVote(id, req.user.userId, body.voteFor);
  }

  // ── Finalize Proposal (PRESIDENT / VP) ────────────────────
  @Post('proposals/:id/finalize')
  @Roles(Role.PRESIDENT, Role.VP)
  async finalizeProposal(@Param('id') id: string) {
    return this.governanceService.finalizeProposal(id);
  }

  // ── Execute Proposal (ADMIN / COORDINATOR) ────────────────
  @Post('proposals/:id/execute')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async executeProposal(@Param('id') id: string, @Req() req: any) {
    return this.governanceService.executeProposal(id, req.user.userId);
  }
}
