import express from 'express';
import multer from 'multer';
import { createProduct, getProducts, getProductById, deleteProduct, updateProduct, addRating } from '../controller/productController.js';
import { protect, sellerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, sellerOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, sellerOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);
router.post('/:id/rating', protect, addRating);

export default router;