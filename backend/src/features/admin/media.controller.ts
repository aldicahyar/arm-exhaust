import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionAuthGuard } from '../../shared/guards/session-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { MediaService, MediaUploadResult, multerUploadOptions } from './media.service';

@Controller('admin/media')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerUploadOptions))
  async uploadFile(@UploadedFile() file?: Express.Multer.File): Promise<MediaUploadResult> {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan atau field "file" wajib diunggah.');
    }
    return this.mediaService.saveMedia(file);
  }
}
