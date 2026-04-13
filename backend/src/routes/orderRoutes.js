import express from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus, requestPayout, getPayouts, transferBalance, getIncomingOrders } from '../controller/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getOrders);
router.post('/', protect, createOrder);
router.post('/payout', protect, requestPayout);
router.get('/payout/history', protect, getPayouts);
router.post('/transfer', protect, transferBalance);
router.get('/incoming', protect, getIncomingOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

export default router;
