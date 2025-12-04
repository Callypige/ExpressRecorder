import express, { Request, Response } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import { uploadsDir } from './middleware/upload.middleware';
import { sessionConfig } from './config/session.config';
import authRoutes from './routes/auth.routes';
import recordingsRoutes from './routes/recordings.routes';

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
app.use('/api', authRoutes);
app.use('/api/recordings', recordingsRoutes);

// Home page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`ExpressRecorder server running on http://localhost:${PORT}`);
});
