import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TransactionType } from '@prisma/client';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('transaction')
  @Roles(Role.PRESIDENT, Role.VP)
  async createTransaction(@Request() req: any, @Body() body: any) {
    return this.financeService.logTransaction({
      amount: parseFloat(body.amount),
      type: body.type as TransactionType,
      description: body.description,
      clubId: body.clubId,
      eventId: body.eventId,
      sponsorId: body.sponsorId,
      userId: req.user.userId
    });
  }

  @Get('club/:clubId/transactions')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.PRESIDENT, Role.VP)
  async getClubTransactions(@Param('clubId') clubId: string) {
    return this.financeService.getClubTransactions(clubId);
  }

  @Get('club/:clubId/balance')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.PRESIDENT, Role.VP)
  async getClubBalance(@Param('clubId') clubId: string) {
    return { balance: await this.financeService.getClubBalance(clubId) };
  }
}
