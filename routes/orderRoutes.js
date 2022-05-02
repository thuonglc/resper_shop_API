import express from 'express'
import {
	createOrder,
	deleteOrder,
	getAllOrders,
	getMyOrders,
	getOrderById,
	updateOrderStatus,
	updateOrderToPaid,
} from '../controllers/orderController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.post('/user/order', verifyAccessToken, createOrder)
router.get('/user/order/:id', verifyAccessToken, getOrderById)
router.get('/user/orders', verifyAccessToken, getMyOrders)
router.put('/user/order/:id/pay', verifyAccessToken, updateOrderToPaid)
router.delete('/user/order/:slug', verifyAccessToken, deleteOrder)

//admin
router.get('/admin/order', verifyAccessToken, verifyAdminRole, getAllOrders)
router.put('/admin/order/:id?', verifyAccessToken, verifyAdminRole, updateOrderStatus)

export default router
