import { EventService } from './event.service';
export declare class EventController {
    private readonly eventService;
    constructor(eventService: EventService);
    createEvent(req: any, body: any): Promise<{
        club: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    updateEvent(id: string, req: any, body: any): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    deleteEvent(id: string, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    getPending(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    })[]>;
    approveEvent(id: string, remarks?: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    rejectEvent(id: string, remarks?: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    getPublicEvents(): Promise<({
        club: {
            description: string;
            name: string;
        };
        registrations: {
            id: string;
        }[];
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    })[]>;
    getClubEvents(clubId: string): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    })[]>;
    register(id: string, req: any): Promise<{
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    guestRegister(id: string, body: any): Promise<{
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    getRegistrations(id: string): Promise<({
        user: {
            id: string;
            name: string;
            email: string;
            studentId: string | null;
            role: import(".prisma/client").$Enums.Role;
            walletAddress: string | null;
        };
    } & {
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    })[]>;
    markAttendance(id: string, body: {
        registrationId: string;
        attended: boolean;
    }): Promise<{
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    markAttendanceByQR(body: {
        qrCode: string;
    }): Promise<{
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    concludeEvent(id: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    getPublishable(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    })[]>;
    makePublic(id: string, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
    getEventById(id: string): Promise<{
        club: {
            id: string;
            description: string;
            name: string;
        };
        registrations: {
            id: string;
            userId: string;
            qrCode: string | null;
            certificateUrl: string | null;
        }[];
        proposals: {
            id: string;
            title: string;
            status: import(".prisma/client").$Enums.GovernanceProposalStatus;
            createdAt: Date;
        }[];
    } & {
        id: string;
        title: string;
        description: string;
        category: string | null;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        clubId: string;
    }>;
}
