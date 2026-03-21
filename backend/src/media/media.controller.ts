import { Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from './media.service';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('gallery/:clubId')
  @UseGuards(AuthGuard('jwt'))
  async getGallery(@Param('clubId') clubId: string) {
    return this.mediaService.getGallery(clubId);
  }

  @Post('upload/:clubId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files', 20, { storage: memoryStorage() }))
  async uploadFiles(
    @Param('clubId') clubId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.mediaService.uploadFiles(clubId, files);
  }

  @Get('download/:clubId/:filename')
  @UseGuards(AuthGuard('jwt'))
  async downloadFile(
    @Param('clubId') clubId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const stream = await this.mediaService.downloadFile(clubId, filename);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }
}
