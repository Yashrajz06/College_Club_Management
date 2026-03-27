import { ClsService } from 'nestjs-cls';
import { AlgorandService } from '../finance/algorand.service';
import { InsightsService } from '../insights/insights.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ClubService {
    private readonly prisma;
    private readonly cls;
    private readonly algorand;
    private readonly insights;
    constructor(prisma: PrismaService, cls: ClsService, algorand: AlgorandService, insights: InsightsService);
    createClubRequest(data: {
        name: string;
        description: string;
        category: string;
        presidentId: string;
        vpEmailOrId: string;
        coordinatorEmailOrId: string;
    }): Promise<{
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
    getPendingRequests(): Promise<({
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
    approveClub(clubId: string, remarks?: string): Promise<{
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
    rejectClub(clubId: string, remarks?: string): Promise<{
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
    getClubById(clubId: string): Promise<{
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
    updateClub(clubId: string, userId: string, data: {
        name?: string;
        description?: string;
        category?: string;
        coordinatorEmailOrId?: string;
        vpEmailOrId?: string;
    }): Promise<{
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
    deleteClub(clubId: string, userId: string): Promise<{
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
    getAllClubsWithStats(): Promise<({
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
    getMyClub(userId: string): Promise<{
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.ClubStatus;
        category: string;
        presidentId: string | null;
        vpId: string | null;
    } | null>;
    sendInvitation(clubId: string, senderId: string, emailOrId: string, customRole?: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.InvitationStatus;
        clubId: string;
        userId: string;
        customRole: string | null;
    }>;
    getInvitationsForUser(userId: string): Promise<({
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
    respondToInvitation(invitationId: string, userId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<{
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
    private ensureMembership;
    private getCurrentCollegeIdOrThrow;
}
