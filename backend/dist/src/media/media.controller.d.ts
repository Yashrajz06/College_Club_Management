import { MediaService } from './media.service';
import type { Response } from 'express';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    getGallery(clubId: string): Promise<{
        name: string;
        url: string;
        size: number;
        lastModified: string;
    }[]>;
    uploadFiles(clubId: string, files: Express.Multer.File[]): Promise<({
        name: string;
        url: string;
        size: number;
        error?: undefined;
    } | {
        name: string;
        error: string;
        url?: undefined;
        size?: undefined;
    })[]>;
    downloadFile(clubId: string, filename: string, res: Response): Promise<void>;
}
