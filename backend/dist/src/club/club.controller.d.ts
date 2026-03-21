import { ClubService } from './club.service';
export declare class ClubController {
    private readonly clubService;
    constructor(clubService: ClubService);
    createRequest(req: any, body: any): Promise<{
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
    getPending(): Promise<({
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
    approveClub(id: string): Promise<{
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
    rejectClub(id: string): Promise<{
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
    getAllWithStats(): Promise<({
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
    getMyClub(req: any): Promise<{
        id: string;
        name: string;
    } | null>;
    inviteMember(clubId: string, body: {
        emailOrId: string;
        customRole?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        userId: string;
        clubId: string;
        customRole: string | null;
    }>;
    getMyInvitations(req: any): Promise<({
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
    respondToInvite(inviteId: string, req: any, body: {
        status: 'ACCEPTED' | 'REJECTED';
    }): Promise<{
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
