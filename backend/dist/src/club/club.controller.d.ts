import { ClubService } from './club.service';
export declare class ClubController {
    private readonly clubService;
    constructor(clubService: ClubService);
    createRequest(req: any, body: any): Promise<{
        coordinator: {
            id: string;
            name: string;
            email: string;
        } | null;
        president: {
            id: string;
            name: string;
            email: string;
        } | null;
        vp: {
            id: string;
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    getPending(): Promise<({
        coordinator: {
            name: string;
            email: string;
        } | null;
        president: {
            name: string;
            email: string;
        } | null;
        vp: {
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    approveClub(id: string, remarks?: string): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    rejectClub(id: string, remarks?: string): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    getActiveClubs(): Promise<({
        coordinator: {
            id: string;
            name: string;
        } | null;
        president: {
            id: string;
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    getGlobalStats(): Promise<{
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
    }>;
    getAllWithStats(): Promise<({
        president: {
            name: string;
            email: string;
        } | null;
        _count: {
            members: number;
            events: number;
        };
    } & {
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    getMyClub(req: any): Promise<{
        id: string;
        name: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        presidentId: string | null;
        vpId: string | null;
    } | null>;
    inviteMember(clubId: string, req: any, body: {
        emailOrId: string;
        customRole?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        collegeId: string;
        clubId: string;
        userId: string;
        customRole: string | null;
    }>;
    getMyInvitations(req: any): Promise<({
        club: {
            name: string;
            category: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        collegeId: string;
        clubId: string;
        userId: string;
        customRole: string | null;
    })[]>;
    respondToInvite(inviteId: string, req: any, body: {
        status: 'ACCEPTED' | 'REJECTED';
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        collegeId: string;
        clubId: string;
        userId: string;
        customRole: string | null;
    }>;
    getMembers(clubId: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        collegeId: string;
        clubId: string;
        userId: string;
        customRole: string | null;
        joinedAt: Date;
    })[]>;
    getClub(clubId: string): Promise<{
        coordinator: {
            id: string;
            name: string;
            email: string;
        } | null;
        president: {
            id: string;
            name: string;
            email: string;
        } | null;
        vp: {
            id: string;
            name: string;
            email: string;
        } | null;
        _count: {
            members: number;
            events: number;
            sponsors: number;
            tasks: number;
        };
    } & {
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    updateClub(clubId: string, req: any, body: any): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    deleteClub(clubId: string, req: any): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
}
