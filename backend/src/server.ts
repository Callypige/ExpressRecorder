import express, { Request, Response } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import { sessionConfig } from './config/session.config';
import authRoutes from './routes/auth.routes';
import recordingsRoutes from './routes/recordings.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway/production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Routes
app.use('/api', authRoutes);
app.use('/api/recordings', recordingsRoutes);

// Home page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
});

// Error pages
app.get('/error', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'error.html'));
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).sendFile(path.join(__dirname, '..', '..', 'frontend', 'error.html'));
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).sendFile(path.join(__dirname, '..', '..', 'frontend', 'error.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ExpressRecorder server running on http://localhost:${PORT}`);
  console.log(`📦 Database: PostgreSQL`);
  console.log(`☁️  Storage: Cloudinary`);
});
