import { SponsorStatus } from '@prisma/client';
import { SponsorService } from './sponsor.service';
export declare class SponsorController {
    private readonly sponsorService;
    constructor(sponsorService: SponsorService);
    createSponsor(req: any, body: any): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        email: string | null;
        clubId: string;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    updateSponsorStatus(id: string, req: any, status: SponsorStatus): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        email: string | null;
        clubId: string;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    createOutreachDraft(id: string, req: any, eventId: string): Promise<{
        subject: string;
        message: string;
    }>;
    deleteSponsor(id: string, req: any): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        email: string | null;
        clubId: string;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    }>;
    getClubSponsors(clubId: string): Promise<({
        transactions: {
            date: Date;
            amount: number;
        }[];
    } & {
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.SponsorStatus;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        email: string | null;
        clubId: string;
        organization: string;
        phone: string | null;
        outreachDraft: string | null;
        lastContactedAt: Date | null;
    })[]>;
}
