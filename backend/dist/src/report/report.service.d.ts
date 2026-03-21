import { PrismaService } from '../prisma/prisma.service';
export declare class ReportService {
    private prisma;
    constructor(prisma: PrismaService);
    generateEventSummary(eventId: string): Promise<Buffer>;
}
