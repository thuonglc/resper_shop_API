import express from 'express'
import { emptyCart, getUserCart, userCart } from '../controllers/cartController.js'
import { verifyAccessToken } from '../utils/jwt_helpers.js'

const router = express.Router()

router.post('/user/cart', verifyAccessToken, userCart)
router.get('/user/cart', verifyAccessToken, getUserCart)
router.delete('/user/cart', verifyAccessToken, emptyCart)

export default router
