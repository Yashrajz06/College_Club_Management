import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from '../insights/insights.service';
import { SupabaseService } from '../supabase/supabase.service';
export declare class AiService {
    private prisma;
    private readonly insights;
    private readonly supabase;
    constructor(prisma: PrismaService, insights: InsightsService, supabase: SupabaseService);
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
    generateEventPoster(eventId: string, options?: {
        mood?: string;
        tagline?: string;
    }): Promise<{
        imageUrl: string;
        prompt: string;
        source: string;
        error?: undefined;
    } | {
        imageUrl: string;
        prompt: string;
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
    getAssistantContext(): Promise<{
        source: string;
        generatedAt: string;
        dashboard: {
            clubCount: number;
            memberCount: number;
            eventCount: number;
            totalBudget: number;
            pendingClubCount: number;
            pendingEventCount: number;
            sponsorCount: number;
            confirmedSponsorCount: number;
            upcomingEventCount: number;
            participationRate: number;
            mostActiveClubs: {
                clubId: string;
                approvedEventCount: number;
            }[];
            treasuryTrackedClubs: number;
        };
        clubs: ({
            error: true;
        } & "Received a generic string")[];
        recentEvents: ({
            error: true;
        } & "Received a generic string")[];
        sponsors: ({
            error: true;
        } & "Received a generic string")[];
        recentAnalytics: {
            entityType: any;
            action: any;
            entityId: any;
            createdAt: any;
        }[];
        blockchain: any[];
    } | {
        source: string;
        generatedAt: string;
        dashboard: {
            clubCount: number;
            memberCount: number;
            eventCount: number;
            totalBudget: number;
            pendingClubCount: number;
            pendingEventCount: number;
            sponsorCount: number;
            confirmedSponsorCount: number;
            upcomingEventCount: number;
            participationRate: number;
            mostActiveClubs: {
                clubId: string;
                approvedEventCount: number;
            }[];
            treasuryTrackedClubs: number;
        };
        clubs: {
            id: string;
            category: string;
            status: import(".prisma/client").$Enums.ClubStatus;
            name: string;
            prizePoolBalance: number;
        }[];
        recentEvents: {
            id: string;
            title: string;
            date: Date;
            venue: string;
            status: import(".prisma/client").$Enums.EventStatus;
            posterImageUrl: string | null;
            clubId: string;
        }[];
        sponsors: {
            id: string;
            status: import(".prisma/client").$Enums.SponsorStatus;
            name: string;
            organization: string;
            lastContactedAt: Date | null;
        }[];
        recentAnalytics: never[];
        blockchain: any[];
    }>;
    private persistPosterAsset;
}
