import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { SetPasswordDto } from './dto/set-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: { name: string; email: string; password: string; studentId?: string; department?: string; year?: number, secretCode?: string }) {
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

    const user = await this.prisma.user.create({
      data: {
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
    const payload = { email: user.email, sub: user.id, role: user.role };
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
        role: user.role
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
}
