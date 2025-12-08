import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createRecording, getRecordings, deleteRecording, updateRecording } from '../controllers/recordings.controller';

const router = Router();

// Recording routes
router.post('/', requireAuth, createRecording);
router.get('/', requireAuth, getRecordings);
router.patch('/:id', requireAuth, updateRecording);
router.delete('/:id', requireAuth, deleteRecording);

export default router;
