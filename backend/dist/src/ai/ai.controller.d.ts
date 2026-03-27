import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    draftMessage(eventId: string, sponsorId: string): Promise<{
        subject: string;
        message: string;
    }>;
    generatePoster(prompt: string): Promise<{
        imageUrl: string;
        source: string;
        error?: undefined;
    } | {
        imageUrl: string;
        source: string;
        error: any;
    }>;
    generateEventPoster(eventId: string, mood?: string, tagline?: string): Promise<{
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
            name: string;
            status: import(".prisma/client").$Enums.ClubStatus;
            category: string;
            prizePoolBalance: number;
        }[];
        recentEvents: {
            id: string;
            status: import(".prisma/client").$Enums.EventStatus;
            title: string;
            date: Date;
            venue: string;
            posterImageUrl: string | null;
            clubId: string;
        }[];
        sponsors: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.SponsorStatus;
            organization: string;
            lastContactedAt: Date | null;
        }[];
        recentAnalytics: never[];
        blockchain: any[];
    }>;
}
