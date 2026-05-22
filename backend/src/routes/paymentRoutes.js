import express from 'express';
import { createQrisPayment, handleMidtransWebhook, getPaymentStatus } from '../controller/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected — user harus login
router.post('/create-qris', protect, createQrisPayment);
router.get('/status/:orderId', protect, getPaymentStatus);

// Public — Midtrans webhook (TANPA auth middleware)
router.post('/webhook', handleMidtransWebhook);

export default router;


