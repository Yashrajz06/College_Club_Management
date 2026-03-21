import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SponsorStatus } from '@prisma/client';

@Injectable()
export class SponsorService {
  constructor(private prisma: PrismaService) {}

  async addSponsor(data: { name: string; organization: string; email?: string; phone?: string; clubId: string }) {
    return this.prisma.sponsor.create({
      data: {
        ...data,
        status: SponsorStatus.PROSPECT
      }
    });
  }

  async updateStatus(sponsorId: string, status: SponsorStatus) {
    return this.prisma.sponsor.update({
      where: { id: sponsorId },
      data: { status }
    });
  }

  async getSponsorsForClub(clubId: string) {
    return this.prisma.sponsor.findMany({
      where: { clubId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: { select: { amount: true, date: true } }
      }
    });
  }
}
