import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { topics } from '../config/topics';

const router = express.Router();

router.get('/topics', (req, res) => {
  res.json(topics);
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

router.get('/dashboard', protect as any, (req: any, res) => {
  res.json({ 
    message: 'Welcome to the protected dashboard area!',
    user: req.user
  });
});

export default router;
