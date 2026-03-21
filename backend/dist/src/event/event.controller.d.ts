import { EventService } from './event.service';
export declare class EventController {
    private readonly eventService;
    constructor(eventService: EventService);
    draftEvent(body: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    }>;
    getPending(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    })[]>;
    approveEvent(id: string, remarks: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    }>;
    rejectEvent(id: string, remarks: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
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
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    })[]>;
    getEventById(id: string): Promise<{
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
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    }>;
    register(id: string, req: any): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    guestRegister(id: string, body: any): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    getRegistrations(id: string): Promise<({
        user: {
            id: string;
            email: string;
            studentId: string | null;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    })[]>;
    markAttendance(id: string, body: {
        registrationId: string;
        attended: boolean;
    }): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    markAttendanceByQR(body: {
        qrCode: string;
    }): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    concludeEvent(id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    }>;
    getPublishable(req: any): Promise<({
        club: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    })[]>;
    makePublic(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        status: import(".prisma/client").$Enums.EventStatus;
        clubId: string;
        budget: number;
        capacity: number;
        title: string;
        date: Date;
        venue: string;
        isPublic: boolean;
    }>;
}
