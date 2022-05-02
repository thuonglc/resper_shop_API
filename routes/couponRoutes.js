import express from 'express'
import {
	createCoupon,
	deleteCoupon,
	getCoupons,
	updateCoupon,
} from '../controllers/couponController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.post('/coupon', verifyAccessToken, verifyAdminRole, createCoupon)
router.get('/coupon', verifyAccessToken, verifyAdminRole, getCoupons)
router.patch('/coupon/:id?', verifyAccessToken, verifyAdminRole, updateCoupon)
router.delete('/coupon/:id?', verifyAccessToken, verifyAdminRole, deleteCoupon)

export default router
