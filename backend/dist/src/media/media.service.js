"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const Minio = __importStar(require("minio"));
const BUCKET = 'college-club-media';
let MediaService = MediaService_1 = class MediaService {
    logger = new common_1.Logger(MediaService_1.name);
    client;
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
    async ensureBucket() {
        try {
            const exists = await this.client.bucketExists(BUCKET);
            if (!exists)
                await this.client.makeBucket(BUCKET, 'us-east-1');
        }
        catch (err) {
            this.logger.warn(`MinIO bucket init failed (MinIO may not be running): ${err.message}`);
        }
    }
    objectName(clubId, filename) {
        return `clubs/${clubId}/${filename}`;
    }
    async uploadFiles(clubId, files) {
        const results = [];
        for (const file of files) {
            const name = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
            const objectName = this.objectName(clubId, name);
            try {
                await this.client.putObject(BUCKET, objectName, file.buffer, file.size, { 'Content-Type': file.mimetype });
                const url = await this.client.presignedGetObject(BUCKET, objectName, 7 * 24 * 60 * 60);
                results.push({ name, url, size: file.size });
            }
            catch (err) {
                this.logger.warn(`Failed to upload ${name}: ${err.message}`);
                results.push({ name, error: 'Upload failed – check if MinIO is running' });
            }
        }
        return results;
    }
    async getGallery(clubId) {
        const prefix = `clubs/${clubId}/`;
        const photos = [];
        try {
            await new Promise((resolve, reject) => {
                const stream = this.client.listObjects(BUCKET, prefix, true);
                stream.on('data', async (obj) => {
                    if (!obj.name)
                        return;
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
        }
        catch (err) {
            this.logger.warn(`Gallery fetch failed: ${err.message}`);
        }
        return photos;
    }
    async downloadFile(clubId, filename) {
        const objectName = this.objectName(clubId, filename);
        return this.client.getObject(BUCKET, objectName);
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MediaService);
//# sourceMappingURL=media.service.js.map