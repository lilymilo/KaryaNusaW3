import express from 'express';
import multer from 'multer';
import { createProduct, getProducts, getProductById, deleteProduct, updateProduct, addRating } from '../controller/productController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allowed MIME types — explicit list for cross-browser compatibility (especially mobile)
const ALLOWED_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed', 'application/x-zip',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip', 'text/plain',
  'application/octet-stream' // fallback — many mobile browsers send ZIP/RAR as this
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file tidak didukung: ${file.mimetype}`), false);
  }
};

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

const productUpload = upload.fields([
  { name: 'covers', maxCount: 4 },
  { name: 'main_file', maxCount: 1 },
  { name: 'images', maxCount: 5 } // backward compat for old clients
]);

router.get('/', optionalProtect, getProducts);
router.get('/:id', getProductById);
router.post('/', protect, productUpload, createProduct);
router.put('/:id', protect, productUpload, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/rating', protect, addRating);

export default router;