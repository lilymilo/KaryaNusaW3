import express from 'express';
import { getShopDetails } from '../controller/shopController.js';

const router = express.Router();

router.get('/:username', getShopDetails);

export default router;
