import express from 'express';
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart } from '../controller/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCart);
router.post('/', protect, addCartItem);
router.delete('/clear', protect, clearCart);
router.put('/:id', protect, updateCartItem);
router.delete('/:id', protect, removeCartItem);

export default router;
