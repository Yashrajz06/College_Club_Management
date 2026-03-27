import { Controller, Post, Body, Get, Patch, UnauthorizedException, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: any) {
    return this.authService.register({
      name: body.name,
      email: body.email,
      password: body.password,
      studentId: body.studentId,
      department: body.department,
      year: body.year ? parseInt(body.year) : undefined,
      secretCode: body.secretCode,
      collegeId: body.collegeId,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    const { refreshToken } = body;
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() body: SetPasswordDto) {
    return this.authService.setPassword(body);
  }

  // ── Authenticated Endpoints ──────────────────────────────

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('wallet/connect')
  @HttpCode(HttpStatus.OK)
  async connectWallet(@Req() req: any, @Body() body: { walletAddress: string }) {
    return this.authService.connectWallet(req.user.userId, body.walletAddress);
  }

  @Post('wallet/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectWallet(@Req() req: any) {
    return this.authService.disconnectWallet(req.user.userId);
  }
}
