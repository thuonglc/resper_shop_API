import express from 'express'
import { createSub, deleteSub, getSubs, readSub, updateSub } from '../controllers/subController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.post('/sub', verifyAccessToken, verifyAdminRole, createSub)
router.get('/sub', getSubs)
router.get('/sub/:id', readSub)
router.patch('/sub/:id?', verifyAccessToken, verifyAdminRole, updateSub)
router.delete('/sub/:id?', verifyAccessToken, verifyAdminRole, deleteSub)

export default router
