const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'expressrecorder-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get or create user session
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'Username is required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      return res.json({ user: { id: user.id, username: user.username } });
    }

    // Create new user
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
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
app.get('/api/user', (req, res) => {
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
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// Upload recording
app.post('/api/recordings', upload.single('recording'), (req, res) => {
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
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save recording' });
      }

      res.json({
        id: this.lastID,
        filename: req.file.filename,
        original_name: req.file.originalname,
        type: type || 'voice',
        size: req.file.size,
        duration: duration || null
      });
    }
  );
});

// Get user's recordings
app.get('/api/recordings', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  db.all(
    'SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err, recordings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ recordings });
    }
  );
});

// Delete recording
app.delete('/api/recordings/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const recordingId = req.params.id;

  // Get recording info to delete file
  db.get(
    'SELECT * FROM recordings WHERE id = ? AND user_id = ?',
    [recordingId, req.session.userId],
    (err, recording) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      // Delete file
      const filePath = path.join(uploadsDir, recording.filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting file:', err);
        }
      });

      // Delete database record
      db.run(
        'DELETE FROM recordings WHERE id = ? AND user_id = ?',
        [recordingId, req.session.userId],
        (err) => {
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
