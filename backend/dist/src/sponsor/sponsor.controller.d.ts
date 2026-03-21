import { SponsorService } from './sponsor.service';
import { SponsorStatus } from '@prisma/client';
export declare class SponsorController {
    private readonly sponsorService;
    constructor(sponsorService: SponsorService);
    createSponsor(body: any): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    }>;
    updateSponsorStatus(id: string, status: SponsorStatus): Promise<{
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    }>;
    getClubSponsors(clubId: string): Promise<({
        transactions: {
            date: Date;
            amount: number;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SponsorStatus;
        clubId: string;
        organization: string;
        phone: string | null;
    })[]>;
}
