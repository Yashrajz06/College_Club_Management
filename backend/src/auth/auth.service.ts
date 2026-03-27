import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { SetPasswordDto } from './dto/set-password.dto';
import { AlgorandService } from '../finance/algorand.service';
import { BlockchainActionType, CollegeContractType } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private supabase: SupabaseService,
    private readonly algorand: AlgorandService,
  ) {}

  async register(dto: { name: string; email: string; password: string; studentId?: string; department?: string; year?: number, secretCode?: string; collegeId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    let role: Role = Role.MEMBER;
    if (dto.secretCode) {
      if (dto.secretCode === (process.env.ADMIN_SECRET || 'admin-secret-123')) {
        role = Role.ADMIN;
      } else if (dto.secretCode === (process.env.COORDINATOR_SECRET || 'faculty-secret-123')) {
        role = Role.COORDINATOR;
      } else {
        throw new UnauthorizedException('Invalid registration secret code');
      }
    }

    const college = dto.collegeId
      ? await this.prisma.college.findFirst({
          where: { id: dto.collegeId },
          select: { id: true, domain: true },
        })
      : await this.prisma.college.findFirst({
          where: {
            domain: dto.email.split('@')[1]?.toLowerCase(),
          },
          select: { id: true, domain: true },
        });

    if (!college) {
      throw new BadRequestException(
        'No college matched this registration. Select a college first or use an email with a registered college domain.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        collegeId: college.id,
        name: dto.name,
        email: dto.email,
        passwordHash,
        studentId: dto.studentId,
        department: dto.department,
        year: dto.year,
        role: role,
      }
    });
    const { passwordHash: _, ...result } = user;

    // Sync: Log user creation for Analytics/AI (Category 9/10)
    this.logger.log(`[Analytics Sync] New user registered: ${user.id} role=${role}`);

    return this.login(result);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, collegeId: user.collegeId };

    // Sync: Log login for Analytics/AI metrics (Category 9/10)
    this.logger.log(`[Analytics Sync] User login: ${user.id}`);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { 
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_for_hackathon', 
        expiresIn: '7d' 
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        walletAddress: user.walletAddress || null,
      }
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_for_hackathon'
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async setPassword(dto: SetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { inviteToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invite link');
    }

    if (user.inviteTokenExpiry && new Date() > user.inviteTokenExpiry) {
      throw new BadRequestException('Invite link has expired. Please ask the admin to resend.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isVerified: true,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    return { message: 'Password set successfully. You can now log in.' };
  }

  // ── Profile ──────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, walletAddress: true,
        studentId: true, department: true, year: true, isVerified: true,
        collegeId: true, createdAt: true,
      },
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; department?: string; year?: number }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.department && { department: data.department }),
        ...(data.year && { year: data.year }),
      },
      select: {
        id: true, name: true, email: true, role: true, walletAddress: true,
        studentId: true, department: true, year: true,
      },
    });
  }

  // ── Wallet Connect/Disconnect (Pera) ────────────────────

  async connectWallet(userId: string, walletAddress: string) {
    // Store wallet address via Supabase (primary) with Prisma fallback
    try {
      const sb = this.supabase.getClient();
      await sb.from('User').update({ walletAddress }).eq('id', userId);
    } catch {
      // Fallback to Prisma if Supabase not configured
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletAddress },
      });
    }

    await this.algorand.triggerLifecycleAction({
      action: BlockchainActionType.MINT,
      contractType: CollegeContractType.ENTRY_TOKEN,
      entityId: userId,
      walletAddress,
      metadata: {
        reason: 'profile_setup',
        userId,
        targetWalletAddress: walletAddress,
      },
    });

    return { message: 'Wallet connected', walletAddress };
  }

  async disconnectWallet(userId: string) {
    try {
      const sb = this.supabase.getClient();
      await sb.from('User').update({ walletAddress: null }).eq('id', userId);
    } catch {
      await this.prisma.user.update({
        where: { id: userId },
        data: { walletAddress: null },
      });
    }

    return { message: 'Wallet disconnected' };
  }
}
