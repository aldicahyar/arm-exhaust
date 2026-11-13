import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { diskStorage } from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer?: Buffer;
      }
    }
  }
}

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (5 * 1024 * 1024)
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface MediaUploadResult {
  url: string;
  filename: string;
  size: number;
}

export const multerUploadOptions = {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (
    _req: any,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!file || !ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      cb(
        new BadRequestException(
          'Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
  storage: diskStorage({
    destination: (
      _req: any,
      _file: any,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: (
      _req: any,
      file: { originalname: string },
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const baseName = path.basename(file?.originalname ?? 'file');
      const cleanName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${cleanName}`;
      cb(null, filename);
    },
  }),
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  sanitizeFilename(originalname: string): string {
    const baseName = path.basename(originalname ?? 'file');
    const cleanName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${Date.now()}-${cleanName}`;
  }

  async saveMedia(file?: Express.Multer.File): Promise<MediaUploadResult> {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan atau field "file" wajib diunggah.');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new BadRequestException(
        'Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Ukuran file melebihi batas maksimal 5MB.');
    }

    let filename = file.filename;

    if (!filename) {
      filename = this.sanitizeFilename(file.originalname);
      if (!fs.existsSync(UPLOAD_DIR)) {
        await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
      }
      if (file.buffer) {
        await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
      }
    }

    this.logger.log(`Media uploaded successfully: ${filename} (${file.size} bytes)`);

    return {
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
    };
  }

  async saveFile(file?: Express.Multer.File): Promise<MediaUploadResult> {
    return this.saveMedia(file);
  }

  async uploadFile(file?: Express.Multer.File): Promise<MediaUploadResult> {
    return this.saveMedia(file);
  }
}
