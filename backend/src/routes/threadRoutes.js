import express from 'express';
import { getFeed, createThread, toggleLike, getThread, replyToThread, repostThread, deleteThread, getUserThreads } from '../controller/threadController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getFeed);
router.get('/user/:userId', optionalProtect, getUserThreads);
router.post('/', protect, createThread);
router.post('/:id/like', protect, toggleLike);
router.get('/:id', optionalProtect, getThread);
router.post('/:id/reply', protect, replyToThread);
router.post('/:id/repost', protect, repostThread);
router.delete('/:id', protect, deleteThread);

export default router;
