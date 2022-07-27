import express from 'express'
import {
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
	updateUserImage,
	updateUserInfo,
} from '../controllers/userController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.route('/user/register').post(registerUser)
router.route('/user/change-password').post(verifyAccessToken, changePassword)
router.route('/user/google-login').post(loginByGoogle)
router.route('/user/login').post(login)
router.route('/user/profile').get(verifyAccessToken, getProfile)
router.route('/user/profile').patch(verifyAccessToken, updateUserInfo)
router.route('/user/refresh-token').post(refreshToken)
router.route('/user/active-email').post(activeEmail)
router.route('/user/forgot-password').post(forgotPassword)
router.route('/user/update-image').put(verifyAccessToken, updateUserImage)

router.route('/user/reset-password').put(resetPassword)
router.route('/user/address').get(verifyAccessToken, getUserAddress)
router.route('/user/address').post(verifyAccessToken, saveAddress)
router.route('/user/payment').post(verifyAccessToken, savePaymentMethod)

// coupon
router.route('/user/cart/coupon').post(verifyAccessToken, applyCoupon)

// wishlist
router.route('/user/wishlist').post(verifyAccessToken, addToWishlist)
router.route('/user/wishlist').get(verifyAccessToken, addToWishlist)
router.route('/user/wishlist/:params').put(verifyAccessToken, removeFromWishlist)

// admin
router.get('/admin/user', verifyAccessToken, verifyAdminRole, getAllUsers)

export default router
