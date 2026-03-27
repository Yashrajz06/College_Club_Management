import { SponsorStatus } from '@prisma/client';
import { SponsorService } from './sponsor.service';
export declare class SponsorController {
    private readonly sponsorService;
    constructor(sponsorService: SponsorService);
    createSponsor(req: any, body: any): Promise<{
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
    updateSponsorStatus(id: string, req: any, status: SponsorStatus): Promise<{
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
    createOutreachDraft(id: string, req: any, eventId: string): Promise<{
        subject: string;
        message: string;
    }>;
    deleteSponsor(id: string, req: any): Promise<{
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
    getClubSponsors(clubId: string): Promise<({
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
}
