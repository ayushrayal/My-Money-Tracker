import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Resolve uploads directory
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'receipts');

// Ensure directory exists synchronously at module load time
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

// Configure disk storage with randomized names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `receipt-${Date.now()}-${randomHex}${safeExt}`);
  },
});

export const uploadReceipt = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF receipts are allowed.')
      );
    }
    cb(null, true);
  },
});

/**
 * Validates magic bytes of an uploaded file to prevent spoofed content types.
 */
export async function validateMagicBytes(filePath, mimeType) {
  const fd = await fs.promises.open(filePath, 'r');
  const buffer = Buffer.alloc(12);
  await fd.read(buffer, 0, 12, 0);
  await fd.close();

  // Check magic bytes
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === 'application/pdf') {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }
  if (mimeType === 'image/webp') {
    // RIFF....WEBP
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  }

  return false;
}

export { UPLOADS_DIR };

