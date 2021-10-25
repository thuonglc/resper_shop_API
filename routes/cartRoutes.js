import express from 'express';
import { emptyCart, getUserCart, userCart } from '../controllers/cartController.js';
import { verifyAccessToken } from '../utils/jwt_helpers.js';
const router = express.Router();

router.post('/user/cart', verifyAccessToken, userCart); // save cart
router.get('/user/cart', verifyAccessToken, getUserCart); // get cart
router.delete('/user/cart', verifyAccessToken, emptyCart); // empty cart

export default router;
