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
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
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
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    approveClub(id: string, remarks?: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    rejectClub(id: string, remarks?: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
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
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
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
        _count: {
            members: number;
            events: number;
        };
        president: {
            name: string;
            email: string;
        } | null;
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    getMyClub(req: any): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        category: string;
        presidentId: string | null;
        vpId: string | null;
    } | null>;
    inviteMember(clubId: string, req: any, body: {
        emailOrId: string;
        customRole?: string;
    }): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
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
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        clubId: string;
        userId: string;
        customRole: string | null;
    })[]>;
    respondToInvite(inviteId: string, req: any, body: {
        status: 'ACCEPTED' | 'REJECTED';
    }): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
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
        collegeId: string;
        id: string;
        clubId: string;
        userId: string;
        customRole: string | null;
        joinedAt: Date;
    })[]>;
    getClub(clubId: string): Promise<{
        _count: {
            members: number;
            events: number;
            sponsors: number;
            tasks: number;
        };
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
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    updateClub(clubId: string, req: any, body: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    deleteClub(clubId: string, req: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        description: string;
        category: string;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
}
