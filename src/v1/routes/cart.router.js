const express = require('express');
const router = express.Router();

const { emptyCart, getUserCart, userCart } = require('../controllers/cart.controller');
const { verifyAccessToken } = require('../utils/jwt_helpers');

router.post('/v1/api/user/cart', verifyAccessToken, userCart);
router.get('/v1/api/user/cart', verifyAccessToken, getUserCart);
router.delete('/v1/api/user/cart', verifyAccessToken, emptyCart);

module.exports = router;
