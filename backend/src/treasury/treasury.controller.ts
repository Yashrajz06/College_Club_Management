import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role, BlockchainActionType } from '@prisma/client';
import { TokenGate } from '../auth/decorators/token-gate.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateSpendRequestDto,
  UploadReceiptDto,
  VoteSpendRequestDto,
} from './dto/treasury.dto';
import { TreasuryService } from './treasury.service';

@Controller('treasury')
@TokenGate(BlockchainActionType.MINT)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  // ── Create Spend Request (PRESIDENT / VP) ─────────────────
  @Post('spend-request')
  @Roles(Role.PRESIDENT, Role.VP)
  async createSpendRequest(
    @Req() req: any,
    @Body() body: CreateSpendRequestDto,
  ) {
    return this.treasuryService.createSpendRequest({
      ...body,
      requesterId: req.user.userId,
    });
  }

  // ── Get Spend Request ─────────────────────────────────────
  @Get('spend-request/:id')
  async getSpendRequest(@Param('id') id: string) {
    return this.treasuryService.getSpendRequest(id);
  }

  @Post(':id/vote')
  @Roles(Role.MEMBER, Role.PRESIDENT, Role.VP)
  async voteOnSpendRequest(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: VoteSpendRequestDto,
  ) {
    return this.treasuryService.voteOnSpendRequest(
      id,
      req.user.userId,
      body.voteFor,
    );
  }

  // ── List Club Spend Requests ──────────────────────────────
  @Get('club/:clubId')
  async listClubSpendRequests(@Param('clubId') clubId: string) {
    return this.treasuryService.listClubSpendRequests(clubId);
  }

  // ── Treasury Overview (Recharts data) ─────────────────────
  @Get('club/:clubId/overview')
  async getTreasuryOverview(@Param('clubId') clubId: string) {
    return this.treasuryService.getTreasuryOverview(clubId);
  }

  @Public()
  @Get('explorer')
  async getExplorer(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.treasuryService.getExplorerData(limit ?? 25);
  }

  @Public()
  @Get('explorer/:id')
  async getSpendRequestDetail(@Param('id') id: string) {
    return this.treasuryService.getSpendRequestDetail(id);
  }

  // ── Release Spend Request (ADMIN / COORDINATOR) ───────────
  @Post('spend-request/:id/release')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async releaseSpendRequest(@Param('id') id: string, @Req() req: any) {
    return this.treasuryService.releaseSpendRequest(id, req.user.userId);
  }

  @Post(':id/release')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async releaseSpendRequestAlias(@Param('id') id: string, @Req() req: any) {
    return this.treasuryService.releaseSpendRequest(id, req.user.userId);
  }

  // ── Upload Receipt (PRESIDENT / VP) ───────────────────────
  @Post('spend-request/:id/receipt')
  @Roles(Role.PRESIDENT, Role.VP)
  async uploadReceipt(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: UploadReceiptDto,
  ) {
    return this.treasuryService.uploadReceipt(id, req.user.userId, body);
  }
}
