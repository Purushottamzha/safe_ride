import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);

  if (isImage || isDocument) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: images (jpg/png/gif/webp) and documents (pdf/doc/docx)`,
      ),
      false,
    );
  }
};

export const multerConfig = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (
      _req: unknown,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const ext = extname(file.originalname);
      const filename = `${uuidv4()}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};
