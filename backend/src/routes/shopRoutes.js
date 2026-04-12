import express from 'express';
import { getShopDetails, searchShops } from '../controller/shopController.js';

const router = express.Router();

router.get('/search/users', searchShops);
router.get('/:username', getShopDetails);

export default router;
