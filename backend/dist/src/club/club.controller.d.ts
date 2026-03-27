import { ClubService } from './club.service';
export declare class ClubController {
    private readonly clubService;
    constructor(clubService: ClubService);
    createRequest(req: any, body: any): Promise<{
        coordinator: {
            id: string;
            email: string;
            name: string;
        } | null;
        president: {
            id: string;
            email: string;
            name: string;
        } | null;
        vp: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
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
            email: string;
            name: string;
        } | null;
        president: {
            email: string;
            name: string;
        } | null;
        vp: {
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    })[]>;
    approveClub(id: string, remarks?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    rejectClub(id: string, remarks?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
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
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
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
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
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
        createdAt: Date;
        collegeId: string;
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
        collegeId: string;
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
        collegeId: string;
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
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        collegeId: string;
        userId: string;
        clubId: string;
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
            email: string;
            name: string;
        } | null;
        president: {
            id: string;
            email: string;
            name: string;
        } | null;
        vp: {
            id: string;
            email: string;
            name: string;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    updateClub(clubId: string, req: any, body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
    deleteClub(clubId: string, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        prizePoolBalance: number;
        coordinatorId: string | null;
        presidentId: string | null;
        vpId: string | null;
    }>;
}
