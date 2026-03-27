import { SponsorStatus } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { AiService } from '../ai/ai.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class SponsorService {
    private readonly prisma;
    private readonly cls;
    private readonly aiService;
    private readonly insights;
    constructor(prisma: PrismaService, cls: ClsService, aiService: AiService, insights: InsightsService);
    addSponsor(data: {
        name: string;
        organization: string;
        email?: string;
        phone?: string;
        clubId: string;
        requesterId: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
        name: string;
        organization: string;
        email: string | null;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    updateStatus(sponsorId: string, status: SponsorStatus, requesterId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
        name: string;
        organization: string;
        email: string | null;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    generateOutreachDraft(sponsorId: string, eventId: string, requesterId: string): Promise<{
        subject: string;
        message: string;
    }>;
    getSponsorsForClub(clubId: string): Promise<({
        transactions: {
            date: Date;
            amount: number;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
        name: string;
        organization: string;
        email: string | null;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    })[]>;
    deleteSponsor(sponsorId: string, requesterId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
        name: string;
        organization: string;
        email: string | null;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    private assertClubOwnership;
    private getCurrentCollegeIdOrThrow;
}
