import express from 'express';
import multer from 'multer';
const router = express.Router();
import { register, login, walletLogin, linkWallet, getAccount, logout, updateProfile, setPassword } from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.post('/wallet-login', walletLogin);
router.post('/link-wallet', protect, linkWallet);
router.post('/logout', logout);

router.get('/profile', protect, getAccount);
router.get('/me', protect, getAccount);
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'shop_logo', maxCount: 1 },
  { name: 'shop_banner', maxCount: 1 }
]), updateProfile);
router.put('/set-password', protect, setPassword);

export default router;