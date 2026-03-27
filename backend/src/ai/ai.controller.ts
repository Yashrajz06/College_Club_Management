import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TokenGate } from '../auth/decorators/token-gate.decorator';
import { Role, BlockchainActionType } from '@prisma/client';
import { Body, Post, Request } from '@nestjs/common';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@TokenGate(BlockchainActionType.MINT)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('draft-message')
  @Roles(Role.PRESIDENT, Role.VP)
  async draftMessage(@Query('eventId') eventId: string, @Query('sponsorId') sponsorId: string) {
    return this.aiService.draftSponsorMessage(eventId, sponsorId);
  }

  @Get('generate-poster')
  @Roles(Role.PRESIDENT, Role.VP)
  async generatePoster(@Query('prompt') prompt: string) {
    return this.aiService.generatePosterBackground(prompt);
  }

  @Get('generate-event-poster')
  @Roles(Role.PRESIDENT, Role.VP)
  async generateEventPoster(
    @Query('eventId') eventId: string,
    @Query('mood') mood?: string,
    @Query('tagline') tagline?: string,
  ) {
    return this.aiService.generateEventPoster(eventId, { mood, tagline });
  }

  @Get('assistant-context')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async getAssistantContext() {
    return this.aiService.getAssistantContext();
  }

  @Post('chat')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async chatWithAssistant(
    @Request() req: any,
    @Body('prompt') prompt: string,
    @Body('history') history?: { role: string; content: string }[],
  ) {
    return this.aiService.chatWithAssistant(req.user.userId, prompt, history);
  }

  @Post('execute-action')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async executeAction(
    @Request() req: any,
    @Body()
    body: {
      type: 'CREATE_PROPOSAL' | 'MINT_TOKEN';
      payload: any;
    },
  ) {
    return this.aiService.executeSuggestedAction(req.user.userId, body.type, body.payload);
  }
}
