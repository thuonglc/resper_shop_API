import express from 'express'
import { removes } from '../cloudinary.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.post('/removeimage', verifyAccessToken, verifyAdminRole, removes)

export default router
