import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BlockchainActionType,
  CollegeContractType,
} from '@prisma/client';
import algosdk from 'algosdk';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../prisma/prisma.service';
import { AlgorandService } from '../finance/algorand.service';
import { TokenGateService } from '../finance/token-gate.service';
import { InsightsService } from '../insights/insights.service';
import { TokenService } from '../token/token.service';
import { TokenActionType } from '@prisma/client';

interface NonceEntry {
  nonce: string;
  message: string;
  registrationId: string;
  createdAt: number;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly nonceCache = new Map<string, NonceEntry>();
  private readonly NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly algorand: AlgorandService,
    private readonly tokenGate: TokenGateService,
    private readonly insights: InsightsService,
    private readonly tokenService: TokenService,
  ) {
    // Periodically clean expired nonces
    setInterval(() => this.cleanExpiredNonces(), 60_000);
  }

  private getCurrentCollegeIdOrThrow() {
    const collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
    if (!collegeId) throw new BadRequestException('College context not available');
    return collegeId;
  }

  // ── Generate Nonce Challenge ──────────────────────────────

  async generateNonceChallenge(registrationId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();

    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, collegeId },
      include: {
        event: { select: { id: true, title: true, status: true, date: true } },
        user: { select: { id: true, name: true, walletAddress: true } },
      },
    });

    if (!registration) throw new NotFoundException('Registration not found.');
    if (registration.attended) {
      throw new BadRequestException('Attendance already verified for this registration.');
    }
    if (!registration.user.walletAddress) {
      throw new BadRequestException('User must connect a Pera Wallet before PoP verification.');
    }

    // Token gate: user must hold Event Entry Token
    try {
      await this.tokenGate.assertWalletEligibleForAction({
        walletAddress: registration.user.walletAddress,
        action: BlockchainActionType.MINT,
      });
    } catch {
      throw new BadRequestException(
        'User does not hold the required Event Entry Token for PoP verification.',
      );
    }

    const nonce = randomUUID();
    const message = `PoP:${collegeId}:${registration.eventId}:${registrationId}:${nonce}:${Date.now()}`;

    const entry: NonceEntry = {
      nonce,
      message,
      registrationId,
      createdAt: Date.now(),
    };
    this.nonceCache.set(nonce, entry);

    this.logger.log(`Nonce challenge generated for registration ${registrationId}`);

    return {
      nonce,
      message,
      registrationId,
      eventTitle: registration.event.title,
      userName: registration.user.name,
      walletAddress: registration.user.walletAddress,
      expiresIn: this.NONCE_TTL_MS / 1000,
    };
  }

  // ── Verify Attendance Proof ───────────────────────────────

  async verifyAttendanceProof(data: {
    registrationId: string;
    walletAddress: string;
    signedBytes: string; // base64 encoded signature
    nonce: string;
    geolocation?: { latitude: number; longitude: number; accuracy?: number };
  }) {
    const collegeId = this.getCurrentCollegeIdOrThrow();

    // 1. Validate nonce
    const nonceEntry = this.nonceCache.get(data.nonce);
    if (!nonceEntry) {
      throw new BadRequestException('Invalid or expired nonce. Please request a new challenge.');
    }
    if (nonceEntry.registrationId !== data.registrationId) {
      throw new BadRequestException('Nonce does not match the registration.');
    }
    if (Date.now() - nonceEntry.createdAt > this.NONCE_TTL_MS) {
      this.nonceCache.delete(data.nonce);
      throw new BadRequestException('Nonce expired. Please request a new challenge.');
    }

    // 2. Verify registration
    const registration = await this.prisma.registration.findFirst({
      where: { id: data.registrationId, collegeId },
      include: {
        event: { select: { id: true, title: true, clubId: true } },
        user: { select: { id: true, name: true, walletAddress: true } },
      },
    });

    if (!registration) throw new NotFoundException('Registration not found.');
    if (registration.attended) {
      throw new BadRequestException('Attendance already verified.');
    }
    if (registration.user.walletAddress !== data.walletAddress) {
      throw new BadRequestException('Wallet address does not match registered user.');
    }

    // 3. Cryptographic verification: algosdk.verifyBytes
    const messageBytes = new Uint8Array(Buffer.from(nonceEntry.message));
    const signatureBytes = new Uint8Array(Buffer.from(data.signedBytes, 'base64'));

    let isValid = false;
    try {
      isValid = algosdk.verifyBytes(messageBytes, signatureBytes, data.walletAddress);
    } catch (err) {
      this.logger.warn(`Signature verification error: ${err}`);
      throw new BadRequestException('Signature verification failed.');
    }

    if (!isValid) {
      throw new BadRequestException(
        'Cryptographic verification failed. Signature does not match the wallet address.',
      );
    }

    // 4. Consume nonce
    this.nonceCache.delete(data.nonce);

    // 5. Mark attendance in DB
    await this.prisma.registration.update({
      where: { id: registration.id },
      data: { attended: true },
    });

    // 6. Mint Participation Entry Token & Soulbound NFT
    const mintResults: { entryTokenTxId?: string; soulboundTxId?: string; proofTxId?: string } = {};

    try {
      const entryToken = await this.tokenService.mintEntryToken({
        userId: registration.userId,
        actionType: TokenActionType.ATTEND,
        walletAddress: data.walletAddress,
        eventId: registration.eventId,
        clubId: registration.event.clubId,
        metadata: {
          reason: 'pop_attendance_verified',
          registrationId: registration.id,
        },
      });
      mintResults.entryTokenTxId = entryToken.txId;
      mintResults.soulboundTxId = entryToken.soulboundTxId ?? undefined;
    } catch (err) {
      this.logger.warn(`Failed to mint entry/soulbound tokens: ${err}`);
    }

    // 8. Log on-chain attendance proof note
    try {
      const proofResult = await this.algorand.submitServerSignedNoteTransaction({
        action: BlockchainActionType.MINT,
        contractType: CollegeContractType.ENTRY_TOKEN,
        entityId: registration.id,
        metadata: {
          kind: 'pop_attendance_proof',
          registrationId: registration.id,
          eventId: registration.eventId,
          walletAddress: data.walletAddress,
          verifiedAt: new Date().toISOString(),
          geolocation: data.geolocation ?? null,
          nonce: data.nonce,
        },
      });
      mintResults.proofTxId = proofResult.txId;
    } catch (err) {
      this.logger.warn(`On-chain proof note failed: ${err}`);
    }

    // 9. Sync to InsightsService (treasury analytics + AI)
    await this.insights.recordSyncEvent({
      entityType: 'registration',
      action: 'pop_verified',
      entityId: registration.id,
      payload: {
        eventId: registration.eventId,
        clubId: registration.event.clubId,
        walletAddress: data.walletAddress,
        geolocation: data.geolocation ?? null,
        ...mintResults,
      },
    });

    this.logger.log(
      `PoP verified for registration ${registration.id}, wallet ${data.walletAddress}`,
    );

    return {
      success: true,
      registrationId: registration.id,
      eventTitle: registration.event.title,
      userName: registration.user.name,
      walletAddress: data.walletAddress,
      verifiedAt: new Date().toISOString(),
      geolocation: data.geolocation ?? null,
      tokens: mintResults,
    };
  }

  // ── Attendance Stats ──────────────────────────────────────

  async getAttendanceStats(eventId: string) {
    const collegeId = this.getCurrentCollegeIdOrThrow();

    const registrations = await this.prisma.registration.findMany({
      where: { eventId, collegeId },
      select: { id: true, attended: true, isWaitlisted: true },
    });

    const total = registrations.length;
    const verified = registrations.filter((r) => r.attended).length;
    const pending = registrations.filter((r) => !r.attended && !r.isWaitlisted).length;
    const waitlisted = registrations.filter((r) => r.isWaitlisted).length;

    return {
      eventId,
      total,
      verified,
      pending,
      waitlisted,
      verificationRate: total > 0 ? Number(((verified / total) * 100).toFixed(1)) : 0,
    };
  }

  // ── Helpers ───────────────────────────────────────────────

  private cleanExpiredNonces() {
    const now = Date.now();
    for (const [key, entry] of this.nonceCache.entries()) {
      if (now - entry.createdAt > this.NONCE_TTL_MS) {
        this.nonceCache.delete(key);
      }
    }
  }
}
