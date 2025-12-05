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

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api', authRoutes);
app.use('/api/recordings', recordingsRoutes);

// Home page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ExpressRecorder server running on http://localhost:${PORT}`);
  console.log(`📦 Database: PostgreSQL`);
  console.log(`☁️  Storage: Cloudinary`);
});
