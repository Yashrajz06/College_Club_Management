import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('my-tokens')
  @UseGuards(JwtAuthGuard)
  async getMyTokens(@Req() req: any) {
    return this.tokenService.getUserTokens(req.user.userId);
  }

  @Public()
  @Get('verify/:tokenId')
  async verifyToken(@Param('tokenId') tokenId: string) {
    return this.tokenService.verifyToken(tokenId);
  }
}
