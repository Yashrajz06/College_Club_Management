import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
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
}
