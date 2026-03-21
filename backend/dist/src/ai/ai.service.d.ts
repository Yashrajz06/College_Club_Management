import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private prisma;
    constructor(prisma: PrismaService);
    draftSponsorMessage(eventId: string, sponsorId: string): Promise<{
        subject: string;
        message: string;
    }>;
    generatePosterBackground(prompt: string): Promise<{
        imageUrl: string;
    }>;
    generateGuestCertificates(eventId: string): Promise<{
        count: number;
        status: string;
    } | undefined>;
}
