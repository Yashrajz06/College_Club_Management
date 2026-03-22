import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    draftMessage(eventId: string, sponsorId: string): Promise<{
        subject: string;
        message: string;
    }>;
    generatePoster(prompt: string): Promise<{
        imageUrl: string;
        source: string;
        error?: undefined;
    } | {
        imageUrl: string;
        source: string;
        error: any;
    }>;
}
