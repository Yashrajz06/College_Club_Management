import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { MailService } from '../mail/mail.service';
export declare class EventService {
    private prisma;
    private aiService;
    private mailService;
    constructor(prisma: PrismaService, aiService: AiService, mailService: MailService);
    createEvent(data: {
        title: string;
        description: string;
        date: Date;
        venue: string;
        capacity: number;
        budget?: number;
        clubId: string;
        isPublic: boolean;
    }): Promise<{
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
    getPendingApprovals(coordinatorId: string): Promise<({
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
    approveEvent(eventId: string, remarks?: string): Promise<{
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
    rejectEvent(eventId: string, remarks?: string): Promise<{
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
    getPublishableEvents(userId: string): Promise<({
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
    makeEventPublic(eventId: string, userId: string): Promise<{
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
    concludeEvent(eventId: string): Promise<{
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
    getEventById(eventId: string): Promise<{
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
    registerForEvent(userId: string, eventId: string): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    registerGuest(eventId: string, guest: {
        name: string;
        email: string;
        phone: string;
        institution?: string;
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
    getEventRegistrations(eventId: string): Promise<({
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
    markAttendance(registrationId: string, attended: boolean): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
    markAttendanceByQR(qrCode: string): Promise<{
        id: string;
        userId: string;
        attended: boolean;
        eventId: string;
        isWaitlisted: boolean;
        qrCode: string | null;
        certificateUrl: string | null;
        registeredAt: Date;
    }>;
}
