import { PrismaService } from '../prisma/prisma.service';
export declare class ClubService {
    private prisma;
    constructor(prisma: PrismaService);
    createClubRequest(data: {
        name: string;
        description: string;
        category: string;
        presidentId: string;
        vpEmailOrId: string;
        coordinatorEmailOrId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    getPendingRequests(): Promise<({
        coordinator: {
            name: string;
        } | null;
        president: {
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    approveClub(clubId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    rejectClub(clubId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    getActiveClubs(): Promise<({
        president: {
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    getGlobalStats(): Promise<{
        clubCount: number;
        memberCount: number;
        eventCount: number;
        totalBudget: number;
    }>;
    getAllClubsWithStats(): Promise<({
        president: {
            email: string;
            name: string;
        } | null;
        _count: {
            members: number;
            events: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    getMyClub(userId: string): Promise<{
        id: string;
        name: string;
    } | null>;
    sendInvitation(clubId: string, emailOrId: string, customRole?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        userId: string;
        clubId: string;
        customRole: string | null;
    }>;
    getInvitationsForUser(userId: string): Promise<({
        club: {
            name: string;
            category: string;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        userId: string;
        clubId: string;
        customRole: string | null;
    })[]>;
    respondToInvitation(invitationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        userId: string;
        clubId: string;
        customRole: string | null;
    }>;
    getMembers(clubId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        userId: string;
        clubId: string;
        customRole: string | null;
        joinedAt: Date;
    })[]>;
}
