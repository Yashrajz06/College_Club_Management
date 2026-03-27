import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Role, BlockchainActionType } from '@prisma/client';
import { TokenGate } from '../auth/decorators/token-gate.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@TokenGate(BlockchainActionType.MINT)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ── Generate Nonce Challenge ──────────────────────────────
  @Post('challenge')
  async generateChallenge(@Body('registrationId') registrationId: string) {
    return this.attendanceService.generateNonceChallenge(registrationId);
  }

  // ── Verify Attendance Proof ───────────────────────────────
  @Post('verify')
  async verifyProof(
    @Body()
    body: {
      registrationId: string;
      walletAddress: string;
      signedBytes: string;
      nonce: string;
      geolocation?: { latitude: number; longitude: number; accuracy?: number };
    },
  ) {
    return this.attendanceService.verifyAttendanceProof(body);
  }

  // ── Attendance Stats ──────────────────────────────────────
  @Get('event/:eventId/stats')
  @Roles(Role.PRESIDENT, Role.VP, Role.COORDINATOR, Role.ADMIN)
  async getStats(@Param('eventId') eventId: string) {
    return this.attendanceService.getAttendanceStats(eventId);
  }
}
