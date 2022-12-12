const express = require('express');
const router = express.Router();
const {
	createCoupon,
	deleteCoupon,
	getCoupons,
	updateCoupon,
} = require('../controllers/coupon.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.post('/v1/api/coupon', verifyAccessToken, verifyAdminRole, createCoupon);
router.get('/v1/api/coupon', verifyAccessToken, verifyAdminRole, getCoupons);
router.patch('/v1/api/coupon/:id?', verifyAccessToken, verifyAdminRole, updateCoupon);
router.delete('/v1/api/coupon/:id?', verifyAccessToken, verifyAdminRole, deleteCoupon);

module.exports = router;
