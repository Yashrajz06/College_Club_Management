import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

const BUCKET = 'college-club-media';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) await this.client.makeBucket(BUCKET, 'us-east-1');
    } catch (err) {
      this.logger.warn(`MinIO bucket init failed (MinIO may not be running): ${err.message}`);
    }
  }

  private objectName(clubId: string, filename: string) {
    return `clubs/${clubId}/${filename}`;
  }

  async uploadFiles(clubId: string, files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      const name = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const objectName = this.objectName(clubId, name);
      try {
        await this.client.putObject(BUCKET, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });
        const url = await this.client.presignedGetObject(BUCKET, objectName, 7 * 24 * 60 * 60);
        results.push({ name, url, size: file.size });
      } catch (err) {
        this.logger.warn(`Failed to upload ${name}: ${err.message}`);
        results.push({ name, error: 'Upload failed – check if MinIO is running' });
      }
    }
    return results;
  }

  async getGallery(clubId: string): Promise<{ name: string; url: string; size: number; lastModified: string }[]> {
    const prefix = `clubs/${clubId}/`;
    const photos: { name: string; url: string; size: number; lastModified: string }[] = [];
    try {
      await new Promise<void>((resolve, reject) => {
        const stream = this.client.listObjects(BUCKET, prefix, true);
        stream.on('data', async (obj) => {
          if (!obj.name) return;
          const url = await this.client.presignedGetObject(BUCKET, obj.name, 7 * 24 * 60 * 60);
          photos.push({
            name: obj.name.replace(prefix, ''),
            url,
            size: obj.size ?? 0,
            lastModified: obj.lastModified?.toISOString() || '',
          });
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    } catch (err) {
      this.logger.warn(`Gallery fetch failed: ${err.message}`);
    }
    return photos;
  }

  async downloadFile(clubId: string, filename: string): Promise<Readable> {
    const objectName = this.objectName(clubId, filename);
    return this.client.getObject(BUCKET, objectName);
  }
}
