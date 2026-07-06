import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.resolve('./uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    category: 'images' | 'documents' = 'images',
  ): Promise<{ url: string; filename: string }> {
    this.validateFile(file, category);

    const ext = path.extname(file.originalname) || '.bin';
    const filename = `${uuidv4()}${ext}`;
    const categoryDir = path.join(this.uploadDir, category);

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    const filePath = path.join(categoryDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/${category}/${filename}`;
    return { url, filename };
  }

  deleteFile(fileUrl: string): void {
    const filePath = path.join(this.uploadDir, fileUrl.replace(/^\/uploads\//, ''));
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(this.uploadDir))) {
      throw new BadRequestException('Invalid file path');
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      this.logger.log(`Deleted file: ${resolvedPath}`);
    }
  }

  private validateFile(
    file: Express.Multer.File,
    category: 'images' | 'documents',
  ): void {
    if (category === 'images') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        );
      }
      if (file.size > IMAGE_MAX_SIZE) {
        throw new BadRequestException(
          `Image too large. Maximum size: ${IMAGE_MAX_SIZE / 1024 / 1024}MB`,
        );
      }
    } else {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid document type. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
        );
      }
      if (file.size > DOCUMENT_MAX_SIZE) {
        throw new BadRequestException(
          `Document too large. Maximum size: ${DOCUMENT_MAX_SIZE / 1024 / 1024}MB`,
        );
      }
    }
  }
}
