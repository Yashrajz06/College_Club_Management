import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { CreateGovernanceProposalDto } from './dto/create-governance-proposal.dto';
import { GovernanceService } from './governance.service';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

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

  @Get('event/:eventId')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async getEventProposals(@Param('eventId') eventId: string) {
    return this.governanceService.listEventProposals(eventId);
  }
}
