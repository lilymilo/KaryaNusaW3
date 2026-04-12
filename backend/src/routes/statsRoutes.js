import express from 'express';
import { getSellerStats } from '../controller/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/seller', protect, getSellerStats);

export default router;
