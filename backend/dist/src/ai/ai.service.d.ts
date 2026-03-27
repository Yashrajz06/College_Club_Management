import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from '../insights/insights.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GovernanceService } from '../governance/governance.service';
import { AlgorandService } from '../finance/algorand.service';
export declare class AiService {
    private prisma;
    private readonly insights;
    private readonly supabase;
    private readonly governance;
    private readonly algorand;
    constructor(prisma: PrismaService, insights: InsightsService, supabase: SupabaseService, governance: GovernanceService, algorand: AlgorandService);
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
        tokenMetrics: {
            totalActiveTokens: number;
            distributionByAction: {
                action: import(".prisma/client").$Enums.TokenActionType;
                count: number;
            }[];
            topHolders: {
                userId: string;
                name: string;
                walletAddress: string | null | undefined;
                count: number;
            }[];
        };
        source: string;
        generatedAt: string;
        dashboard: {
            tokenMetrics: {
                totalActiveTokens: number;
                distributionByAction: {
                    action: import(".prisma/client").$Enums.TokenActionType;
                    count: number;
                }[];
                topHolders: {
                    userId: string;
                    name: string;
                    walletAddress: string | null | undefined;
                    count: number;
                }[];
            };
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
        tokenMetrics: {
            totalActiveTokens: number;
            distributionByAction: {
                action: import(".prisma/client").$Enums.TokenActionType;
                count: number;
            }[];
            topHolders: {
                userId: string;
                name: string;
                walletAddress: string | null | undefined;
                count: number;
            }[];
        };
        source: string;
        generatedAt: string;
        dashboard: {
            tokenMetrics: {
                totalActiveTokens: number;
                distributionByAction: {
                    action: import(".prisma/client").$Enums.TokenActionType;
                    count: number;
                }[];
                topHolders: {
                    userId: string;
                    name: string;
                    walletAddress: string | null | undefined;
                    count: number;
                }[];
            };
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
            category: string;
            status: import(".prisma/client").$Enums.ClubStatus;
            prizePoolBalance: number;
        }[];
        recentEvents: {
            id: string;
            status: import(".prisma/client").$Enums.EventStatus;
            clubId: string;
            title: string;
            date: Date;
            venue: string;
            posterImageUrl: string | null;
        }[];
        sponsors: {
            id: string;
            name: string;
            status: import(".prisma/client").$Enums.SponsorStatus;
            organization: string;
            lastContactedAt: Date | null;
        }[];
        treasuryContext: {
            id: string;
            status: import(".prisma/client").$Enums.TreasurySpendRequestStatus;
            title: string;
            amount: number;
        }[];
        recentAnalytics: never[];
        blockchain: any[];
    }>;
    chatWithAssistant(userId: string, prompt: string, history?: {
        role: string;
        content: string;
    }[]): Promise<{
        reply: string;
        suggestedAction: any;
    }>;
    executeSuggestedAction(userId: string, type: 'CREATE_PROPOSAL' | 'MINT_TOKEN', payload: any): Promise<{
        status: import(".prisma/client").$Enums.BlockchainSyncStatus;
        txId: string;
        activity: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            collegeId: string;
            walletAddress: string | null;
            status: import(".prisma/client").$Enums.BlockchainSyncStatus;
            action: import(".prisma/client").$Enums.BlockchainActionType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            note: string | null;
            txId: string;
            contractId: string | null;
        };
    } | {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        status: import(".prisma/client").$Enums.GovernanceProposalStatus;
        clubId: string;
        title: string;
        eventId: string;
        deadline: Date | null;
        spendAmount: number | null;
        forWeight: number;
        againstWeight: number;
        proposerId: string;
    }>;
    private persistPosterAsset;
}
