import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import db from './database';
import { User, Recording } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Validate session secret in production
const getSessionSecret = (): string => {
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.error('ERROR: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  }
  return process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadsDir));

// Routes

// Home page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Get or create user session
app.post('/api/login', (req: Request, res: Response) => {
  const { username } = req.body;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err: Error | null, user: User) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.json({ user: { id: user.id, username: user.username } });
    }

    // Create new user
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(this: any, err: Error | null) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      req.session.userId = this.lastID;
      req.session.username = username;
      res.json({ user: { id: this.lastID, username: username } });
    });
  });
});

// Get current user
app.get('/api/user', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  res.json({ 
    user: { 
      id: req.session.userId, 
      username: req.session.username 
    } 
  });
});

// Logout
app.post('/api/logout', (req: Request, res: Response) => {
  req.session.destroy((err: Error) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Upload recording
app.post('/api/recordings', upload.single('recording'), (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { type, duration } = req.body;

  db.run(
    `INSERT INTO recordings (user_id, filename, original_name, type, size, duration) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.session.userId,
      req.file.filename,
      req.file.originalname,
      type || 'voice',
      req.file.size,
      duration || null
    ],
    function(this: any, err: Error | null) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save recording' });
      }

      res.json({
        id: this.lastID,
        filename: req.file!.filename,
        original_name: req.file!.originalname,
        type: type || 'voice',
        size: req.file!.size,
        duration: duration || null
      });
    }
  );
});

// Get user's recordings
app.get('/api/recordings', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  db.all(
    'SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err: Error | null, recordings: Recording[]) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ recordings });
    }
  );
});

// Delete recording
app.delete('/api/recordings/:id', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const recordingId = req.params.id;

  // Get recording info to delete file
  db.get(
    'SELECT * FROM recordings WHERE id = ? AND user_id = ?',
    [recordingId, req.session.userId],
    (err: Error | null, recording: Recording) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      // Delete file
      const filePath = path.join(uploadsDir, recording.filename);
      fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting file:', err);
        }
      });

      // Delete database record
      db.run(
        'DELETE FROM recordings WHERE id = ? AND user_id = ?',
        [recordingId, req.session.userId],
        (err: Error | null) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete recording' });
          }

          res.json({ message: 'Recording deleted successfully' });
        }
      );
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`ExpressRecorder server running on http://localhost:${PORT}`);
});
