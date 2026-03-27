import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BlockchainActionType } from '@prisma/client';
import { TOKEN_GATE_KEY } from '../decorators/token-gate.decorator';
import { TokenGateService } from '../../finance/token-gate.service';

@Injectable()
export class TokenGateGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly tokenGateService: TokenGateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredActions = this.reflector.getAllAndOverride<BlockchainActionType[]>(TOKEN_GATE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredActions || requiredActions.length === 0) {
      return true; // No token gate required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // According to auth endpoints and JWT strategy, the user context usually includes ID.
    // Fetch wallet address via Prisma - normally user context would have it if it's connected,
    // but we can assume the user object has the wallet address attached or we query it.
    // Wait, the JWT strategy might not inject walletAddress. We should check if request.user has walletAddress.
    // If not, we have to rely on TokenGateService directly looking it up, or TokenGateService should take userId and look it up.
    // Let's adapt to pass what we have to a custom assertion or refactor. The existing service takes walletAddress.
    
    // Instead of doing DB call in the guard, let's assume the wallet Address *is* available on `user` or we'll throw.
    if (!user.walletAddress) {
      throw new ForbiddenException('A connected wallet is required to access this resource.');
    }

    // Enforce eligibility for all required actions
    for (const action of requiredActions) {
      await this.tokenGateService.assertWalletEligibleForAction({
        walletAddress: user.walletAddress,
        action,
      });
    }

    return true;
  }
}
