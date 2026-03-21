import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: any) {
    const { refreshToken } = body;
    return this.authService.refresh(refreshToken);
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() body: SetPasswordDto) {
    return this.authService.setPassword(body);
  }
}
