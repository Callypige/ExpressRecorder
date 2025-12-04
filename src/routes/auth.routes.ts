import { Router } from 'express';
import { register, login, getCurrentUser, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/user', requireAuth, getCurrentUser);
router.post('/logout', logout);

export default router;
