import express, { Request, Response } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import db from './database';
import { User, Recording } from './types';
import { upload, uploadsDir } from './middleware/upload.middleware';
import { sessionConfig } from './config/session.config';
import { requireAuth } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadsDir));

// Routes

// Home page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Helper function to validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Register new user
app.post('/api/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  // Validation
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Le nom d\'utilisateur est requis' });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email valide requise' });
  }
  
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hashedPassword],
      function(this: any, err: Error | null) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Ce nom d\'utilisateur ou email est déjà utilisé' });
          }
          return res.status(500).json({ error: 'Erreur lors de la création du compte' });
        }

        req.session.userId = this.lastID;
        req.session.username = username.trim();
        res.json({ 
          user: { 
            id: this.lastID, 
            username: username.trim(),
            email: email.toLowerCase().trim()
          } 
        });
      }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// Login user
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase().trim()],
    async (err: Error | null, user: User) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur de base de données' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      try {
        // Compare password with hash
        const passwordMatch = await bcrypt.compare(password, user.password!);
        
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ 
          user: { 
            id: user.id, 
            username: user.username,
            email: user.email
          } 
        });
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
      }
    }
  );
});

// Get current user
app.get('/api/user', requireAuth, (req: Request, res: Response) => {
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
app.post('/api/recordings', requireAuth, upload.single('recording'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { duration } = req.body;

  db.run(
    `INSERT INTO recordings (user_id, filename, original_name, size, duration) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.session.userId,
      req.file.filename,
      req.file.originalname,
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
        size: req.file!.size,
        duration: duration || null
      });
    }
  );
});

// Get user's recordings
app.get('/api/recordings', requireAuth, (req: Request, res: Response) => {
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
app.delete('/api/recordings/:id', requireAuth, (req: Request, res: Response) => {
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
