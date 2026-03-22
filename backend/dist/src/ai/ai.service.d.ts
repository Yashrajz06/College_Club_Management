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
        source: string;
        error?: undefined;
    } | {
        imageUrl: string;
        source: string;
        error: any;
    }>;
    generateGuestCertificates(eventId: string): Promise<{
        count: number;
        status: string;
        certificates?: undefined;
    } | {
        count: number;
        status: string;
        certificates: {
            name: string;
            certificateUrl: string;
        }[];
    }>;
    checkOllamaHealth(): Promise<boolean>;
}
