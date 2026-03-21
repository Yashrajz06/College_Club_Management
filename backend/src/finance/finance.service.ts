import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, Role } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async logTransaction(data: { amount: number; type: TransactionType; description: string; clubId: string; eventId?: string; sponsorId?: string; userId: string }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    // Perform transaction using Prisma interactive transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Create ledger log
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          description: data.description,
          clubId: data.clubId,
          eventId: data.eventId,
          sponsorId: data.sponsorId
        }
      });

      // Update prize pool balance
      const club = await tx.club.update({
        where: { id: data.clubId },
        data: {
          prizePoolBalance: data.type === TransactionType.CREDIT 
            ? { increment: data.amount } 
            : { decrement: data.amount }
        }
      });

      if (club.prizePoolBalance < 0) {
        throw new BadRequestException('Insufficient funds in the Prize Pool');
      }

      return transaction;
    });
  }

  async getClubTransactions(clubId: string) {
    return this.prisma.transaction.findMany({
      where: { clubId },
      include: {
        event: { select: { title: true } },
        sponsor: { select: { organization: true } }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getClubBalance(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { prizePoolBalance: true }
    });
    return club?.prizePoolBalance || 0;
  }
}
