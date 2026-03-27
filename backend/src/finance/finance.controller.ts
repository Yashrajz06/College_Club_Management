import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, TransactionType } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AlgorandService } from './algorand.service';
import { RegisterCollegeContractDto } from './dto/register-college-contract.dto';
import { PrepareWalletTransactionDto } from './dto/prepare-wallet-transaction.dto';
import { SubmitWalletTransactionDto } from './dto/submit-wallet-transaction.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly algorandService: AlgorandService,
  ) {}

  @Post('transaction')
  @Roles(Role.PRESIDENT, Role.VP)
  async createTransaction(@Request() req: any, @Body() body: any) {
    return this.financeService.logTransaction({
      amount: Number(body.amount),
      type: body.type as TransactionType,
      description: body.description,
      clubId: body.clubId,
      eventId: body.eventId,
      sponsorId: body.sponsorId,
      userId: req.user.userId,
    });
  }

  @Post('algorand/prepare')
  @Roles(Role.PRESIDENT, Role.VP)
  async prepareWalletTransaction(
    @Body() body: PrepareWalletTransactionDto,
  ) {
    return this.financeService.prepareWalletTransaction(body);
  }

  @Post('algorand/submit')
  @Roles(Role.PRESIDENT, Role.VP)
  async submitWalletTransaction(@Body() body: SubmitWalletTransactionDto) {
    return this.financeService.submitWalletTransaction(body);
  }

  @Post('algorand/contracts')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  async registerCollegeContract(@Body() body: RegisterCollegeContractDto) {
    return this.algorandService.registerCollegeContractDeployment(body);
  }

  @Get('algorand/contracts')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.PRESIDENT, Role.VP)
  async getCollegeContracts() {
    return this.algorandService.getCollegeContracts();
  }

  @Get('algorand/indexer/transactions')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.PRESIDENT, Role.VP)
  async getCollegeScopedTransactions(
    @Query('limit') limit?: string,
  ) {
    return this.algorandService.getCollegeScopedIndexerTransactions(
      limit ? Number(limit) : 25,
    );
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
