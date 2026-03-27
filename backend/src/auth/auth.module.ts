import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    PassportModule,
    FinanceModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_for_hackathon',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
