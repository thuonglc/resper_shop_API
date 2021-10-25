import express from 'express';
import { createCoupon, deleteCoupon, getCoupons } from '../controllers/couponController.js';
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js';
const router = express.Router();

router.post('/coupon', verifyAccessToken, verifyAdminRole, createCoupon);
router.get('/coupons', verifyAccessToken, verifyAdminRole, getCoupons);
router.delete('/coupons/:couponId', verifyAccessToken, verifyAdminRole, deleteCoupon);

export default router;
