export declare class MailService {
    private readonly logger;
    private transporter;
    constructor();
    sendInviteEmail(email: string, name: string, inviteLink: string): Promise<void>;
    sendGuestRegistrationConfirmation(opts: {
        guestEmail: string;
        guestName: string;
        eventTitle: string;
        eventDate: string;
        eventVenue: string;
        clubName: string;
    }): Promise<void>;
    sendEventReminder(opts: {
        recipientEmail: string;
        recipientName: string;
        eventTitle: string;
        eventDate: string;
    }): Promise<void>;
}
