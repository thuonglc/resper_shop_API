const express = require('express');
const router = express.Router();
const {
	createOrder,
	deleteOrder,
	getAllOrders,
	getMyOrders,
	getOrderById,
	updateOrderStatus,
	updateOrderToPaid,
} = require('../controllers/order.controller');
const { verifyAccessToken, verifyAdminRole } = require('../utils/jwt_helpers');

router.post('/v1/api/user/order', verifyAccessToken, createOrder);
router.get('/v1/api/user/order/:id', verifyAccessToken, getOrderById);
router.get('/v1/api/user/orders', verifyAccessToken, getMyOrders);
router.put('/v1/api/user/order/:id/pay', verifyAccessToken, updateOrderToPaid);
router.delete('/v1/api/user/order/:slug', verifyAccessToken, deleteOrder);

//admin
router.get('/v1/api/admin/order', verifyAccessToken, verifyAdminRole, getAllOrders);
router.patch('/v1/api/user/order/:id?', verifyAccessToken, verifyAdminRole, updateOrderStatus);

module.exports = router;
