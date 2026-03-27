import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private readonly cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_for_hackathon',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: payload.sub },
      // Important: We need the collegeId for the CLS context
      select: { id: true, email: true, role: true, collegeId: true, walletAddress: true } 
    });
    
    if (!user) {
      throw new UnauthorizedException();
    }

    // Set the collegeId in CLS context for automatic Prisma scoping
    this.cls.set('collegeId', user.collegeId);

    return { userId: user.id, email: user.email, role: user.role, collegeId: user.collegeId, walletAddress: user.walletAddress };
  }
}
