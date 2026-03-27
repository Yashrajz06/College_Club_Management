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
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    updateEvent(id: string, req: any, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    deleteEvent(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    getPending(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    })[]>;
    approveEvent(id: string, req: any, remarks?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    rejectEvent(id: string, req: any, remarks?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    getPublicEvents(): Promise<({
        registrations: {
            id: string;
        }[];
        club: {
            name: string;
            description: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    })[]>;
    getClubEvents(clubId: string): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
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
        guestPhone: string | null;
        guestInstitution: string | null;
        registeredAt: Date;
    }>;
    getMyRegistrations(req: any): Promise<({
        event: {
            id: string;
            title: string;
            date: Date;
            venue: string;
            capacity: number;
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
        guestPhone: string | null;
        guestInstitution: string | null;
        registeredAt: Date;
    })[]>;
    guestRegister(id: string, body: any): Promise<{
        id: string;
        collegeId: string;
        userId: string;
        eventId: string;
        isWaitlisted: boolean;
        attended: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        guestPhone: string | null;
        guestInstitution: string | null;
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
        guestPhone: string | null;
        guestInstitution: string | null;
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
        guestPhone: string | null;
        guestInstitution: string | null;
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
        guestPhone: string | null;
        guestInstitution: string | null;
        registeredAt: Date;
    }>;
    concludeEvent(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    getPublishable(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    })[]>;
    makePublic(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
    getEventById(id: string): Promise<{
        registrations: {
            id: string;
            userId: string;
            qrCode: string | null;
            certificateUrl: string | null;
        }[];
        proposals: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.GovernanceProposalStatus;
            title: string;
        }[];
        club: {
            id: string;
            name: string;
            description: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        collegeId: string;
        description: string;
        category: string | null;
        status: import(".prisma/client").$Enums.EventStatus;
        approvalRemarks: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        clubId: string;
        title: string;
        date: Date;
        venue: string;
        capacity: number;
        budget: number;
        isPublic: boolean;
        posterPrompt: string | null;
        posterImageUrl: string | null;
        treasuryPlaceholderTxId: string | null;
    }>;
}
