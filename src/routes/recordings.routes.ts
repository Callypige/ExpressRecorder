import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createRecording, getRecordings, deleteRecording } from '../controllers/recordings.controller';

const router = Router();

// Recording routes
router.post('/', requireAuth, createRecording);
router.get('/', requireAuth, getRecordings);
router.delete('/:id', requireAuth, deleteRecording);

export default router;
