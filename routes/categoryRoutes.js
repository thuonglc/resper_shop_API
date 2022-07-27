import express from 'express'
import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategorySubs,
	readCategory,
	updateCategory,
} from '../controllers/categoryController.js'
import { verifyAccessToken, verifyAdminRole } from '../utils/jwt_helpers.js'

const router = express.Router()

router.get('/category', getCategories)
router.get('/category/:id', readCategory)
router.get('/category/subs/:id?', getCategorySubs)
router.post('/category', verifyAccessToken, verifyAdminRole, createCategory)
router.patch('/category/:id?', verifyAccessToken, verifyAdminRole, updateCategory)
router.delete('/category/:id?', verifyAccessToken, verifyAdminRole, deleteCategory)

export default router
