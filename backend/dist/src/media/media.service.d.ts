import { Readable } from 'stream';
export declare class MediaService {
    private readonly logger;
    private client;
    constructor();
    private ensureBucket;
    private objectName;
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
    getGallery(clubId: string): Promise<{
        name: string;
        url: string;
        size: number;
        lastModified: string;
    }[]>;
    downloadFile(clubId: string, filename: string): Promise<Readable>;
}
