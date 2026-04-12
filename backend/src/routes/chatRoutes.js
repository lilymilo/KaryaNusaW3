import express from 'express';
import { getMessages, getConversations, sendMessage, getPartnerProfile, getUnreadCount, markAsRead, searchUsers } from '../controller/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread', protect, getUnreadCount);
router.get('/search', protect, searchUsers);
router.post('/read/:otherUserId', protect, markAsRead);
router.get('/messages/:otherUserId', protect, getMessages);
router.get('/profile/:identifier', protect, getPartnerProfile);
router.post('/send', protect, sendMessage);

export default router;
