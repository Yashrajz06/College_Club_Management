import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import { Role } from '@prisma/client';
import { InviteCoordinatorDto } from '../auth/dto/invite-coordinator.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly cls: ClsService,
  ) {}

  async inviteCoordinator(dto: InviteCoordinatorDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await this.prisma.user.create({
      data: {
        collegeId: this.getCurrentCollegeIdOrThrow(),
        name: dto.name,
        email: dto.email,
        passwordHash: '',
        role: Role.COORDINATOR,
        isVerified: false,
        inviteToken: token,
        inviteTokenExpiry: expiry,
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    await this.mailService.sendInviteEmail(dto.email, dto.name, inviteLink);

    return { message: 'Invite sent successfully' };
  }

  async resendInvite(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already active');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        inviteToken: token,
        inviteTokenExpiry: expiry,
      },
    });

    const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    await this.mailService.sendInviteEmail(user.email, user.name, inviteLink);

    return { message: 'Invite resent successfully' };
  }

  async getCoordinators() {
    const coordinators = await this.prisma.user.findMany({
      where: { role: Role.COORDINATOR },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true,
        coordinatedClubs: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return coordinators;
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) {
      throw new BadRequestException('College context is required');
    }
    return collegeId;
  }
}
