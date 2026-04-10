import express from 'express';
import { getMessages, getConversations, sendMessage, getPartnerProfile } from '../controller/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/messages/:otherUserId', protect, getMessages);
router.get('/profile/:identifier', protect, getPartnerProfile);
router.post('/send', protect, sendMessage);

export default router;
