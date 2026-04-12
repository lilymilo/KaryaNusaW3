import express from 'express';
import multer from 'multer';
import { createProduct, getProducts, getProductById, deleteProduct, updateProduct, addRating } from '../controller/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for video/audio support
});

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/rating', protect, addRating);

export default router;