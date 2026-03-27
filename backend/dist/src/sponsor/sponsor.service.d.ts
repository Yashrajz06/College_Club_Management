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
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        email: string | null;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    updateStatus(sponsorId: string, status: SponsorStatus, requesterId: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        email: string | null;
        organization: string;
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
            amount: number;
            date: Date;
        }[];
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        email: string | null;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    })[]>;
    deleteSponsor(sponsorId: string, requesterId: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        email: string | null;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    private assertClubOwnership;
    private getCurrentCollegeIdOrThrow;
}
