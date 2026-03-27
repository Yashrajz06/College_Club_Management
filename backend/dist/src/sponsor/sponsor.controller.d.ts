import { SponsorStatus } from '@prisma/client';
import { SponsorService } from './sponsor.service';
export declare class SponsorController {
    private readonly sponsorService;
    constructor(sponsorService: SponsorService);
    createSponsor(req: any, body: any): Promise<{
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
    updateSponsorStatus(id: string, req: any, status: SponsorStatus): Promise<{
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
    createOutreachDraft(id: string, req: any, eventId: string): Promise<{
        subject: string;
        message: string;
    }>;
    deleteSponsor(id: string, req: any): Promise<{
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
    getClubSponsors(clubId: string): Promise<({
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
}
