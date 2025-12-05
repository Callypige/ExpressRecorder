import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

/*
    Middleware for handling audio file uploads using Multer and Cloudinary.
    Files are uploaded directly to Cloudinary cloud storage.
    Ensures only audio files are accepted and limits file size to 50 MB.
*/

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'express-recorder',
      resource_type: 'auto',
      allowed_formats: ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac'],
      public_id: `recording-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
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

export { upload, cloudinary };