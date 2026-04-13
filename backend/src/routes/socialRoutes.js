import express from 'express';
import { toggleFollow, checkFollowStatus, getFollowStats, addReview, getReviews, getFollowers, getFollowing } from '../controller/socialController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/follow/:target_id', protect, toggleFollow);
router.get('/follow/:target_id/status', optionalProtect, checkFollowStatus);
router.get('/stats/:userId', optionalProtect, getFollowStats);
router.get('/followers/:userId', optionalProtect, getFollowers);
router.get('/following/:userId', optionalProtect, getFollowing);

router.post('/review/:target_id', protect, addReview);
router.get('/review/:target_id', optionalProtect, getReviews);

export default router;
