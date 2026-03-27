import { EventService } from './event.service';
export declare class EventController {
    private readonly eventService;
    constructor(eventService: EventService);
    createEvent(req: any, body: any): Promise<{
        club: {
            name: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    updateEvent(id: string, req: any, body: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    deleteEvent(id: string, req: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    getPending(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    })[]>;
    approveEvent(id: string, req: any, remarks?: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    rejectEvent(id: string, req: any, remarks?: string): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    getPublicEvents(): Promise<({
        club: {
            name: string;
            description: string;
        };
        registrations: {
            id: string;
        }[];
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    })[]>;
    getClubEvents(clubId: string): Promise<({
        club: {
            name: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    })[]>;
    register(id: string, req: any): Promise<{
        collegeId: string;
        id: string;
        eventId: string;
        userId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    guestRegister(id: string, body: any): Promise<{
        collegeId: string;
        id: string;
        eventId: string;
        userId: string;
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
            walletAddress: string | null;
            email: string;
            studentId: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        collegeId: string;
        id: string;
        eventId: string;
        userId: string;
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
        collegeId: string;
        id: string;
        eventId: string;
        userId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    markAttendanceByQR(body: {
        qrCode: string;
    }): Promise<{
        collegeId: string;
        id: string;
        eventId: string;
        userId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    concludeEvent(id: string, req: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    getPublishable(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    })[]>;
    makePublic(id: string, req: any): Promise<{
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
    getEventById(id: string): Promise<{
        club: {
            id: string;
            name: string;
            description: string;
        };
        proposals: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.GovernanceProposalStatus;
            title: string;
        }[];
        registrations: {
            id: string;
            userId: string;
            qrCode: string | null;
            certificateUrl: string | null;
        }[];
    } & {
        collegeId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EventStatus;
        description: string;
        category: string | null;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
        clubId: string;
    }>;
}
