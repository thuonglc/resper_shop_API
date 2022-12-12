const express = require('express');
const router = express.Router();
const {
	activeEmail,
	addToWishlist,
	applyCoupon,
	changePassword,
	forgotPassword,
	getAllUsers,
	getProfile,
	getUserAddress,
	login,
	loginByGoogle,
	refreshToken,
	registerUser,
	removeFromWishlist,
	resetPassword,
	saveAddress,
	savePaymentMethod,
	updateUserInfo,
} = require('../controllers/user.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.post('/v1/api/user/register', registerUser);
router.post('/v1/api/user/change-password', verifyAccessToken, changePassword);
router.post('/v1/api/user/google-login', loginByGoogle);
router.post('/v1/api/user/login', login);
router.get('/v1/api/user/profile', verifyAccessToken, getProfile);
router.patch('/v1/api/user/profile', verifyAccessToken, updateUserInfo);
router.post('/v1/api/user/refresh-token', refreshToken);
router.post('/v1/api/user/active-email', activeEmail);
router.post('/v1/api/user/forgot-password', forgotPassword);

router.put('/v1/api/user/reset-password', resetPassword);
router.get('/v1/api/user/address', verifyAccessToken, getUserAddress);
router.post('/v1/api/user/address', verifyAccessToken, saveAddress);
router.post('/v1/api/user/payment', verifyAccessToken, savePaymentMethod);

// coupon
router.post('/v1/api/user/cart/coupon', verifyAccessToken, applyCoupon);

// wishlist
router.post('/v1/api/user/wishlist', verifyAccessToken, addToWishlist);
router.get('/v1/api/user/wishlist', verifyAccessToken, addToWishlist);
router.put('/v1/api/user/wishlist/:params', verifyAccessToken, removeFromWishlist);

// admin
router.get('/v1/api/admin/user', verifyAccessToken, verifyAdminRole, getAllUsers);

module.exports = router;
