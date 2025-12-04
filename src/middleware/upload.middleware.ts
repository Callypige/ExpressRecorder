import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

/*
    Middleware for handling audio file uploads using Multer.
    Ensures only audio files are accepted and limits file size to 50 MB.
*/

// Path of the uploads directory
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration for audio file uploads
const upload = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true); // Accept file
    } else {
      cb(new Error('Seuls les fichiers audio sont autorisés !'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Limit of 50 MB
  }
});

export { upload, uploadsDir };